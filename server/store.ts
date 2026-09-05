/**
 * Prisma-backed persistence layer.
 * Every entity lives in PostgreSQL — nothing is kept only in process memory.
 * This module replaces the legacy in-memory DatabaseEngine entirely.
 */
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { serverCache } from "./cache";
import { ValidationError } from "./errors";
import { prisma } from "./prisma";

export type Role = "student" | "moderator" | "department_admin" | "supervisor" | "super_admin";

export const ELEVATED_ROLES: Role[] = [
  "super_admin",
  "department_admin",
  "moderator",
  "supervisor",
];

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  studentId: string | null;
  role: Role;
  supervisorTitle?: string | null;
  supervisorScope?: any;
  universityId: string | null;
  facultyId: string | null;
  departmentId: string | null;
  level: string | null;
  semester: string | null;
  avatar: string | null;
  bio: string | null;
  points: number;
  badges: any[];
  savedBookmarks: string[];
  enrolledCourseIds: string[];
  createdAt: Date;
}

export function toSafeUser(u: any): SafeUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phoneNumber: u.phoneNumber || "",
    studentId: u.studentId,
    role: u.role as Role,
    supervisorTitle: u.supervisorTitle,
    supervisorScope: u.supervisorScope ?? undefined,
    universityId: u.universityId,
    facultyId: u.facultyId,
    departmentId: u.departmentId,
    level: u.level,
    semester: u.semester,
    avatar: u.avatar,
    bio: u.bio,
    points: u.points ?? 0,
    badges: Array.isArray(u.badges) ? u.badges : [],
    savedBookmarks: Array.isArray(u.savedBookmarks) ? u.savedBookmarks : [],
    enrolledCourseIds: Array.isArray(u.enrolledCourseIds) ? u.enrolledCourseIds : [],
    createdAt: u.createdAt,
  };
}

// ------------------------------------------------------------------
// USERS
// ------------------------------------------------------------------
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

// ------------------------------------------------------------------
// POINTS LEDGER (append-only; user.points kept consistent transactionally)
// ------------------------------------------------------------------
export async function addPoints(
  userId: string,
  type: string,
  points: number,
  referenceId?: string,
  reason?: string,
) {
  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.pointsLedger.create({
      data: { userId, type: type as any, points, referenceId, reason },
    });
    await tx.user.update({
      where: { id: userId },
      data: { points: { increment: points } },
    });
    return entry;
  });
  serverCache.invalidateTag("leaderboard").catch(() => {});
  serverCache.invalidateTag("admin").catch(() => {});
  return result;
}

export async function getLeaderboard(limit = 20) {
  const students = await prisma.user.findMany({
    where: { role: "student" },
    orderBy: [{ points: "desc" }, { createdAt: "asc" }],
    take: limit,
  });
  const deptNames: Record<string, string> = {
    "dept-cmp": "هندسة الحاسب والذكاء الاصطناعي",
    "dept-mtr": "هندسة الميكاترونكس والروبوتات",
  };
  return students.map((s, i) => ({
    rank: i + 1,
    id: s.id,
    name: s.name,
    avatar: s.avatar,
    departmentId: s.departmentId,
    dept: deptNames[s.departmentId || ""] || s.departmentId,
    level: s.level,
    points: s.points ?? 0,
  }));
}

export async function getHonorBoard(filters?: {
  departmentId?: string;
  category?: string;
  featured?: boolean;
  limit?: number;
}) {
  const where: any = {};
  if (filters?.departmentId) where.departmentId = filters.departmentId;
  if (filters?.category) where.category = filters.category;
  if (filters?.featured !== undefined) where.featured = filters.featured;

  const entries = await prisma.honorStudent.findMany({
    where,
    orderBy: [{ featured: "desc" }, { honoredDate: "desc" }, { createdAt: "desc" }],
    take: filters?.limit || 50,
  });

  return entries.map((e) => ({
    id: e.id,
    userId: e.userId,
    name: e.name,
    studentId: e.studentId,
    email: e.email,
    avatar: e.avatar,
    departmentId: e.departmentId,
    departmentName: e.departmentName,
    level: e.level,
    semester: e.semester,
    achievementTitle: e.achievementTitle,
    category: e.category,
    description: e.description,
    honoredDate: e.honoredDate ? e.honoredDate.toISOString() : null,
    academicYear: e.academicYear,
    gpaOrMetric: e.gpaOrMetric,
    badgeLabel: e.badgeLabel,
    certificateUrl: e.certificateUrl,
    projectUrl: e.projectUrl,
    supervisorName: e.supervisorName,
    featured: e.featured,
    applauseCount: e.applauseCount,
    tags: e.tags,
    createdAt: e.createdAt ? e.createdAt.toISOString() : null,
  }));
}

