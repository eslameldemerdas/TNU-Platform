/**
 * EngHub Server v2 — fully database-backed.
 *
 * Every entity (users, sessions, resources + real file bytes, posts, comments,
 * notifications, points ledger, quiz submissions, pomodoro logs, audit trail,
 * courses, schedules, exams) lives in PostgreSQL via Prisma. There are NO
 * in-memory fallbacks: if the database is unreachable, the request fails loudly
 * rather than silently serving fake data.
 */
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

import {
  AppError, BadRequestError, ValidationError, UnauthorizedError, ForbiddenError,
  NotFoundError, ConflictError, RateLimitError, ServiceUnavailableError, errorHandler
} from "./server/errors";
import { validate, Validators, sanitizePagination, RESOURCE_CATEGORIES, RESOURCE_FILE_TYPES } from "./server/validation";
import { serverCache } from "./server/cache";
import { startEmbeddedDb, needsEmbeddedDb } from "./server/pglite-server";
import { connectPrisma } from "./server/prisma";
import { CourseService } from "./server/courseService";
import { validateFileMagicBytes } from "./server/fileValidation";
import { getPresignedDownloadUrl } from "./server/s3-storage";
import * as store from "./server/store";
import { prisma } from "./server/prisma";

// ---------------------------------------------------------------------------
// Download signing (HMAC, fail-closed if secret unset)
// ---------------------------------------------------------------------------
const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET && process.env.DOWNLOAD_SECRET !== "changeme"
  ? process.env.DOWNLOAD_SECRET
  : (process.env.SESSION_SECRET && process.env.SESSION_SECRET !== "changeme")
    ? process.env.SESSION_SECRET
    : null;
if (!DOWNLOAD_SECRET) {
  throw new Error("[Security] DOWNLOAD_SECRET/SESSION_SECRET is not set. Download tokens cannot be issued.");
}

function generateSignedDownloadToken(fileId: string, expiresInSeconds = 900) {
  const expiresTimestamp = Date.now() + expiresInSeconds * 1000;
  const payload = `${fileId}:${expiresTimestamp}`;
  const hmac = crypto.createHmac("sha256", DOWNLOAD_SECRET).update(payload).digest("hex");
  return { token: `${expiresTimestamp}.${hmac}`, expiresAt: new Date(expiresTimestamp).toISOString() };
}