export async function createHonorEntry(data: {
  userId?: string;
  name: string;
  studentId?: string;
  email?: string;
  avatar?: string;
  departmentId: string;
  departmentName?: string;
  level: string;
  semester?: string;
  achievementTitle: string;
  category: string;
  description: string;
  honoredDate: string;
  academicYear: string;
  gpaOrMetric?: string;
  badgeLabel?: string;
  certificateUrl?: string;
  projectUrl?: string;
  supervisorName?: string;
  featured?: boolean;
  tags?: string[];
  createdById: string;
  createdByName: string;
}) {
  const honoredDateVal = data.honoredDate ? new Date(data.honoredDate) : null;
  if (data.honoredDate && isNaN(honoredDateVal!.getTime())) {
    throw new ValidationError("Invalid honoredDate format.");
  }
  const entry = await prisma.honorStudent.create({
    data: {
      ...data,
      ...(honoredDateVal ? { honoredDate: honoredDateVal } : {}),
    } as any,
  });
  return {
    id: entry.id,
    userId: entry.userId ?? undefined,
    name: entry.name,
    studentId: entry.studentId,
    email: entry.email,
    avatar: entry.avatar,
    departmentId: entry.departmentId,
    departmentName: entry.departmentName,
    level: entry.level,
    semester: entry.semester,
    achievementTitle: entry.achievementTitle,
    category: entry.category,
    description: entry.description,
    honoredDate: entry.honoredDate ? entry.honoredDate.toISOString() : null,
    academicYear: entry.academicYear,
    gpaOrMetric: entry.gpaOrMetric,
    badgeLabel: entry.badgeLabel,
    certificateUrl: entry.certificateUrl,
    projectUrl: entry.projectUrl,
    supervisorName: entry.supervisorName,
    featured: entry.featured,
    applauseCount: entry.applauseCount,
    tags: entry.tags,
    createdById: entry.createdById,
    createdByName: entry.createdByName,
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function updateHonorEntry(
  id: string,
  data: {
    name?: string;
    achievementTitle?: string;
    category?: string;
    description?: string;
    honoredDate?: string;
    academicYear?: string;
    gpaOrMetric?: string;
    badgeLabel?: string;
    certificateUrl?: string;
    projectUrl?: string;
    supervisorName?: string;
    featured?: boolean;
    tags?: string[];
  },
) {
  const updateData: any = { ...data };
  if (data.honoredDate) {
    const d = new Date(data.honoredDate);
    if (isNaN(d.getTime())) throw new ValidationError("Invalid honoredDate format.");
    updateData.honoredDate = d;
  }

  const entry = await prisma.honorStudent.update({
    where: { id },
    data: updateData,
  });
  return {
    id: entry.id,
    userId: entry.userId,
    name: entry.name,
    studentId: entry.studentId,
    email: entry.email,
    avatar: entry.avatar,
    departmentId: entry.departmentId,
    departmentName: entry.departmentName,
    level: entry.level,
    semester: entry.semester,
    achievementTitle: entry.achievementTitle,
    category: entry.category,
    description: entry.description,
    honoredDate: entry.honoredDate ? entry.honoredDate.toISOString() : null,
    academicYear: entry.academicYear,
    gpaOrMetric: entry.gpaOrMetric,
    badgeLabel: entry.badgeLabel,
    certificateUrl: entry.certificateUrl,
    projectUrl: entry.projectUrl,
    supervisorName: entry.supervisorName,
    featured: entry.featured,
    applauseCount: entry.applauseCount,
    tags: entry.tags,
    createdById: entry.createdById,
    createdByName: entry.createdByName,
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function deleteHonorEntry(id: string) {
  await prisma.honorStudent.delete({ where: { id } });
  return { success: true };
}

export async function incrementApplause(id: string) {
  const entry = await prisma.honorStudent.update({
    where: { id },
    data: { applauseCount: { increment: 1 } },
  });
  return { applauseCount: entry.applauseCount };
}

// ------------------------------------------------------------------
// SESSIONS (opaque token; only SHA-256 hash stored; DB-persistent)
// ------------------------------------------------------------------
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

export interface DbSession {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, ipAddress: string, userAgent?: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const session = await prisma.userSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      ipAddress: ipAddress || "127.0.0.1",
      deviceInfo: parseUserAgent(userAgent),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return { token, session };
}

export async function validateSession(token: string): Promise<DbSession | null> {
  if (!token) return null;
  const session = await prisma.userSession.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.userSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  // Touch lastUsedAt at most once per minute to avoid write amplification
  if (Date.now() - session.lastUsedAt.getTime() > 60_000) {
    await prisma.userSession
      .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
  }
  return session;
}

export async function revokeSession(token: string) {
  await prisma.userSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function revokeSessionById(sessionId: string, userId: string) {
  const res = await prisma.userSession.deleteMany({ where: { id: sessionId, userId } });
  return res.count > 0;
}

export async function revokeAllSessions(userId: string, keepSessionId?: string) {
  const res = await prisma.userSession.deleteMany({
    where: { userId, ...(keepSessionId ? { id: { not: keepSessionId } } : {}) },
  });
  return res.count;
}

export async function listSessions(userId: string, currentSessionId?: string) {
  const sessions = await prisma.userSession.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: "desc" },
  });
  return sessions.map((s) => ({
    id: s.id,
    deviceInfo: s.deviceInfo,
    ipAddress: s.ipAddress,
    createdAt: s.createdAt ? s.createdAt.toISOString() : null,
    lastUsedAt: s.lastUsedAt ? s.lastUsedAt.toISOString() : null,
    isCurrent: s.id === currentSessionId,
  }));
}

export function parseUserAgent(ua?: string): string {
  if (!ua) return "Web Browser · Desktop";
  let browser = "Web Browser";
  let os = "Unknown OS";
  if (ua.includes("Edg/")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome/")) browser = "Google Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Apple Safari";
  else if (ua.includes("Firefox/")) browser = "Mozilla Firefox";
  if (ua.includes("Windows NT")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";
  return `${browser} · ${os}`;
}

// ------------------------------------------------------------------
// RESOURCES
// ------------------------------------------------------------------
function toSafeResource(r: any, userId?: string, userVote?: string | null) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    resourceType: r.resourceType,
    courseId: r.courseId,
    courseCode: r.courseCode,
    courseTitle: r.courseTitle,
    departmentId: r.departmentId,
    academicYear: r.academicYear,
    semester: r.semester,
    fileType: r.fileType,
    fileSize: r.fileSize,
    fileSizeBytes: r.fileSizeBytes,
    fileName: r.fileName,
    uploaderId: r.uploaderId,
    uploaderName: r.uploaderName,
    uploaderRole: r.uploaderRole,
    uploaderDepartment: r.uploaderDepartment,
    uploadDate: r.uploadDate,
    downloadCount: r.downloadsCount,
    viewCount: r.viewCount,
    rating: r.rating,
    ratingCount: r.ratingCount,
    helpfulCount: r.helpfulCount,
    notHelpfulCount: r.notHelpfulCount,
    status: r.status,
    moderationStatus: r.moderationStatus,
    verificationStatus: r.verificationStatus,
    moderatedByName: r.moderatedByName,
    moderatedAt: r.moderatedAt,
    rejectionReason: r.rejectionReason,
    version: r.version ?? 1,
    tags: r.tags || [],
    createdAt: r.createdAt,
    userVote: userVote ?? null,
  };
}

export async function listResources(filter: {
  courseId?: string;
  departmentId?: string;
  category?: string;
  status?: string;
  moderationStatus?: string;
  verificationStatus?: string;
  uploaderId?: string;
  search?: string;
  semester?: string;
  academicYear?: string;
  sortBy?: string;
  currentUserId?: string;
  currentUserRole?: string;
  page?: number;
  limit?: number;
}) {
  const isElevated =
    filter.currentUserRole && ELEVATED_ROLES.includes(filter.currentUserRole as Role);
  const where: any = {};
  if (filter.status && filter.status !== "all") {
    where.status = filter.status;
  } else if (!filter.status && !isElevated) {
    where.status = "approved";
  }
  if (filter.moderationStatus && filter.moderationStatus !== "all")
    where.moderationStatus = filter.moderationStatus;
  if (filter.verificationStatus && filter.verificationStatus !== "all")
    where.verificationStatus = filter.verificationStatus;
  if (filter.uploaderId && filter.uploaderId !== "all") where.uploaderId = filter.uploaderId;
  if (filter.courseId && filter.courseId !== "all") where.courseId = filter.courseId;
  if (filter.departmentId && filter.departmentId !== "all")
    where.departmentId = filter.departmentId;
  if (filter.category && filter.category !== "all") where.category = filter.category;
  if (filter.semester && filter.semester !== "all") where.semester = filter.semester;
  if (filter.academicYear && filter.academicYear !== "all")
    where.academicYear = filter.academicYear;
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { fileName: { contains: filter.search, mode: "insensitive" } },
      { description: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const orderBy =
    filter.sortBy === "downloads"
      ? { downloadsCount: "desc" as const }
      : filter.sortBy === "rating"
        ? { rating: "desc" as const }
        : { createdAt: "desc" as const };

  const page = Math.max(1, filter.page || 1);
  const limit = Math.min(100, Math.max(1, filter.limit || 20));

  const [rows, total] = await Promise.all([
    prisma.resource.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.resource.count({ where }),
  ]);

  let votesByMe = new Map<string, string>();
  if (filter.currentUserId && rows.length > 0) {
    const votes = await prisma.resourceVote.findMany({
      where: { userId: filter.currentUserId, resourceId: { in: rows.map((r) => r.id) } },
    });
    votesByMe = new Map(votes.map((v) => [v.resourceId, v.voteType]));
  }

  return {
    resources: rows.map((r) => toSafeResource(r, filter.currentUserId, votesByMe.get(r.id))),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getResourceById(id: string) {
  return prisma.resource.findUnique({ where: { id } });
}

export async function voteResource(
  id: string,
  userId: string,
  voteType: "helpful" | "not_helpful",
) {
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) return null;

  const existing = await prisma.resourceVote.findUnique({
    where: { resourceId_userId: { resourceId: id, userId } },
  });

  if (existing && existing.voteType === voteType) {
    await prisma.resourceVote.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.resourceVote.update({ where: { id: existing.id }, data: { voteType } });
  } else {
    await prisma.resourceVote.create({ data: { resourceId: id, userId, voteType } });
  }

  // Counts derived from the vote table — always consistent
  const [helpful, notHelpful] = await Promise.all([
    prisma.resourceVote.count({ where: { resourceId: id, voteType: "helpful" } }),
    prisma.resourceVote.count({ where: { resourceId: id, voteType: "not_helpful" } }),
  ]);
  await prisma.resource.update({
    where: { id },
    data: { helpfulCount: helpful, notHelpfulCount: notHelpful },
  });

  const mine = await prisma.resourceVote.findUnique({
    where: { resourceId_userId: { resourceId: id, userId } },
  });

  return { helpfulCount: helpful, notHelpfulCount: notHelpful, userVote: mine?.voteType ?? null };
}

// ------------------------------------------------------------------
// COMMUNITY POSTS & COMMENTS
// ------------------------------------------------------------------
export function toSafePost(p: any, userId?: string, hasUpvoted?: boolean) {
  return {
    id: p.id,
    courseId: p.courseId,
    courseCode: p.courseCode,
    departmentId: p.departmentId,
    title: p.title,
    content: p.content,
    postType: p.postType,
    authorId: p.authorId,
    authorName: p.author?.name || p.authorName || "",
    authorDepartment: p.authorDepartment || "",
    authorRole: p.author?.role || "",
    authorAvatar: p.author?.avatar || "",
    createdAt: p.createdAt,
    upvotes: p.upvotes,
    hasUpvoted: Boolean(hasUpvoted),
    replyCount: p.replyCount,
    isSolved: p.isSolved,
    isPinned: p.isPinned,
    views: p.views,
    tags: p.tags || [],
  };
}

export async function listPosts(filter: {
  courseId?: string;
  departmentId?: string;
  postType?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  isSolved?: boolean;
  currentUserId?: string;
  page?: number;
  limit?: number;
}) {
  const where: any = {};
  if (filter.courseId && filter.courseId !== "all") where.courseId = filter.courseId;
  if (filter.departmentId && filter.departmentId !== "all")
    where.departmentId = filter.departmentId;
  const postType = filter.postType || filter.category;
  if (postType && postType !== "all") where.postType = postType;
  if (filter.isSolved !== undefined) where.isSolved = filter.isSolved;
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { content: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const orderBy =
    filter.sortBy === "popular"
      ? [{ upvotes: "desc" as const }, { createdAt: "desc" as const }]
      : { createdAt: "desc" as const };

  const page = Math.max(1, filter.page || 1);
  const limit = Math.min(50, Math.max(1, filter.limit || 20));

  const [rows, total] = await Promise.all([
    prisma.discussionThread.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: { author: { select: { name: true, role: true, avatar: true } } },
    }),
    prisma.discussionThread.count({ where }),
  ]);

  let upvotedSet = new Set<string>();
  if (filter.currentUserId && rows.length > 0) {
    const ups = await prisma.postUpvote.findMany({
      where: { userId: filter.currentUserId, postId: { in: rows.map((r) => r.id) } },
    });
    upvotedSet = new Set(ups.map((u) => u.postId));
  }

  // "unsolved" tab: filter client-side shape after fetch
  let posts = rows.map((r) => toSafePost(r, filter.currentUserId, upvotedSet.has(r.id)));
  if (filter.sortBy === "unsolved") posts = posts.filter((p) => !p.isSolved);

  return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPostById(id: string) {
  return prisma.discussionThread.findUnique({
    where: { id },
    include: { author: { select: { name: true, role: true, avatar: true } } },
  });
}

export async function upvotePost(postId: string, userId: string) {
  const existing = await prisma.postUpvote.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) {
    await prisma.$transaction([
      prisma.postUpvote.delete({ where: { id: existing.id } }),
      prisma.discussionThread.update({
        where: { id: postId },
        data: { upvotes: { decrement: 1 } },
      }),
    ]);
    const post = await prisma.discussionThread.findUnique({ where: { id: postId } });
    return { upvotes: post?.upvotes ?? 0, hasUpvoted: false };
  }
  await prisma.$transaction([
    prisma.postUpvote.create({ data: { postId, userId } }),
    prisma.discussionThread.update({ where: { id: postId }, data: { upvotes: { increment: 1 } } }),
  ]);
  const post = await prisma.discussionThread.findUnique({ where: { id: postId } });
  return { upvotes: post?.upvotes ?? 0, hasUpvoted: true };
}

export async function listComments(postId: string, _userId?: string) {
  const comments = await prisma.comment.findMany({
    where: { targetId: postId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true, role: true, avatar: true, departmentId: true } } },
  });
  const deptNames: Record<string, string> = {
    "dept-cmp": "هندسة الحاسب والذكاء الاصطناعي",
    "dept-mtr": "هندسة الميكاترونكس",
  };
  return comments.map((c) => ({
    id: c.id,
    targetId: c.targetId,
    authorId: c.authorId,
    authorName: c.author?.name || "",
    authorDepartment: deptNames[c.author?.departmentId || ""] || "",
    authorRole: c.author?.role || "",
    authorAvatar: c.author?.avatar || "",
    content: c.content,
    createdAt: c.createdAt,
    upvotes: c.upvotes,
    hasUpvoted: false,
    isSolution: c.isSolution,
  }));
}

// ------------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------------
export async function createNotification(n: {
  userId: string;
  category?: string;
  type: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  actionTab?: string;
  actionTargetId?: string;
  metadata?: any;
}) {
  return prisma.notification.create({
    data: {
      userId: n.userId,
      category: n.category || "academic",
      type: n.type,
      title: n.title,
      titleAr: n.titleAr,
      message: n.message,
      messageAr: n.messageAr,
      actionTab: n.actionTab,
      actionTargetId: n.actionTargetId,
    },
  });
}

export async function notifyStaff(n: {
  category?: string;
  type: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  actionTab?: string;
  actionTargetId?: string;
}) {
  const staff = await prisma.user.findMany({
    where: { role: { in: ELEVATED_ROLES } },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: staff.map((s) => ({
      userId: s.id,
      category: n.category || "system",
      type: n.type,
      title: n.title,
      titleAr: n.titleAr,
      message: n.message,
      messageAr: n.messageAr,
      actionTab: n.actionTab,
      actionTargetId: n.actionTargetId,
    })),
  });
}

// ------------------------------------------------------------------
// AUDIT LOG (persistent)
// ------------------------------------------------------------------
export async function writeAudit(e: {
  category: string;
  eventType: string;
  severity?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  actorEmail?: string;
  targetId?: string;
  targetType?: string;
  targetName?: string;
  previousState?: any;
  newState?: any;
  ipAddress: string;
  userAgent?: string;
  metadata?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        category: e.category,
        eventType: e.eventType,
        severity: e.severity || "info",
        actorId: e.actorId,
        actorName: e.actorName,
        actorRole: e.actorRole,
        actorEmail: e.actorEmail,
        targetId: e.targetId,
        targetType: e.targetType,
        targetName: e.targetName,
        previousState: e.previousState ?? undefined,
        newState: e.newState ?? undefined,
        ipAddress: e.ipAddress,
        userAgent: e.userAgent,
        metadata: e.metadata ?? undefined,
      },
    });
  } catch (err) {
    // Never let audit write failures break request handling
    console.error("[AUDIT] write failed:", err);
  }
}

export async function queryAudit(params: {
  category?: string;
  eventType?: string;
  severity?: string;
  actorId?: string;
  targetId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const where: any = {};
  if (params.category && params.category !== "all") where.category = params.category;
  if (params.eventType && params.eventType !== "all") where.eventType = params.eventType;
  if (params.severity && params.severity !== "all") where.severity = params.severity;
  if (params.actorId) where.actorId = params.actorId;
  if (params.targetId) where.targetId = params.targetId;
  if (params.startDate && !isNaN(Date.parse(params.startDate)))
    where.createdAt = { ...(where.createdAt || {}), gte: new Date(params.startDate) };
  if (params.endDate && !isNaN(Date.parse(params.endDate)))
    where.createdAt = { ...(where.createdAt || {}), lte: new Date(params.endDate) };
  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { eventType: { contains: q, mode: "insensitive" } },
      { actorName: { contains: q, mode: "insensitive" } },
      { targetName: { contains: q, mode: "insensitive" } },
      { actorEmail: { contains: q, mode: "insensitive" } },
    ];
  }
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return {
    events: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    hasMore: page * limit < total,
  };
}

export async function auditMetrics() {
  const [totalEvents, failedLogins, successfulLogins, roleChanges, aiQueries, criticalEvents] =
    await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { eventType: "auth.login.failure" } }),
      prisma.auditLog.count({ where: { eventType: "auth.login.success" } }),
      prisma.auditLog.count({ where: { eventType: "admin.role.updated" } }),
      prisma.auditLog.count({ where: { category: "ai" } }),
      prisma.auditLog.count({ where: { severity: "critical" } }),
    ]);
  return { totalEvents, failedLogins, successfulLogins, roleChanges, aiQueries, criticalEvents };
}