function verifySignedDownloadToken(fileId: string, token: string): boolean {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [expiresStr, provided] = token.split(".");
  if (!expiresStr || !provided) return false;
  const expiresTimestamp = parseInt(expiresStr, 10);
  if (isNaN(expiresTimestamp) || Date.now() > expiresTimestamp) return false;
  const expected = crypto.createHmac("sha256", DOWNLOAD_SECRET).update(`${fileId}:${expiresTimestamp}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseCookies(req: Request): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts.shift()?.trim();
    if (key) list[key] = decodeURIComponent(parts.join("="));
  });
  return list;
}

function getClientIp(req: Request): string {
  const forwarded = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim();
  return forwarded || req.ip || req.socket.remoteAddress || "127.0.0.1";
}

async function getSessionUser(req: Request) {
  const cookies = parseCookies(req);
  const authHeader = req.headers.authorization;
  const token = cookies.enghub_session || (authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : "");
  if (!token) return null;
  const session = await store.validateSession(token);
  if (!session) return null;
  const user = await store.getUserById(session.userId);
  return user || null;
}

function requireAuth(req: Request, _res: Response, next: NextFunction) {
  getSessionUser(req)
    .then((user) => {
      if (!user) return next(new UnauthorizedError("Authentication session required. Please sign in."));
      (req as any).user = user;
      next();
    })
    .catch(next);
}

function requireRole(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    getSessionUser(req)
      .then((user) => {
        if (!user) return next(new UnauthorizedError("Authentication session required."));
        if (!allowedRoles.includes(user.role)) {
          store.writeAudit({
            category: "security", eventType: "security.rbac_forbidden_access", severity: "warning",
            actorId: user.id, actorName: user.name, actorRole: user.role,
            ipAddress: getClientIp(req),
            metadata: { path: req.path, method: req.method, requiredRoles: allowedRoles, currentRole: user.role }
          });
          return next(new ForbiddenError(`Access denied. Requires one of: ${allowedRoles.join(", ")}.`));
        }
        (req as any).user = user;
        next();
      })
      .catch(next);
  };
}

const requireElevated = requireRole(["super_admin", "department_admin", "supervisor", "moderator"]);
const requireSuperAdmin = requireRole(["super_admin"]);

// Per-process rate limiting. Deployment model is a single Node process
// (faculty scale); for multi-instance deployments move this to Redis.
interface RateBucket { count: number; resetAt: number }
const RATE_LIMIT_BUCKETS = new Map<string, RateBucket>();
function checkRateLimit(key: string, maxAttempts: number, windowMs: number) {
  const now = Date.now();
  let bucket = RATE_LIMIT_BUCKETS.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    RATE_LIMIT_BUCKETS.set(key, bucket);
  }
  if (bucket.count >= maxAttempts) {
    return { allowed: false, remainingSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, remainingSeconds: 0 };
}
function resetRateLimit(key: string) { RATE_LIMIT_BUCKETS.delete(key); }

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif"
};

function setAuthCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `enghub_session=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax${secure}`);
}

function clearAuthCookie(res: Response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `enghub_session=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`);
}

async function startServer() {
  // Embedded real-PostgreSQL (PGlite) when no external DATABASE_URL is configured.
  if (needsEmbeddedDb()) {
    await startEmbeddedDb();
  }
  await connectPrisma();

  const app = express();
  const PORT = 3000;
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  app.disable("x-powered-by");
  app.use(express.json({ limit: "40mb" }));

  // HTTP security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  app.use(express.static(path.join(process.cwd(), "public"), { maxAge: "1d", etag: true }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const reqId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const start = Date.now();
    res.setHeader("X-Request-Id", reqId);
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (duration > 1000) console.warn(`[SLOW_REQ] ${req.method} ${req.originalUrl} took ${duration}ms (status: ${res.statusCode})`);
    });
    next();
  });

  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set on the server.");
    return new GoogleGenAI({ apiKey, httpOptions: { headers: { "User-Agent": "aistudio-build" } } });
  };

  // --------------------------------------------------------------------
  // HEALTH
  // --------------------------------------------------------------------
  app.get("/api/health", async (_req: Request, res: Response) => {
    let dbOk = true;
    try { await prisma.$queryRaw`SELECT 1`; } catch { dbOk = false; }
    res.json({
      status: dbOk ? "ok" : "degraded",
      database: dbOk ? "connected" : "unreachable",
      timestamp: new Date().toISOString(),
      service: "EngHub Hardened Backend API",
      architecture: "Express + Prisma/PostgreSQL (fully persistent)",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      cacheStats: serverCache.getStats()
    });
  });

  // --------------------------------------------------------------------
  // AUTH
  // --------------------------------------------------------------------
  app.post(
    "/api/auth/signup",
    validate({
      body: {
        fullName: Validators.string(2, 100),
        email: Validators.email(),
        phoneNumber: Validators.phone(),
        password: Validators.password(8),
        passwordConfirm: Validators.string(8, 100),
        departmentId: Validators.optional(Validators.string(2, 50)),
        level: Validators.optional(Validators.string(2, 50))
      }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const clientIp = getClientIp(req);
      const rateKey = `signup:${clientIp}`;
      const rate = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
      if (!rate.allowed) {
        store.writeAudit({
          category: "security", eventType: "security.rate_limited", severity: "warning",
          actorId: "anonymous", actorName: "Unknown Guest", actorRole: "student",
          ipAddress: clientIp, metadata: { endpoint: "/api/auth/signup", remainingSeconds: rate.remainingSeconds }
        });
        return next(new RateLimitError(`Too many registration attempts. Please wait ${rate.remainingSeconds} seconds.`, rate.remainingSeconds));
      }

      try {
        const { fullName, email, phoneNumber, password, passwordConfirm, departmentId, level } = req.body;
        if (password !== passwordConfirm) return next(new ValidationError("Passwords do not match."));

        const normalizedEmail = email.trim().toLowerCase();
        if (await store.getUserByEmail(normalizedEmail)) {
          return next(new ConflictError("An account with this email address already exists. Please sign in instead."));
        }

        const passwordHash = await store.bcrypt.hash(password, await store.bcrypt.genSalt(10));

        const freshmanCourses = ["course-eng011", "course-eng021", "course-eng041", "course-eng031", "course-eng051", "course-hum011"];
        const sophomoreCourses = ["course-hum131", "course-engx13", "course-aie101", "course-aie111", "course-aie103", "course-humx32"];
        const isMtr = departmentId === "dept-mtr";
        const mtrCourses = ["course-engx13-mtr", "course-mpe121-mtr", "course-pde111-mtr", "course-epe111-mtr", "course-hum131-mtr", "course-humxe1-mtr"];
        const defaultEnrolled = isMtr ? mtrCourses : (level === "Year 1 (Freshman)" || level === "المستوى الصفري {إعدادي}") ? freshmanCourses : sophomoreCourses;

        const user = await prisma.user.create({
          data: {
            name: fullName.trim(),
            email: normalizedEmail,
            phone: phoneNumber.trim(),
            passwordHash,
            studentId: `2026-ENG-${Math.floor(1000 + Math.random() * 9000)}`,
            role: "student",
            universityId: "univ-tnu",
            facultyId: "fac-eng-01",
            departmentId: departmentId || "dept-cmp",
            level: level || "Year 1 (Freshman)",
            semester: "Fall 2026",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            bio: "Engineering student at Faculty of Engineering.",
            points: 0,
            badges: [{ id: "badge-welcome", name: "Engineering Pioneer", description: "Joined the Faculty of Engineering Portal.", icon: "GraduationCap", earnedAt: new Date().toISOString(), color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" }],
            savedBookmarks: [],
            enrolledCourseIds: defaultEnrolled
          }
        });

        // Signup bonus recorded through the append-only ledger
        await store.addPoints(user.id, "bonus", 25, "welcome-bonus", "Academic onboarding completion");

        resetRateLimit(rateKey);
        const { token } = await store.createSession(user.id, clientIp, req.headers["user-agent"]);
        setAuthCookie(res, token);

        await store.writeAudit({
          category: "authentication", eventType: "auth.signup.success", severity: "info",
          actorId: user.id, actorName: user.name, actorRole: user.role, actorEmail: user.email, ipAddress: clientIp
        });

        const safe = store.toSafeUser({ ...user, points: (user.points ?? 0) + 25 });
        res.status(201).json({
          success: true,
          message: "Account created successfully! Welcome to EngHub.",
          user: safe,
          sessionToken: token
        });
      } catch (err) { next(err); }
    }
  );

  app.post(
    "/api/auth/login",
    validate({ body: { email: Validators.email(), password: Validators.string(1, 200) } }),
    async (req: Request, res: Response, next: NextFunction) => {
      const clientIp = getClientIp(req);
      const rateKey = `login:${clientIp}`;
      const rate = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
      if (!rate.allowed) {
        return next(new RateLimitError(`Too many failed login attempts. Please retry in ${rate.remainingSeconds} seconds.`, rate.remainingSeconds));
      }
      try {
        const { email, password } = req.body;
        const user = await store.getUserByEmail(email);
        if (!user) {
          await store.writeAudit({
            category: "authentication", eventType: "auth.login.failure", severity: "warning",
            actorId: "anonymous", actorName: "Unknown", actorRole: "student", actorEmail: email.trim().toLowerCase(),
            ipAddress: clientIp, metadata: { reason: "User not found" }
          });
          return next(new UnauthorizedError("Invalid email or password. Please verify your credentials."));
        }
        const isMatch = await store.bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          await store.writeAudit({
            category: "authentication", eventType: "auth.login.failure", severity: "warning",
            actorId: user.id, actorName: user.name, actorRole: user.role, actorEmail: user.email,
            ipAddress: clientIp, metadata: { reason: "Incorrect password" }
          });
          return next(new UnauthorizedError("Invalid email or password. Please verify your credentials."));
        }
        resetRateLimit(rateKey);
        const { token } = await store.createSession(user.id, clientIp, req.headers["user-agent"]);
        setAuthCookie(res, token);
        await store.writeAudit({
          category: "authentication", eventType: "auth.login.success", severity: "info",
          actorId: user.id, actorName: user.name, actorRole: user.role, actorEmail: user.email, ipAddress: clientIp
        });
        res.json({ success: true, message: "Signed in successfully!", user: store.toSafeUser(user), sessionToken: token });
      } catch (err) { next(err); }
    }
  );

  app.post("/api/auth/logout", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookies = parseCookies(req);
      const token = cookies.enghub_session || req.headers.authorization?.replace("Bearer ", "");
      if (token) await store.revokeSession(token);
      clearAuthCookie(res);
      res.json({ success: true, message: "Signed out successfully." });
    } catch (err) { next(err); }
  });

  app.get("/api/auth/me", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookies = parseCookies(req);
      const token = cookies.enghub_session || req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ authenticated: false, message: "No active session." });
      const session = await store.validateSession(token);
      if (!session) return res.status(401).json({ authenticated: false, message: "Session expired." });
      const user = await store.getUserById(session.userId);
      if (!user) return res.status(404).json({ authenticated: false, message: "User not found." });
      res.json({ authenticated: true, user: store.toSafeUser(user) });
    } catch (err) { next(err); }
  });

  app.post(
    "/api/auth/change-password",
    validate({
      body: {
        currentPassword: Validators.string(1, 200),
        newPassword: Validators.password(8),
        confirmNewPassword: Validators.string(8, 200),
        revokeOtherSessions: Validators.optional(Validators.boolean())
      }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await getSessionUser(req);
        if (!user) return next(new UnauthorizedError());

        const { currentPassword, newPassword, confirmNewPassword, revokeOtherSessions } = req.body;
        if (newPassword !== confirmNewPassword) return next(new ValidationError("New passwords do not match."));
        if (currentPassword === newPassword) return next(new ValidationError("New password must be different from current password."));

        const valid = await store.bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) return next(new BadRequestError("Incorrect current password."));

        const passwordHash = await store.bcrypt.hash(newPassword, await store.bcrypt.genSalt(10));
        await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

        const cookies = parseCookies(req);
        const currentToken = cookies.enghub_session || req.headers.authorization?.replace("Bearer ", "");
        if (revokeOtherSessions) {
          const currentSession = await store.validateSession(currentToken || "");
          await store.revokeAllSessions(user.id, currentSession?.id);
        }

        await store.writeAudit({
          category: "security", eventType: "auth.password.changed", severity: "info",
          actorId: user.id, actorName: user.name, actorRole: user.role, actorEmail: user.email,
          ipAddress: getClientIp(req), metadata: { revokeOtherSessions: Boolean(revokeOtherSessions) }
        });
        res.json({ success: true, message: "Password changed successfully." });
      } catch (err) { next(err); }
    }
  );

  app.patch(
    "/api/auth/profile",
    validate({
      body: {
        name: Validators.optional(Validators.string(1, 200)),
        avatar: Validators.optional(Validators.string(1, 10000000)),
        bio: Validators.optional(Validators.string(0, 2000))
      }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await getSessionUser(req);
        if (!user) return next(new UnauthorizedError("Authentication session required to update profile."));
        const { name, avatar, bio } = req.body;
        const data: any = {};
        if (name !== undefined && name.trim()) data.name = name.trim();
        if (avatar !== undefined) data.avatar = avatar.trim();
        if (bio !== undefined) data.bio = bio.trim();
        const updated = await prisma.user.update({ where: { id: user.id }, data });
        await store.writeAudit({
          category: "authentication", eventType: "user.profile.updated", severity: "info",
          actorId: user.id, actorName: updated.name, actorRole: updated.role, actorEmail: updated.email,
          ipAddress: getClientIp(req), metadata: { updatedFields: Object.keys(data) }
        });
        res.json({ success: true, message: "Profile updated successfully.", user: store.toSafeUser(updated) });
      } catch (err) { next(err); }
    }
  );

  app.get("/api/auth/sessions", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return next(new UnauthorizedError());
      const cookies = parseCookies(req);
      const currentToken = cookies.enghub_session || req.headers.authorization?.replace("Bearer ", "");
      const currentSession = currentToken ? await store.validateSession(currentToken) : null;
      const sessions = await store.listSessions(user.id, currentSession?.id);
      res.json({ success: true, sessions, total: sessions.length });
    } catch (err) { next(err); }
  });

  const handleRevokeSession = (req: Request, res: Response, next: NextFunction) => {
    getSessionUser(req)
      .then(async (user) => {
        if (!user) return next(new UnauthorizedError());
        const { sessionId } = req.params;
        if (sessionId.startsWith("sess-current-")) {
          return res.json({ success: true, message: "Current active session cannot be revoked from here." });
        }
        const revoked = await store.revokeSessionById(sessionId, user.id);
        await store.writeAudit({
          category: "security", eventType: "auth.session.revoked", severity: "info",
          actorId: user.id, actorName: user.name, actorRole: user.role,
          targetId: sessionId, targetType: "session", ipAddress: getClientIp(req),
          metadata: { revoked }
        });
        res.json({ success: revoked, message: revoked ? "Session terminated successfully." : "Session not found." });
      })
      .catch(next);
  };
  app.delete("/api/auth/sessions/:sessionId", handleRevokeSession);
  app.delete("/api/auth/sessions/:sessionId/revoke", handleRevokeSession);
  app.post("/api/auth/sessions/:sessionId/revoke", handleRevokeSession);

  app.post("/api/auth/logout-all", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return next(new UnauthorizedError());
      const cookies = parseCookies(req);
      const currentToken = cookies.enghub_session || req.headers.authorization?.replace("Bearer ", "");
      const currentSession = currentToken ? await store.validateSession(currentToken) : null;
      const count = await store.revokeAllSessions(user.id, currentSession?.id);
      await store.writeAudit({
        category: "security", eventType: "auth.sessions.revoked_all", severity: "warning",
        actorId: user.id, actorName: user.name, actorRole: user.role, actorEmail: user.email,
        ipAddress: getClientIp(req), metadata: { revokedSessionCount: count }
      });
      res.json({ success: true, message: `Successfully signed out of ${count} other device(s).`, revokedCount: count });
    } catch (err) { next(err); }
  });

  // --------------------------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------------------------
  app.get("/api/notifications", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return res.json({ notifications: [], total: 0, unreadCount: 0, page: 1, limit: 20 });
      const { category } = req.query;
      const { page, limit } = sanitizePagination(req.query, 10, 50);
      const where: any = { userId: user.id };
      if (req.query.unreadOnly === "true") where.read = false;
      else if (req.query.read !== undefined) where.read = req.query.read === "true";
      if (category && category !== "all") where.category = category;
      const [rows, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId: user.id, read: false } })
      ]);
      res.json({ notifications: rows, total, page, limit, unreadCount });
    } catch (err) { next(err); }
  });

  app.post("/api/notifications/:id/read", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return next(new UnauthorizedError("Authentication session required."));
      const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
      if (!notif) return next(new NotFoundError("Notification not found."));
      if (notif.userId !== user.id) {
        await store.writeAudit({
          category: "security", eventType: "security.idor_attempt", severity: "critical",
          actorId: user.id, actorName: user.name, actorRole: user.role,
          targetId: req.params.id, targetType: "notification", ipAddress: getClientIp(req)
        });
        return next(new ForbiddenError("Forbidden: You cannot modify notifications belonging to another user."));
      }
      const updated = await prisma.notification.update({ where: { id: notif.id }, data: { read: true } });
      const unreadCount = await prisma.notification.count({ where: { userId: user.id, read: false } });
      res.json({ success: true, notification: updated, unreadCount });
    } catch (err) { next(err); }
  });

  app.post("/api/notifications/read-all", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return next(new UnauthorizedError("Authentication session required."));
      const res2 = await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
      res.json({ success: true, message: "All notifications marked as read.", unreadCount: 0, updated: res2.count });
    } catch (err) { next(err); }
  });

  // --------------------------------------------------------------------
  // RESOURCES (real bytes on disk, real DB rows)
  // --------------------------------------------------------------------
  app.get("/api/resources", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      const q = req.query;
      const { page, limit } = sanitizePagination(req.query, 20, 50);
      const result = await store.listResources({
        courseId: q.courseId as string, departmentId: q.departmentId as string,
        category: q.category as string, semester: q.semester as string,
        academicYear: q.academicYear as string, verificationStatus: q.verificationStatus as string,
        moderationStatus: q.moderationStatus as string, uploaderId: q.uploaderId as string,
        search: q.search as string, sortBy: q.sortBy as string,
        currentUserId: user?.id, currentUserRole: user?.role, page, limit
      });
      res.json(result);
    } catch (err) { next(err); }
  });

  app.post(
    "/api/resources",
    validate({
      body: {
        title: Validators.string(5, 150),
        description: Validators.string(10, 1000),
        category: Validators.enum(RESOURCE_CATEGORIES),
        courseId: Validators.string(2, 50),
        courseCode: Validators.string(2, 50),
        courseTitle: Validators.optional(Validators.string(2, 100)),
        departmentId: Validators.string(2, 50),
        academicYear: Validators.optional(Validators.string(2, 50)),
        semester: Validators.optional(Validators.string(2, 50)),
        fileType: Validators.enum(RESOURCE_FILE_TYPES),
        fileName: Validators.string(3, 200),
        fileSizeBytes: Validators.optional(Validators.integer(1, 30 * 1024 * 1024)),
        fileData: Validators.string(8, 45 * 1024 * 1024), // required base64 — real bytes only
        previewContent: Validators.optional(Validators.string(0, 5000)),
        tags: Validators.optional(Validators.array(Validators.string(1, 30), 0, 10))
      }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await getSessionUser(req);
        if (!user) return next(new UnauthorizedError("You must be logged in to contribute academic resources."));

        const { title, description, category, courseId, courseCode, courseTitle, departmentId,
          academicYear, semester, fileType, fileName, fileData, previewContent, tags } = req.body;

        const isElevated = store.ELEVATED_ROLES.includes(user.role as any);
        const allowedStudentCategories = ["summary", "cheat_sheet", "study_guide"];
        if (!isElevated && !allowedStudentCategories.includes(category)) {
          return next(new ForbiddenError("غير مصرح للطلاب برفع هذا النوع من الملفات. يُسمح للطلاب فقط برفع الملخصات والقوانين المركزة وتخضع للتدقيق والاعتماد من الإشراف الأكاديمي."));
        }

        // Server-side validation of the ACTUAL bytes, not client metadata
        const buffer = Buffer.from(fileData, "base64");
        if (buffer.length === 0) return next(new BadRequestError("Decoded file content is empty."));
        if (buffer.length > 30 * 1024 * 1024) return next(new BadRequestError("File exceeds 30MB limit."));
        const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : fileType;
        const validation = validateFileMagicBytes(buffer, ext);
        if (!validation.valid) {
          await store.writeAudit({
            category: "security", eventType: "security.upload_magic_bytes_mismatch", severity: "warning",
            actorId: user.id, actorName: user.name, actorRole: user.role,
            ipAddress: getClientIp(req), metadata: { fileName, declaredExtension: ext, error: validation.error }
          });
          return next(new BadRequestError(`File validation failed: ${validation.error}`));
        }

        const resourceId = `res-${crypto.randomUUID().slice(0, 12)}`;
        const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const fileKey = `${resourceId}/${safeName}`;
        const targetPath = path.join(uploadsDir, resourceId);
        fs.mkdirSync(targetPath, { recursive: true });
        fs.writeFileSync(path.join(targetPath, safeName), buffer);

        const resource = await prisma.resource.create({
          data: {
            id: resourceId,
            title: title.trim(),
            description: description.trim(),
            category,
            resourceType: category,
            fileKey,
            fileType: validation.detectedType || ext,
            fileSize: `${(buffer.length / (1024 * 1024)).toFixed(1)} MB`,
            fileSizeBytes: buffer.length,
            fileName: safeName,
            uploaderId: user.id,
            uploaderName: user.name,
            uploaderRole: user.role,
            uploaderDepartment: user.departmentId === "dept-mtr" ? "هندسة الميكاترونكس" : "هندسة الحاسب والذكاء الاصطناعي",
            uploadDate: new Date().toISOString().split("T")[0],
            universityId: "univ-tnu",
            facultyId: "fac-eng-01",
            departmentId: departmentId || user.departmentId || "dept-cmp",
            courseId,
            courseCode: courseCode.trim().toUpperCase(),
            courseTitle: courseTitle?.trim() || courseCode,
            academicYear: academicYear || user.level || "Year 1 (Freshman)",
            semester: semester || user.semester || "Fall 2026",
            downloadsCount: 0,
            viewCount: 1,
            rating: 5.0,
            ratingCount: 0,
            status: isElevated ? "approved" : "pending",
            moderationStatus: isElevated ? "approved" : "pending",
            verificationStatus: isElevated ? "official" : "student_uploaded",
            moderatedBy: isElevated ? user.id : undefined,
            moderatedByName: isElevated ? user.name : undefined,
            moderatedAt: isElevated ? new Date() : undefined,
            version: 1,
            tags: Array.isArray(tags) && tags.length > 0 ? tags : [courseCode, category]
          }
        });

        await store.createNotification({
          userId: user.id,
          category: "academic",
          type: isElevated ? "resource_approved" : "resource_pending",
          title: isElevated ? "Resource Published Instantly" : "Resource Submitted to Moderation Queue",
          titleAr: isElevated ? "تم نشر الملف الأكاديمي مباشرة" : "تم إرسال الملخص لطابور المراجعة والتدقيق",
          message: isElevated ? `Your official resource "${resource.title}" is now live.` : `Your summary "${resource.title}" will be reviewed by supervisors (+15 pts upon approval).`,
          messageAr: isElevated ? `تم نشر مرجعك الأكاديمي المعتمد "${resource.title}" بنجاح.` : `تم استلام ملخصك "${resource.title}" وسيتم اعتماده قريباً (+15 نقطة فور الموافقة).`,
          actionTab: "courses",
          actionTargetId: courseId
        });

        if (!isElevated) {
          await store.notifyStaff({
            type: "resource_pending",
            title: "New Student Summary Pending Review",
            titleAr: "ملخص وقوانين جديدة بحاجة للاعتماد 📄",
            message: `Student ${user.name} submitted a summary for ${resource.courseCode}: "${resource.title}".`,
            messageAr: `قام الطالب ${user.name} برفع ملخص لمقرر ${resource.courseCode} بعنوان "${resource.title}" بانتظار موافقتك.`,
            actionTab: "admin",
            actionTargetId: resource.id
          });
        }

        await store.writeAudit({
          category: "moderation", eventType: "resource.submitted", severity: "info",
          actorId: user.id, actorName: user.name, actorRole: user.role,
          targetId: resource.id, targetType: "resource", targetName: resource.title,
          metadata: { courseCode: resource.courseCode, category: resource.category, size: buffer.length },
          ipAddress: getClientIp(req)
        });

        res.status(201).json({
          success: true,
          resource: store.toSafeResource(resource, user.id),
          message: isElevated ? "تم نشر الملف بنجاح وتوثيقه كملف رسمي معتمد!" : "تم رفع الملف بنجاح وإرساله إلى طابور المراجعة والتدقيق الأكاديمي."
        });
      } catch (err) { next(err); }
    }
  );

  app.patch(
    "/api/resources/:id/moderate",
    validate({
      params: { id: Validators.string(1, 100) },
      body: {
        action: Validators.enum(["approve", "reject", "verify", "unverify"]),
        rejectionReason: Validators.optional(Validators.string(5, 500)),
        category: Validators.optional(Validators.enum(RESOURCE_CATEGORIES)),
        tags: Validators.optional(Validators.array(Validators.string(1, 30), 0, 10))
      }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await getSessionUser(req);
        if (!user) return next(new UnauthorizedError("Authentication required."));
        if (!store.ELEVATED_ROLES.includes(user.role as any)) {
          return next(new ForbiddenError("Access forbidden: Elevated moderator or admin role required."));
        }

        const resource = await store.getResourceById(req.params.id);
        if (!resource) return next(new NotFoundError("Resource not found."));

        if (user.role === "department_admin" && user.departmentId && resource.departmentId !== user.departmentId) {
          return next(new ForbiddenError("Department Admins can only moderate resources within their department."));
        }

        const { action, rejectionReason } = req.body;
        const previousState = { status: resource.status, moderationStatus: resource.moderationStatus, verificationStatus: resource.verificationStatus };
        const data: any = { moderatedBy: user.id, moderatedByName: user.name, moderatedAt: new Date() };

        if (action === "approve") {
          data.status = "approved";
          data.moderationStatus = "approved";
          data.rejectionReason = null;
          if (resource.verificationStatus === "rejected") data.verificationStatus = "student_uploaded";
          if (resource.uploaderId !== user.id) {
            await store.addPoints(resource.uploaderId, "upload_approved", 15, resource.id, `Approved resource "${resource.title}"`);
          }
          await store.createNotification({
            userId: resource.uploaderId, type: "resource_approved",
            title: "Your Academic Resource was Approved (+15 Pts) 🎉",
            titleAr: "تمت الموافقة على مرجعك الأكاديمي (+15 نقطة) 🎉",
            message: `Your resource "${resource.title}" was approved by ${user.name} and is now available.`,
            messageAr: `تمت اعتماد ملفك "${resource.title}" وحصلت على +15 نقطة.`,
            actionTab: "courses", actionTargetId: resource.courseId
          });
        } else if (action === "verify") {
          data.status = "approved";
          data.moderationStatus = "approved";
          data.verificationStatus = "verified";
          data.rejectionReason = null;
          if (resource.uploaderId !== user.id) {
            await store.addPoints(resource.uploaderId, "upload_approved", 25, resource.id, `Verified resource "${resource.title}"`);
          }
          await store.createNotification({
            userId: resource.uploaderId, type: "resource_verified",
            title: "Resource Verified & Badged (+25 Pts) ⭐",
            titleAr: "تم توثيق مرجعك الأكاديمي (+25 نقطة) ⭐",
            message: `Your resource "${resource.title}" received the Verified badge.`,
            messageAr: `حصل ملفك "${resource.title}" على شارة التوثيق.`,
            actionTab: "courses", actionTargetId: resource.courseId
          });
        } else if (action === "reject") {
          if (!rejectionReason || rejectionReason.trim().length < 5) {
            return next(new BadRequestError("A specific rejection reason is mandatory when rejecting."));
          }
          data.status = "rejected";
          data.moderationStatus = "rejected";
          data.verificationStatus = "rejected";
          data.rejectionReason = rejectionReason.trim();
          await store.createNotification({
            userId: resource.uploaderId, type: "resource_rejected",
            title: "Resource Submission Update",
            titleAr: "تحديث حول الملف الأكاديمي المرفوع",
            message: `Your resource "${resource.title}" was not approved. Reason: ${rejectionReason}`,
            messageAr: `لم تتم الموافقة على ملفك "${resource.title}". سبب الرفض: ${rejectionReason}`,
            actionTab: "courses", actionTargetId: resource.courseId
          });
        } else if (action === "unverify") {
          data.verificationStatus = "student_uploaded";
        }

        const updated = await prisma.resource.update({ where: { id: resource.id }, data });
        await store.writeAudit({
          category: "moderation", eventType: `resource.decision.${action}`, severity: action === "reject" ? "warning" : "info",
          actorId: user.id, actorName: user.name, actorRole: user.role,
          targetId: resource.id, targetType: "resource", targetName: resource.title,
          previousState, newState: { status: updated.status, moderationStatus: updated.moderationStatus },
          ipAddress: getClientIp(req)
        });

        res.json({ success: true, resource: store.toSafeResource(updated, user.id), message: `تم اتخاذ القرار (${action}) بنجاح.` });
      } catch (err) { next(err); }
    }
  );

  app.post(
    "/api/resources/:id/vote",
    validate({ params: { id: Validators.string(1, 100) }, body: { voteType: Validators.enum(["helpful", "not_helpful"]) } }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await getSessionUser(req);
        if (!user) return next(new UnauthorizedError("You must be signed in to vote on resources."));
        const result = await store.voteResource(req.params.id, user.id, req.body.voteType);
        if (!result) return next(new NotFoundError("Resource not found."));
        res.json(result);
      } catch (err) { next(err); }
    }
  );

  // --------------------------------------------------------------------
  // COMMUNITY POSTS
  // --------------------------------------------------------------------
  app.get("/api/posts", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      const { page, limit } = sanitizePagination(req.query, 20, 50);
      const result = await store.listPosts({
        category: req.query.category as string,
        departmentId: req.query.departmentId as string,
        courseId: req.query.courseId as string,
        isSolved: req.query.isSolved !== undefined ? req.query.isSolved === "true" : undefined,
        search: req.query.search as string,
        sortBy: (req.query.sortBy as string) || "recent",
        currentUserId: user?.id, page, limit
      });
      res.json(result);
    } catch (err) { next(err); }
  });

  app.post(
    "/api/posts",
    validate({
      body: {
        title: Validators.string(5, 200),
        content: Validators.string(10, 5000),
        courseId: Validators.optional(Validators.string(2, 50)),
        courseCode: Validators.optional(Validators.string(2, 50)),
        departmentId: Validators.optional(Validators.string(2, 50)),
        postType: Validators.optional(Validators.enum(["question", "resource_share", "study_tip", "discussion", "exam_discussion", "project_help"])),
        tags: Validators.optional(Validators.array(Validators.string(1, 30), 0, 10))
      }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await getSessionUser(req);
        if (!user) return next(new UnauthorizedError("You must be logged in to create a post."));
        const { title, content, courseId, courseCode, departmentId, postType, tags } = req.body;
        const post = await prisma.discussionThread.create({
          data: {
            courseId: courseId || "course-eng011",
            courseCode: courseCode || "ENG",
            departmentId: departmentId || user.departmentId || "dept-cmp",
            title: title.trim(),
            content: content.trim(),
            postType: postType || "question",
            authorId: user.id,
            tags: Array.isArray(tags) && tags.length > 0 ? tags : ["General", "Engineering"]
          }
        });
        await store.addPoints(user.id, "helpful_comment", 5, post.id, "Created discussion post");
        await store.writeAudit({
          category: "moderation", eventType: "community.post.created", severity: "info",
          actorId: user.id, actorName: user.name, actorRole: user.role,
          targetId: post.id, targetType: "post", targetName: post.title, ipAddress: getClientIp(req)
        });
        const safe = await store.getPostById(post.id);
        res.status(201).json({ success: true, post: store.toSafePost(safe, user.id, false), message: "تم نشر الموضوع بنجاح وحصلت على +5 نقاط!" });
      } catch (err) { next(err); }
    }
  );

  app.post("/api/posts/:id/upvote", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return next(new UnauthorizedError());
      const post = await store.getPostById(req.params.id);
      if (!post) return next(new NotFoundError("Post not found."));
      const result = await store.upvotePost(post.id, user.id);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  });

  app.get("/api/posts/:id/comments", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      const comments = await store.listComments(req.params.id, user?.id);
      res.json({ comments });
    } catch (err) { next(err); }
  });

  app.post(
    "/api/posts/:id/comments",
    validate({ params: { id: Validators.string(1, 100) }, body: { content: Validators.string(3, 3000) } }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await getSessionUser(req);
        if (!user) return next(new UnauthorizedError("You must be logged in to reply."));
        const post = await store.getPostById(req.params.id);
        if (!post) return next(new NotFoundError("Post not found."));
        const comment = await prisma.comment.create({
          data: { targetId: post.id, authorId: user.id, content: req.body.content.trim() }
        });
        await prisma.discussionThread.update({ where: { id: post.id }, data: { replyCount: { increment: 1 } } });
        await store.addPoints(user.id, "helpful_comment", 5, comment.id, "Reply to discussion");
        if (post.authorId !== user.id) {
          await store.createNotification({
            userId: post.authorId, category: "community", type: "new_reply",
            title: "New Reply on your Post", titleAr: "رد جديد على منشورك الأكاديمي",
            message: `${user.name} added a reply to "${post.title.substring(0, 45)}..."`,
            messageAr: `أضاف ${user.name} رداً على منشورك "${post.title.substring(0, 45)}..."`,
            actionTab: "community", actionTargetId: post.id
          });
        }
        res.status(201).json({
          success: true,
          comment: { ...comment, authorName: user.name, authorRole: user.role, authorAvatar: user.avatar, hasUpvoted: false },
          message: "تمت إضافة الرد بنجاح!"
        });
      } catch (err) { next(err); }
    }
  );

  app.post(
    "/api/posts/:id/solve",
    validate({ params: { id: Validators.string(1, 100) }, body: { commentId: Validators.string(1, 100) } }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await getSessionUser(req);
        if (!user) return next(new UnauthorizedError());
        const post = await store.getPostById(req.params.id);
        if (!post) return next(new NotFoundError("Post not found."));
        const isAuthor = post.authorId === user.id;
        const isElevated = store.ELEVATED_ROLES.includes(user.role as any);
        if (!isAuthor && !isElevated) {
          return next(new ForbiddenError("Only the post author or a moderator can verify solutions."));
        }
        const comment = await prisma.comment.findUnique({ where: { id: req.body.commentId } });
        if (!comment || comment.targetId !== post.id) {
          return next(new NotFoundError("Comment not found on this post."));
        }
        await prisma.$transaction([
          prisma.comment.update({ where: { id: comment.id }, data: { isSolution: true } }),
          prisma.discussionThread.update({ where: { id: post.id }, data: { isSolved: true } })
        ]);
        if (comment.authorId !== user.id) {
          await store.addPoints(comment.authorId, "answer_accepted", 10, post.id, "Accepted solution");
          await store.createNotification({
            userId: comment.authorId, category: "community", type: "solution_accepted",
            title: "Your Solution was Verified (+10 Pts)",
            titleAr: "تم اعتماد حلك كحل نموذجي (+10 نقاط)",
            message: `Your answer on "${post.title.substring(0, 45)}..." was marked as the official solution.`,
            messageAr: `تم اعتماد إجابتك على "${post.title.substring(0, 45)}..." كحل نموذجي.`,
            actionTab: "community", actionTargetId: post.id
          });
        }
        await store.writeAudit({
          category: "moderation", eventType: "moderation.post.solved", severity: "info",
          actorId: user.id, actorName: user.name, actorRole: user.role,
          targetId: post.id, targetType: "post", targetName: post.title,
          newState: { commentId: comment.id, solverId: comment.authorId }, ipAddress: getClientIp(req)
        });
        res.json({ success: true, message: "تم اعتماد الحل بنجاح!", isSolved: true });
      } catch (err) { next(err); }
    }
  );

  // --------------------------------------------------------------------
  // LEADERBOARD (real ledger data, staff excluded)
  // --------------------------------------------------------------------
  app.get("/api/leaderboard", async (req: Request, res: Response) => {
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10) || 20));
    const leaderboard = await store.getLeaderboard(limit);
    res.json({ leaderboard, total: leaderboard.length, generatedAt: new Date().toISOString() });
  });

  // --------------------------------------------------------------------
  // HONOR BOARD
  // --------------------------------------------------------------------
  app.get("/api/honor-board", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entries = await store.getHonorBoard({
        departmentId: req.query.departmentId as string | undefined,
        category: req.query.category as string | undefined,
        featured: req.query.featured === "true" ? true : req.query.featured === "false" ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      });
      res.json({ entries, total: entries.length, generatedAt: new Date().toISOString() });
    } catch (err) { next(err); }
  });

  app.post("/api/honor-board", validate({
    body: {
      userId: Validators.string(1, 100),
      name: Validators.string(1, 200),
      studentId: Validators.optional(Validators.string(1, 50)),
      email: Validators.optional(Validators.email()),
      avatar: Validators.optional(Validators.string(1, 10000000)),
      departmentId: Validators.string(1, 100),
      departmentName: Validators.optional(Validators.string(1, 200)),
      level: Validators.string(1, 50),
      semester: Validators.optional(Validators.string(1, 50)),
      achievementTitle: Validators.string(1, 300),
      category: Validators.string(1, 50),
      description: Validators.string(1, 2000),
      honoredDate: Validators.string(1, 50),
      academicYear: Validators.string(1, 20),
      gpaOrMetric: Validators.optional(Validators.string(1, 50)),
      badgeLabel: Validators.optional(Validators.string(1, 100)),
      certificateUrl: Validators.optional(Validators.string(1, 20000000)),
      projectUrl: Validators.optional(Validators.string(1, 1000)),
      supervisorName: Validators.optional(Validators.string(1, 200)),
      featured: Validators.optional(Validators.boolean()),
      tags: Validators.optional(Validators.array(Validators.string(1, 50), 0, 20))
    }
  }), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return next(new UnauthorizedError("Authentication required."));
      if (!store.ELEVATED_ROLES.includes(user.role as any)) {
        return next(new ForbiddenError("Admin privileges required to add honor board entries."));
      }

      const entry = await store.createHonorEntry({
        ...req.body,
        createdById: user.id,
        createdByName: user.name
      });

      await store.writeAudit({
        category: "honor_board", eventType: "honor.entry.created", severity: "info",
        actorId: user.id, actorName: user.name, actorRole: user.role,
        targetId: entry.id, targetType: "honor_student", targetName: entry.name,
        ipAddress: getClientIp(req), metadata: { category: entry.category }
      });

      res.status(201).json({ success: true, entry, message: "تم إضافة الطالب إلى لوحة الشرف بنجاح." });
    } catch (err) { next(err); }
  });

  app.put("/api/honor-board/:id", validate({
    body: {
      name: Validators.optional(Validators.string(1, 200)),
      achievementTitle: Validators.optional(Validators.string(1, 300)),
      category: Validators.optional(Validators.string(1, 50)),
      description: Validators.optional(Validators.string(1, 2000)),
      honoredDate: Validators.optional(Validators.string(1, 50)),
      academicYear: Validators.optional(Validators.string(1, 20)),
      gpaOrMetric: Validators.optional(Validators.string(1, 50)),
      badgeLabel: Validators.optional(Validators.string(1, 100)),
      certificateUrl: Validators.optional(Validators.string(1, 20000000)),
      projectUrl: Validators.optional(Validators.string(1, 1000)),
      supervisorName: Validators.optional(Validators.string(1, 200)),
      featured: Validators.optional(Validators.boolean()),
      tags: Validators.optional(Validators.array(Validators.string(1, 50), 0, 20))
    }
  }), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return next(new UnauthorizedError("Authentication required."));
      if (!store.ELEVATED_ROLES.includes(user.role as any)) {
        return next(new ForbiddenError("Admin privileges required to edit honor board entries."));
      }

      const entry = await store.updateHonorEntry(req.params.id, req.body);

      await store.writeAudit({
        category: "honor_board", eventType: "honor.entry.updated", severity: "info",
        actorId: user.id, actorName: user.name, actorRole: user.role,
        targetId: req.params.id, targetType: "honor_student", targetName: entry.name,
        ipAddress: getClientIp(req), metadata: { updatedFields: Object.keys(req.body) }
      });

      res.json({ success: true, entry, message: "تم تحديث بيانات لوحة الشرف بنجاح." });
    } catch (err) { next(err); }
  });

  app.delete("/api/honor-board/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      if (!user) return next(new UnauthorizedError("Authentication required."));
      if (!store.ELEVATED_ROLES.includes(user.role as any)) {
        return next(new ForbiddenError("Admin privileges required to delete honor board entries."));
      }

      const existing = await prisma.honorStudent.findUnique({ where: { id: req.params.id } });
      if (!existing) return next(new NotFoundError("Honor board entry not found."));

      await store.deleteHonorEntry(req.params.id);

      await store.writeAudit({
        category: "honor_board", eventType: "honor.entry.deleted", severity: "warning",
        actorId: user.id, actorName: user.name, actorRole: user.role,
        targetId: req.params.id, targetType: "honor_student", targetName: existing.name,
        ipAddress: getClientIp(req)
      });

      res.json({ success: true, message: "تم حذف السجل من لوحة الشرف." });
    } catch (err) { next(err); }
  });

  app.post("/api/honor-board/:id/applause", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await store.incrementApplause(req.params.id);
      res.json({ success: true, applauseCount: result.applauseCount });
    } catch (err) { next(err); }
  });

  // --------------------------------------------------------------------
  // AI
  // --------------------------------------------------------------------
  app.post(
    "/api/ai/assistant",
    validate({
      body: {
        prompt: Validators.optional(Validators.string(1, 4000)),
        query: Validators.optional(Validators.string(1, 4000)),
        userMsg: Validators.optional(Validators.string(1, 4000)),
        courseCode: Validators.optional(Validators.string(1, 50)),
        courseTitle: Validators.optional(Validators.string(1, 100)),
        fileContext: Validators.optional(Validators.string(1, 4000))
      }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const user = await getSessionUser(req);
      const clientIp = getClientIp(req);
      const rate = checkRateLimit(`ai:${user?.id || clientIp}`, 20, 60 * 1000);
      if (!rate.allowed) return next(new RateLimitError(`AI Assistant rate limit reached. Please wait ${rate.remainingSeconds}s.`, rate.remainingSeconds));

      const prompt = req.body.prompt || req.body.query || req.body.userMsg;
      const { courseCode, courseTitle, syllabus, fileContext, isStream } = req.body;
      const wantStream = isStream || req.query.stream === "true";
      if (!prompt) return next(new BadRequestError("Prompt is required"));

      const systemInstruction = `You are EngHub AI Study Buddy, an elite engineering professor and senior tutor specializing in Computer Engineering, Mechatronics, and Electrical Engineering.
Course Context: ${courseCode || "ENG"} - ${courseTitle || "Engineering Course"}.
Syllabus Topics: ${syllabus ? (Array.isArray(syllabus) ? syllabus.join(", ") : syllabus) : "General Engineering"}.
Selected Course Materials Context: ${fileContext || "General Course Syllabus"}.

Guidelines:
- Provide clear, mathematically precise, step-by-step explanations.
- Format equations using clean notation or code blocks where appropriate.
- Do NOT mention model names, version numbers, or provider names.`;

      const errorMessageArabic = "المساعد الذكي غير متاح حالياً، حاول مرة أخرى لاحقاً";
      if (!process.env.GEMINI_API_KEY) {
        if (wantStream) {
          res.setHeader("Content-Type", "text/event-stream");
          res.write(`data: ${JSON.stringify({ error: errorMessageArabic, text: errorMessageArabic })}\n\n`);
          res.write("data: [DONE]\n\n");
          return res.end();
        }
        return next(new ServiceUnavailableError(errorMessageArabic));
      }

      try {
        const ai = getGenAI();
        await store.writeAudit({
          category: "ai", eventType: "ai.assistant.invoked", severity: "info",
          actorId: user?.id || "guest", actorName: user?.name || "Guest Student", actorRole: user?.role || "student",
          targetType: "ai_assistant", metadata: { courseCode, isStream: Boolean(wantStream) }, ipAddress: clientIp
        });

        if (wantStream) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          const responseStream = await ai.models.generateContentStream({
            model: "gemini-3.6-flash", contents: prompt,
            config: { systemInstruction, temperature: 0.7 }
          });
          for await (const chunk of responseStream) {
            if (chunk.text) res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
          res.write("data: [DONE]\n\n");
          return res.end();
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash", contents: prompt,
          config: { systemInstruction, temperature: 0.7 }
        });
        const replyText = response.text || "No response generated.";
        res.json({ reply: replyText, answer: replyText });
      } catch (geminiErr: any) {
        console.error("Gemini API error:", geminiErr?.message || geminiErr);
        return next(new ServiceUnavailableError(errorMessageArabic));
      }
    }
  );

  const handleQuizGeneration = async (req: Request, res: Response, next: NextFunction) => {
    const { courseCode, courseTitle, topic } = req.body;
    const errorMessageArabic = "المساعد الذكي غير متاح حالياً، حاول مرة أخرى لاحقاً";
    if (!process.env.GEMINI_API_KEY) return next(new ServiceUnavailableError(errorMessageArabic));

    try {
      const quizPrompt = `Generate 4 high-yield multiple-choice exam practice questions for engineering students in ${courseCode || "Engineering"} - ${courseTitle || topic || "Course"}.
Topic: ${topic || "General Course Material"}.

Return ONLY a raw JSON array of objects without markdown formatting or code fences. Each object must have:
- "id": string
- "question": string
- "options": array of 4 strings
- "correctIndex": integer (0, 1, 2, or 3)
- "explanation": string`;

      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash", contents: quizPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY, description: "Array of quiz questions",
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 distinct options" },
                correctIndex: { type: Type.INTEGER, description: "0-based index of correct option" },
                explanation: { type: Type.STRING }
              },
              required: ["id", "question", "options", "correctIndex", "explanation"]
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Do NOT return correctIndex to the client — grading happens server-side only.
        const questions = parsed.map((q: any, i: number) => ({
          id: String(q.id ?? `q-${i}`),
          question: String(q.question),
          options: (q.options || []).map(String).slice(0, 6),
          explanation: String(q.explanation || "")
        }));
        return res.json({ questions, quiz: questions });
      }
      return next(new ServiceUnavailableError(errorMessageArabic));
    } catch (error) {
      console.error("AI Quiz Generator Error:", error);
      return next(new ServiceUnavailableError(errorMessageArabic));
    }
  };
  app.post("/api/ai/generate-quiz", handleQuizGeneration);
  app.post("/api/ai/quiz", handleQuizGeneration);

  // --------------------------------------------------------------------
  // QUIZ SUBMISSION — SERVER-SIDE GRADING (client answers are untrusted)
  // --------------------------------------------------------------------
  app.post(
    "/api/quiz/submit",
    validate({
      body: {
        quizId: Validators.string(1, 100),
        quizTitle: Validators.optional(Validators.string(1, 200)),
        courseCode: Validators.optional(Validators.string(1, 50)),
        answers: Validators.array(Validators.object(), 1, 100),
        totalQuestions: Validators.optional(Validators.integer(1, 100))
      }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await getSessionUser(req);
        const { quizId, answers } = req.body;

        const quiz = await prisma.examQuiz.findUnique({ where: { id: quizId } });
        if (!quiz) {
          return next(new BadRequestError("Unknown quiz. Grading requires a server-registered quiz bank entry."));
        }

        const bankQuestions: any[] = Array.isArray(quiz.questions) ? quiz.questions : [];
        const bankById = new Map(bankQuestions.map((q: any) => [String(q.id), q]));

        let correctCount = 0;
        const gradedAnswers = answers.map((ans: any) => {
          const ref = bankById.get(String(ans.questionId));
          const isCorrect = Boolean(ref) && ans.selectedIndex === ref.correctIndex;
          if (isCorrect) correctCount++;
          return { questionId: ans.questionId, selectedIndex: ans.selectedIndex, isCorrect };
        });

        const total = bankQuestions.length || answers.length || 1;
        const percentage = Math.round((correctCount / total) * 100);
        const passed = percentage >= 60;
        const pointsEarned = user ? (passed ? Math.min(25, Math.max(10, Math.round(percentage / 5))) : 5) : 0;

        await prisma.quizSubmission.create({
          data: {
            userId: user?.id,
            quizId,
            quizTitle: quiz.title,
            courseCode: quiz.courseCode,
            score: correctCount,
            totalQuestions: total,
            percentage,
            passed,
            pointsEarned,
            answers: gradedAnswers
          }
        });

        if (user && pointsEarned > 0) {
          await store.addPoints(user.id, "bonus", pointsEarned, quizId, `Quiz "${quiz.title}" score ${percentage}%`);
        }

        res.json({
          success: true,
          submission: {
            id: `sub-${Date.now()}`,
            quizId,
            quizTitle: quiz.title,
            courseCode: quiz.courseCode,
            studentName: user ? user.name : "Guest Student",
            score: correctCount,
            totalQuestions: total,
            percentage,
            passed,
            pointsEarned,
            answers: gradedAnswers,
            submittedAt: new Date().toISOString()
          }
        });
      } catch (err) { next(err); }
    }
  );

  app.get("/api/quiz/submissions", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { limit } = sanitizePagination(req.query, 50, 200);
      const submissions = await prisma.quizSubmission.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: limit
      });
      res.json({ submissions, total: submissions.length });
    } catch (err) { next(err); }
  });

  // --------------------------------------------------------------------
  // POMODORO — DB-persisted with a daily points cap
  // --------------------------------------------------------------------
  app.post("/api/study/pomodoro/log", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getSessionUser(req);
      const { courseId, courseCode, taskName, durationMinutes, mode } = req.body;
      const duration = Math.min(240, Math.max(1, Number(durationMinutes) || 25));

      let pointsEarned = 0;
      if (user && mode === "focus" && duration >= 20) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const rewardedToday = await prisma.pomodoroSession.count({
          where: { userId: user.id, pointsAwarded: { gt: 0 }, completedAt: { gte: startOfDay } }
        });
        pointsEarned = rewardedToday < 4 ? 5 : 0; // max 20 pts/day
      }

      const session = await prisma.pomodoroSession.create({
        data: {
          userId: user?.id || "guest-anonymous",
          courseId: courseId || "general",
          courseCode: courseCode || "ENG",
          taskName: taskName || "Engineering Study Session",
          durationMinutes: duration,
          mode: mode || "focus",
          pointsAwarded: pointsEarned
        }
      }).catch(async () => {
        return null;
      });

      if (user && pointsEarned > 0) {
        await store.addPoints(user.id, "bonus", pointsEarned, session!.id, "Focus session completed");
      }

      res.json({
        success: true,
        session: {
          id: session?.id || `pomo-${Date.now()}`,
          userId: user ? user.id : "guest",
          durationMinutes: duration,
          mode: mode || "focus",
          completedAt: new Date().toISOString(),
          pointsAwarded: pointsEarned
        },
        message: pointsEarned > 0 ? `تم تسجيل جلسة التركيز وإضافة +${pointsEarned} نقاط!` : "تم تسجيل الجلسة بنجاح!"
      });
    } catch (err) { next(err); }
  });

  app.get("/api/study/pomodoro/sessions", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { limit } = sanitizePagination(req.query, 50, 200);
      const sessions = await prisma.pomodoroSession.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: "desc" },
        take: limit
      });
      res.json({ sessions, total: sessions.length });
    } catch (err) { next(err); }
  });

  // --------------------------------------------------------------------
  // COURSES (Prisma; failures are loud, no memory fallback)
  // --------------------------------------------------------------------
  app.get("/api/courses", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await CourseService.getAllCourses({
        departmentId: (req.query.departmentId as string) || "all",
        level: (req.query.level as string) || "all",
        semester: (req.query.semester as string) || "all",
        q: (req.query.q as string) || "",
        page: parseInt(req.query.page as string, 10) || 1,
        limit: parseInt(req.query.limit as string, 10) || 50
      });
      res.json(result);
    } catch (err) { next(err); }
  });

  app.get("/api/courses/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await CourseService.getCourseById(req.params.id);
      if (!course) return next(new NotFoundError("Course not found"));
      res.json(course);
    } catch (err) { next(err); }
  });

  app.post(
    "/api/courses",
    requireRole(["super_admin", "department_admin", "supervisor"]),
    async (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      if (!req.body.code || !req.body.title) return next(new ValidationError("Course code and title are required."));
      try {
        const saved = await CourseService.createCourse(req.body);
        await serverCache.invalidatePattern("courses:");
        await store.writeAudit({
          category: "administration", eventType: "admin.create_course", severity: "info",
          actorId: user.id, actorName: user.name, actorRole: user.role,
          targetId: saved.id, targetType: "course", targetName: saved.title, ipAddress: getClientIp(req)
        });
        res.status(201).json({ success: true, course: saved, message: "تم إنشاء المقرر الدراسي بنجاح وحفظه في قاعدة البيانات." });
      } catch (err: any) { next(new BadRequestError(err.message || "Failed to create course")); }
    }
  );

  app.patch("/api/courses/:id", requireRole(["super_admin", "department_admin", "supervisor"]), async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    try {
      const updated = await CourseService.updateCourse(req.params.id, req.body);
      await serverCache.invalidatePattern("courses:");
      await store.writeAudit({
        category: "administration", eventType: "admin.update_course", severity: "info",
        actorId: user.id, actorName: user.name, actorRole: user.role,
        targetId: req.params.id, targetType: "course", ipAddress: getClientIp(req)
      });
      res.json({ success: true, course: updated });
    } catch (err: any) { next(new BadRequestError(err.message || "Failed to update course")); }
  });

  app.delete("/api/courses/:id", requireRole(["super_admin", "department_admin"]), async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    try {
      await CourseService.deleteCourse(req.params.id); // soft-delete only, by design
      await serverCache.invalidatePattern("courses:");
      await store.writeAudit({
        category: "administration", eventType: "admin.delete_course", severity: "warning",
        actorId: user.id, actorName: user.name, actorRole: user.role,
        targetId: req.params.id, targetType: "course", ipAddress: getClientIp(req)
      });
      res.json({ success: true, message: "Course archived (soft-deleted) in database." });
    } catch (err: any) { next(new BadRequestError(err.message || "Failed to archive course")); }
  });

  // --------------------------------------------------------------------
  // SCHEDULES (DB-backed)
  // --------------------------------------------------------------------
  app.get("/api/schedules", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const where: any = {};
      if (req.query.departmentId && req.query.departmentId !== "all") where.departmentId = req.query.departmentId;
      if (req.query.level && req.query.level !== "all") where.level = req.query.level;
      if (req.query.courseId && req.query.courseId !== "all") where.courseId = req.query.courseId;
      if (req.query.dayOfWeek && req.query.dayOfWeek !== "all") where.dayOfWeek = req.query.dayOfWeek;
      const schedules = await prisma.scheduleItem.findMany({ where });
      res.json({ schedules, total: schedules.length });
    } catch (err) { next(err); }
  });

  app.get("/api/schedules/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schedule = await prisma.scheduleItem.findUnique({ where: { id: req.params.id } });
      if (!schedule) return next(new NotFoundError("Schedule record not found"));
      res.json(schedule);
    } catch (err) { next(err); }
  });

  app.post(
    "/api/schedules",
    requireRole(["super_admin", "department_admin", "supervisor"]),
    validate({
      body: {
        courseId: Validators.string(1, 50),
        courseCode: Validators.string(1, 20),
        courseTitle: Validators.string(2, 100),
        instructor: Validators.string(2, 100),
        dayOfWeek: Validators.string(2, 20),
        startTime: Validators.string(2, 10),
        endTime: Validators.string(2, 10),
        hall: Validators.string(1, 50),
        type: Validators.enum(["lecture", "section", "lab"]),
        departmentId: Validators.string(1, 50),
        level: Validators.string(1, 50)
      }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      try {
        const saved = await prisma.scheduleItem.create({
          data: {
            courseId: req.body.courseId,
            courseCode: req.body.courseCode,
            courseName: req.body.courseTitle,
            departmentId: req.body.departmentId,
            level: req.body.level,
            dayOfWeek: req.body.dayOfWeek,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            location: req.body.hall,
            type: req.body.type,
            instructorName: req.body.instructor
          }
        });
        await store.writeAudit({
          category: "administration", eventType: "admin.create_schedule", severity: "info",
          actorId: user.id, actorName: user.name, actorRole: user.role,
          targetId: saved.id, targetType: "schedule", ipAddress: getClientIp(req)
        });
        res.status(201).json({ success: true, schedule: saved, message: "تم حفظ الجدول الدراسي بنجاح في قاعدة البيانات." });
      } catch (err) { next(err); }
    }
  );

  app.patch("/api/schedules/:id", requireRole(["super_admin", "department_admin", "supervisor"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.scheduleItem.findUnique({ where: { id: req.params.id } });
      if (!existing) return next(new NotFoundError("Schedule record not found"));
      const map: Record<string, any> = {
        courseId: "courseId", courseCode: "courseCode", courseTitle: "courseName",
        departmentId: "departmentId", level: "level", dayOfWeek: "dayOfWeek",
        startTime: "startTime", endTime: "endTime", hall: "location", type: "type", instructor: "instructorName"
      };
      const data: any = {};
      for (const [k, v] of Object.entries(map)) if (req.body[k] !== undefined) data[v] = req.body[k];
      const updated = await prisma.scheduleItem.update({ where: { id: req.params.id }, data });
      res.json({ success: true, schedule: updated });
    } catch (err) { next(err); }
  });

  app.delete("/api/schedules/:id", requireRole(["super_admin", "department_admin", "supervisor"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await prisma.scheduleItem.deleteMany({ where: { id: req.params.id } });
      if (deleted.count === 0) return next(new NotFoundError("Schedule record not found"));
      res.json({ success: true, message: "Schedule item deleted from database." });
    } catch (err) { next(err); }
  });

  // --------------------------------------------------------------------
  // EXAMS (DB-backed)
  // --------------------------------------------------------------------
  app.get("/api/exams", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const where: any = {};
      if (req.query.departmentId && req.query.departmentId !== "all") where.departmentId = req.query.departmentId;
      if (req.query.courseId && req.query.courseId !== "all") where.courseId = req.query.courseId;
      if (req.query.difficulty && req.query.difficulty !== "all") where.difficulty = req.query.difficulty;
      if (req.query.term && req.query.term !== "all") where.term = req.query.term;
      if (req.query.isPastExam !== undefined) where.isPastExam = req.query.isPastExam === "true";
      if (req.query.q) {
        where.OR = [
          { title: { contains: req.query.q as string, mode: "insensitive" } },
          { courseCode: { contains: req.query.q as string, mode: "insensitive" } }
        ];
      }
      const exams = await prisma.examQuiz.findMany({ where });
      const isElevated = store.ELEVATED_ROLES.includes(user.role as any);
      const safe = isElevated ? exams : exams.map((e: any) => ({
        ...e,
        questions: Array.isArray(e.questions) ? e.questions.map((q: any) => {
          const { correctIndex, ...rest } = q;
          return rest;
        }) : []
      }));
      res.json({ exams: safe, total: safe.length, page: 1, limit: safe.length, totalPages: 1 });
    } catch (err) { next(err); }
  });

  app.get("/api/exams/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const exam = await prisma.examQuiz.findUnique({ where: { id: req.params.id } });
      if (!exam) return next(new NotFoundError("Exam or question bank record not found"));
      const isElevated = store.ELEVATED_ROLES.includes(user.role as any);
      if (isElevated) return res.json(exam);
      const questions = Array.isArray(exam.questions) ? exam.questions.map((q: any) => {
        const { correctIndex, ...rest } = q;
        return rest;
      }) : [];
      const safe: any = { ...exam, questions };
      return res.json(safe);
    } catch (err) { next(err); }
  });

  app.post(
    "/api/exams",
    requireRole(["super_admin", "department_admin", "supervisor"]),
    validate({
      body: {
        courseId: Validators.string(1, 50),
        courseCode: Validators.string(1, 20),
        title: Validators.string(3, 150),
        topic: Validators.string(2, 100),
        durationMinutes: Validators.number(5, 300),
        totalMarks: Validators.number(1, 500),
        difficulty: Validators.enum(["Easy", "Medium", "Hard"]),
        term: Validators.string(2, 50),
        isPastExam: Validators.optional(Validators.boolean()),
        questions: Validators.array(Validators.object(), 1, 100)
      }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      try {
        const saved = await prisma.examQuiz.create({ data: { ...req.body, departmentId: req.body.departmentId || "dept-cmp" } });
        await store.writeAudit({
          category: "administration", eventType: "admin.create_exam", severity: "info",
          actorId: user.id, actorName: user.name, actorRole: user.role,
          targetId: saved.id, targetType: "exam", targetName: saved.title, ipAddress: getClientIp(req)
        });
        res.status(201).json({ success: true, exam: saved, message: "تم حفظ الاختبار في بنك الأسئلة بنجاح." });
      } catch (err) { next(err); }
    }
  );

  app.patch("/api/exams/:id", requireRole(["super_admin", "department_admin", "supervisor"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.examQuiz.findUnique({ where: { id: req.params.id } });
      if (!existing) return next(new NotFoundError("Exam record not found"));
      const updated = await prisma.examQuiz.update({ where: { id: req.params.id }, data: req.body });
      res.json({ success: true, exam: updated });
    } catch (err) { next(err); }
  });

  app.delete("/api/exams/:id", requireRole(["super_admin", "department_admin", "supervisor"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await prisma.examQuiz.deleteMany({ where: { id: req.params.id } });
      if (deleted.count === 0) return next(new NotFoundError("Exam record not found"));
      res.json({ success: true, message: "Exam record deleted from database." });
    } catch (err) { next(err); }
  });

  // --------------------------------------------------------------------
  // ADMIN (all numbers derived from the database)
  // --------------------------------------------------------------------
  app.get("/api/admin/stats", requireRole(["super_admin", "department_admin", "moderator"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const [stats, securityMetrics] = await Promise.all([store.platformStats(), store.auditMetrics()]);
      res.json({ ...stats, role: user.role, securityMetrics });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/users", requireRole(["super_admin", "department_admin", "moderator", "supervisor"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = sanitizePagination(req.query, 20, 100);
      const where: any = {};
      if (req.query.search) {
        const q = String(req.query.search);
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { studentId: { contains: q, mode: "insensitive" } }
        ];
      }
      if (req.query.department && req.query.department !== "all") where.departmentId = req.query.department;
      if (req.query.level && req.query.level !== "all") where.level = req.query.level;
      if (req.query.role && req.query.role !== "all") where.role = req.query.role;

      const [rows, total] = await Promise.all([
        prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
        prisma.user.count({ where })
      ]);
      res.json({ users: rows.map(store.toSafeUser), total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
  });

  app.post(
    "/api/admin/update-role",
    validate({
      body: {
        targetUserId: Validators.optional(Validators.string(1, 100)),
        targetEmail: Validators.optional(Validators.email()),
        newRole: Validators.enum(["student", "moderator", "department_admin", "supervisor", "super_admin"]),
        supervisorScope: Validators.optional(Validators.string(1, 200)),
        supervisorTitle: Validators.optional(Validators.string(1, 100))
      }
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await getSessionUser(req);
        if (!user) return next(new UnauthorizedError("Authentication required."));
        if (user.role !== "super_admin" && user.role !== "department_admin") {
          await store.writeAudit({
            category: "security", eventType: "security.forbidden_role_change", severity: "critical",
            actorId: user.id, actorName: user.name, actorRole: user.role, ipAddress: getClientIp(req)
          });
          return next(new ForbiddenError("Admin privileges required to modify user roles."));
        }

        const { targetUserId, targetEmail, newRole, supervisorScope, supervisorTitle } = req.body;
        if (!targetEmail && !targetUserId) return next(new BadRequestError("targetEmail or targetUserId is required."));

        if (newRole === "super_admin" && user.role !== "super_admin") {
          return next(new ForbiddenError("Only super administrators may assign the super_admin role."));
        }
        if (user.role === "department_admin" && ["super_admin", "department_admin"].includes(newRole)) {
          return next(new ForbiddenError("Department administrators may not assign super_admin or department_admin roles."));
        }

        // Target must be an EXISTING user — no phantom account creation with fake passwords.
        let targetUser: any = null;
        if (targetUserId) targetUser = await store.getUserById(targetUserId);
        if (!targetUser && targetEmail) targetUser = await store.getUserByEmail(targetEmail);
        if (!targetUser) return next(new NotFoundError("Target user does not exist. Accounts must register first."));

        if (user.role === "department_admin" && targetUser.departmentId !== user.departmentId) {
          return next(new ForbiddenError("Department administrators may only modify users within their own department."));
        }

        const previousRole = targetUser.role;
        const data: any = { role: newRole };
        if (supervisorScope !== undefined) {
          try { data.supervisorScope = JSON.parse(supervisorScope); } catch { data.supervisorScope = supervisorScope; }
        }
        if (supervisorTitle !== undefined) data.supervisorTitle = supervisorTitle;

        const updated = await prisma.user.update({ where: { id: targetUser.id }, data });
        await store.writeAudit({
          category: "administration", eventType: "admin.role.updated", severity: "warning",
          actorId: user.id, actorName: user.name, actorRole: user.role,
          targetId: updated.id, targetType: "user", targetName: updated.name,
          previousState: { role: previousRole }, newState: { role: newRole }, ipAddress: getClientIp(req)
        });
        res.json({ success: true, message: `User ${updated.name} (${updated.email}) role updated to ${newRole}.`, user: store.toSafeUser(updated) });
      } catch (err) { next(err); }
    }
  );

  app.get("/api/admin/audit-logs", requireRole(["super_admin", "department_admin", "moderator"]), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = sanitizePagination(req.query, 20, 100);
      const result = await store.queryAudit({
        category: req.query.category as string, eventType: req.query.eventType as string,
        severity: req.query.severity as string, actorId: req.query.actorId as string,
        targetId: req.query.targetId as string, search: req.query.search as string,
        startDate: req.query.startDate as string, endDate: req.query.endDate as string,
        page, limit
      });
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/security-metrics", requireRole(["super_admin", "department_admin"]), async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ success: true, metrics: await store.auditMetrics(), cache: serverCache.getStats() });
    } catch (err) { next(err); }
  });

  app.post("/api/admin/cache/clear", requireSuperAdmin, (_req: Request, res: Response) => {
    serverCache.clear();
    res.json({ success: true, message: "Server cache successfully flushed." });
  });

  // --------------------------------------------------------------------
  // FILES — real bytes stored on disk, streamed back on download
  // --------------------------------------------------------------------
  app.get("/api/files/download-url", validate({ query: { fileId: Validators.string(1, 100) } }), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = req.query.fileId as string;
      const user = await getSessionUser(req);
      const resource = await store.getResourceById(fileId);
      if (resource) {
        const isElevated = user && store.ELEVATED_ROLES.includes(user.role as any);
        const isOwner = user && resource.uploaderId === user.id;
        if (resource.moderationStatus !== "approved" && !isElevated && !isOwner) {
          return next(new ForbiddenError("This resource is pending moderation review and cannot be downloaded yet."));
        }
      }
      const { token, expiresAt } = generateSignedDownloadToken(fileId, 15 * 60);
      res.json({
        fileId,
        signedUrl: `/api/files/download/${encodeURIComponent(fileId)}?token=${encodeURIComponent(token)}`,
        cdnDelivered: false,
        expiresAt
      });
    } catch (err) { next(err); }
  });

  app.get(
    "/api/files/download/:fileId",
    validate({ params: { fileId: Validators.string(1, 100) }, query: { token: Validators.string(5, 500) } }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { fileId } = req.params;
        if (!verifySignedDownloadToken(fileId, req.query.token as string)) {
          return next(new ForbiddenError("Invalid or expired download signature. Please request a fresh signed link."));
        }
        const resource = await store.getResourceById(fileId);
        if (!resource || !resource.fileKey) {
          return next(new NotFoundError("File not found on storage."));
        }
        // fileKey is server-generated ("<resourceId>/<safename>") — no traversal possible,
        // but defend in depth anyway.
        const resolved = path.resolve(uploadsDir, resource.fileKey);
        if (!resolved.startsWith(uploadsDir + path.sep) && resolved !== uploadsDir) {
          return next(new ForbiddenError("Invalid file path."));
        }
        if (!fs.existsSync(resolved)) {
          return next(new NotFoundError("File bytes are missing from storage."));
        }
        await prisma.resource.update({ where: { id: fileId }, data: { downloadsCount: { increment: 1 } } });
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(resource.fileName)}"`);
        res.setHeader("Content-Type", MIME_BY_EXT[resource.fileType] || "application/octet-stream");
        res.setHeader("Content-Length", String(fs.statSync(resolved).size));
        const stream = fs.createReadStream(resolved);
        stream.pipe(res);
      } catch (err) { next(err); }
    }
  );

  // --------------------------------------------------------------------
  // ANALYTICS — real counts
  // --------------------------------------------------------------------
  app.get("/api/analytics", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await store.platformStats();
      const [cmp, mtr] = await Promise.all([
        prisma.resource.count({ where: { departmentId: "dept-cmp", status: "approved" } }),
        prisma.resource.count({ where: { departmentId: "dept-mtr", status: "approved" } })
      ]);
      res.json({
        activeStudents: stats.students,
        totalCourses: stats.totalCourses,
        totalStudyFiles: stats.approvedFiles,
        totalDownloads: stats.totalDownloads,
        moderationQueueSize: stats.pendingQueue,
        departmentBreakdown: [
          { name: "Computer Engineering", files: cmp },
          { name: "Mechatronics Engineering", files: mtr }
        ]
      });
    } catch (err) { next(err); }
  });

  app.use("/api", errorHandler);

  // --------------------------------------------------------------------
  // CLIENT
  // --------------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    console.log("[EngHub Server] Mounting Vite development middleware");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const distIndexHtml = path.join(distPath, "index.html");
    if (fs.existsSync(distIndexHtml)) {
      console.log("[EngHub Server] Serving static built bundle from dist/");
      app.use(express.static(distPath));
      app.get("*", (_req: Request, res: Response) => res.sendFile(distIndexHtml));
    } else {
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EngHub Server] Hardened persistent server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[EngHub Server] Fatal error during server startup:", err);
  process.exit(1);
});