// ------------------------------------------------------------------
// REAL-TIME STATS (no hardcoded numbers anywhere)
// ------------------------------------------------------------------
export async function platformStats() {
  const [totalUsers, students, approvedFiles, pendingQueue, totalCourses, downloadsAgg] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "student" } }),
      prisma.resource.count({ where: { status: "approved" } }),
      prisma.resource.count({ where: { status: "pending" } }),
      prisma.course.count({ where: { archivedAt: null } }),
      prisma.resource.aggregate({ _sum: { downloadsCount: true } }),
    ]);
  return {
    totalUsers,
  students,
  approvedFiles,
  pendingQueue,
  totalCourses,
  totalDownloads: downloadsAgg._sum.downloadsCount ?? 0,
  systemStatus: "healthy" as const,
};
}

// ==================================================================
// ANNOUNCEMENTS
// ==================================================================
export async function createAnnouncement(data: {
  scope: string;
  targetId?: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  date: string;
  isPinned?: boolean;
  priority?: string;
}) {
  const entry = await prisma.announcement.create({ data });
  return {
    id: entry.id,
    scope: entry.scope,
    targetId: entry.targetId,
    title: entry.title,
    content: entry.content,
    authorName: entry.authorName,
    authorRole: entry.authorRole,
    date: entry.date,
    isPinned: entry.isPinned,
    priority: entry.priority,
    createdAt: entry.createdAt ? entry.createdAt.toISOString() : null,
    updatedAt: entry.updatedAt ? entry.updatedAt.toISOString() : null,
  };
}

export async function updateAnnouncement(id: string, data: {
  title?: string;
  content?: string;
  isPinned?: boolean;
  priority?: string;
  scope?: string;
  targetId?: string;
}) {
  const entry = await prisma.announcement.update({ where: { id }, data });
  return {
    id: entry.id,
    scope: entry.scope,
    targetId: entry.targetId,
    title: entry.title,
    content: entry.content,
    authorName: entry.authorName,
    authorRole: entry.authorRole,
    date: entry.date,
    isPinned: entry.isPinned,
    priority: entry.priority,
    createdAt: entry.createdAt ? entry.createdAt.toISOString() : null,
    updatedAt: entry.updatedAt ? entry.updatedAt.toISOString() : null,
  };
}

export async function deleteAnnouncement(id: string) {
  await prisma.announcement.delete({ where: { id } });
  return { success: true };
}

export async function listAnnouncements(filters?: { scope?: string; targetId?: string }) {
  const where: any = {};
  if (filters?.scope) where.scope = filters.scope;
  if (filters?.targetId) where.targetId = filters.targetId;
  const entries = await prisma.announcement.findMany({ where, orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }] });
  return entries.map((e) => ({
    id: e.id,
    scope: e.scope,
    targetId: e.targetId,
    title: e.title,
    content: e.content,
    authorName: e.authorName,
    authorRole: e.authorRole,
    date: e.date,
    isPinned: e.isPinned,
    priority: e.priority,
    createdAt: e.createdAt ? e.createdAt.toISOString() : null,
    updatedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
  }));
}

// ==================================================================
// CAMPUS EVENTS
// ==================================================================
export async function createEvent(data: {
  title: string;
  organizer: string;
  departmentId?: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: string;
  image?: string;
  maxCapacity?: number;
  speaker?: string;
  speakerTitle?: string;
  targetAudience?: string;
  requirements?: string;
  contactEmail?: string;
  contactPhone?: string;
  tags?: string[];
  status?: string;
  registeredStudents?: any[];
  agenda?: any[];
}) {
  const entry = await prisma.campusEvent.create({ data: data as any });
  return {
    id: entry.id,
    title: entry.title,
    organizer: entry.organizer,
    departmentId: entry.departmentId,
    date: entry.date,
    time: entry.time,
    location: entry.location,
    description: entry.description,
    category: entry.category,
    rsvpCount: entry.rsvpCount,
    image: entry.image,
    maxCapacity: entry.maxCapacity,
    speaker: entry.speaker,
    speakerTitle: entry.speakerTitle,
    targetAudience: entry.targetAudience,
    requirements: entry.requirements,
    contactEmail: entry.contactEmail,
    contactPhone: entry.contactPhone,
    tags: entry.tags,
    status: entry.status,
    registeredStudents: entry.registeredStudents,
    agenda: entry.agenda,
    createdAt: entry.createdAt ? entry.createdAt.toISOString() : null,
    updatedAt: entry.updatedAt ? entry.updatedAt.toISOString() : null,
  };
}

export async function updateEvent(id: string, data: {
  title?: string;
  organizer?: string;
  departmentId?: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  category?: string;
  image?: string;
  maxCapacity?: number;
  speaker?: string;
  speakerTitle?: string;
  targetAudience?: string;
  requirements?: string;
  contactEmail?: string;
  contactPhone?: string;
  tags?: string[];
  status?: string;
  registeredStudents?: any[];
  agenda?: any[];
}) {
  const entry = await prisma.campusEvent.update({ where: { id }, data: data as any });
  return {
    id: entry.id,
    title: entry.title,
    organizer: entry.organizer,
    departmentId: entry.departmentId,
    date: entry.date,
    time: entry.time,
    location: entry.location,
    description: entry.description,
    category: entry.category,
    rsvpCount: entry.rsvpCount,
    image: entry.image,
    maxCapacity: entry.maxCapacity,
    speaker: entry.speaker,
    speakerTitle: entry.speakerTitle,
    targetAudience: entry.targetAudience,
    requirements: entry.requirements,
    contactEmail: entry.contactEmail,
    contactPhone: entry.contactPhone,
    tags: entry.tags,
    status: entry.status,
    registeredStudents: entry.registeredStudents,
    agenda: entry.agenda,
    createdAt: entry.createdAt ? entry.createdAt.toISOString() : null,
    updatedAt: entry.updatedAt ? entry.updatedAt.toISOString() : null,
  };
}

export async function deleteEvent(id: string) {
  await prisma.campusEvent.delete({ where: { id } });
  return { success: true };
}

export async function listEvents(filters?: { category?: string; status?: string; date?: string }) {
  const where: any = {};
  if (filters?.category) where.category = filters.category;
  if (filters?.status) where.status = filters.status;
  if (filters?.date) where.date = filters.date;
  const entries = await prisma.campusEvent.findMany({ where, orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
  return entries.map((e) => ({
    id: e.id,
    title: e.title,
    organizer: e.organizer,
    departmentId: e.departmentId,
    date: e.date,
    time: e.time,
    location: e.location,
    description: e.description,
    category: e.category,
    rsvpCount: e.rsvpCount,
    image: e.image,
    maxCapacity: e.maxCapacity,
    speaker: e.speaker,
    speakerTitle: e.speakerTitle,
    targetAudience: e.targetAudience,
    requirements: e.requirements,
    contactEmail: e.contactEmail,
    contactPhone: e.contactPhone,
    tags: e.tags,
    status: e.status,
    registeredStudents: e.registeredStudents,
    agenda: e.agenda,
    createdAt: e.createdAt ? e.createdAt.toISOString() : null,
    updatedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
  }));
}

// ==================================================================
// ASSIGNMENTS
// ==================================================================
export async function createAssignment(data: {
  courseId: string;
  courseCode: string;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  weightPercent: number;
  status?: string;
  gradeAchieved?: number;
  submissionNotes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  departmentId?: string;
  level?: string;
  createdByName?: string;
  createdByRole?: string;
}) {
  const entry = await prisma.assignment.create({ data: data as any });
  return {
    id: entry.id,
    courseId: entry.courseId,
    courseCode: entry.courseCode,
    title: entry.title,
    description: entry.description,
    dueDate: entry.dueDate,
    totalPoints: entry.totalPoints,
    weightPercent: entry.weightPercent,
    status: entry.status,
    gradeAchieved: entry.gradeAchieved,
    submissionNotes: entry.submissionNotes,
    attachmentUrl: entry.attachmentUrl,
    attachmentName: entry.attachmentName,
    departmentId: entry.departmentId,
    level: entry.level,
    createdByName: entry.createdByName,
    createdByRole: entry.createdByRole,
    createdAt: entry.createdAt ? entry.createdAt.toISOString() : null,
    updatedAt: entry.updatedAt ? entry.updatedAt.toISOString() : null,
  };
}

export async function updateAssignment(id: string, data: {
  title?: string;
  description?: string;
  dueDate?: string;
  totalPoints?: number;
  weightPercent?: number;
  status?: string;
  gradeAchieved?: number;
  submissionNotes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}) {
  const entry = await prisma.assignment.update({ where: { id }, data: data as any });
  return {
    id: entry.id,
    courseId: entry.courseId,
    courseCode: entry.courseCode,
    title: entry.title,
    description: entry.description,
    dueDate: entry.dueDate,
    totalPoints: entry.totalPoints,
    weightPercent: entry.weightPercent,
    status: entry.status,
    gradeAchieved: entry.gradeAchieved,
    submissionNotes: entry.submissionNotes,
    attachmentUrl: entry.attachmentUrl,
    attachmentName: entry.attachmentName,
    departmentId: entry.departmentId,
    level: entry.level,
    createdByName: entry.createdByName,
    createdByRole: entry.createdByRole,
    createdAt: entry.createdAt ? entry.createdAt.toISOString() : null,
    updatedAt: entry.updatedAt ? entry.updatedAt.toISOString() : null,
  };
}

export async function deleteAssignment(id: string) {
  await prisma.assignment.delete({ where: { id } });
  return { success: true };
}

export async function listAssignments(filters?: { courseId?: string; departmentId?: string; status?: string }) {
  const where: any = {};
  if (filters?.courseId) where.courseId = filters.courseId;
  if (filters?.departmentId) where.departmentId = filters.departmentId;
  if (filters?.status) where.status = filters.status;
  const entries = await prisma.assignment.findMany({ where, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] });
  return entries.map((e) => ({
    id: e.id,
    courseId: e.courseId,
    courseCode: e.courseCode,
    title: e.title,
    description: e.description,
    dueDate: e.dueDate,
    totalPoints: e.totalPoints,
    weightPercent: e.weightPercent,
    status: e.status,
    gradeAchieved: e.gradeAchieved,
    submissionNotes: e.submissionNotes,
    attachmentUrl: e.attachmentUrl,
    attachmentName: e.attachmentName,
    departmentId: e.departmentId,
    level: e.level,
    createdByName: e.createdByName,
    createdByRole: e.createdByRole,
    createdAt: e.createdAt ? e.createdAt.toISOString() : null,
    updatedAt: e.updatedAt ? e.updatedAt.toISOString() : null,
  }));
}

export { bcrypt, toSafeResource };
