/**
 * Centralized Immutable Audit Logging System
 * Tracks security-relevant, administrative, authentication, and moderation activities.
 */

export type AuditCategory =
  "authentication" | "security" | "administration" | "moderation" | "ai" | "system";
export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditEvent {
  id: string;
  category: AuditCategory;
  eventType: string;
  severity: AuditSeverity;
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
  metadata?: Record<string, any>;
  timestamp: string;
}

// In-Memory Immutable Audit Store
const AUDIT_LOGS_DB: AuditEvent[] = [
  {
    id: "audit-init-01",
    category: "system",
    eventType: "system.boot",
    severity: "info",
    actorId: "sys-core",
    actorName: "EngHub System Kernel",
    actorRole: "super_admin",
    targetType: "system",
    ipAddress: "127.0.0.1",
    metadata: { version: "2026.8.18", modules: ["auth", "audit", "cache", "ai"] },
    timestamp: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
  {
    id: "audit-init-02",
    category: "authentication",
    eventType: "auth.login.success",
    severity: "info",
    actorId: "usr-super-admin-01",
    actorName: "Faculty Super Administrator",
    actorRole: "super_admin",
    actorEmail: "eldmrdasheslam1@gmail.com",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0",
    metadata: { method: "password" },
    timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: "audit-init-03",
    category: "administration",
    eventType: "admin.role.updated",
    severity: "warning",
    actorId: "usr-super-admin-01",
    actorName: "Faculty Super Administrator",
    actorRole: "super_admin",
    targetId: "usr-moderator-01",
    targetType: "user",
    targetName: "Dr. Content Moderator",
    previousState: { role: "student" },
    newState: { role: "moderator" },
    ipAddress: "192.168.1.100",
    timestamp: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
  },
  {
    id: "audit-init-04",
    category: "moderation",
    eventType: "moderation.post.solved",
    severity: "info",
    actorId: "usr-layla-102",
    actorName: "Layla Hassan",
    actorRole: "student",
    targetId: "disc-101",
    targetType: "discussion",
    targetName: "K-Map Don't Care Conditions",
    newState: { verifiedSolutionCommentId: "cmt-101", solverId: "usr-alex-101" },
    ipAddress: "192.168.1.142",
    timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
];

export class AuditLogger {
  /**
   * Record a new audit event (Immutable)
   */
  static log(eventData: Omit<AuditEvent, "id" | "timestamp">): AuditEvent {
    // Sanitization: Ensure sensitive data like passwords or tokens are never logged
    const sanitizedMetadata = eventData.metadata ? { ...eventData.metadata } : undefined;
    if (sanitizedMetadata) {
      delete sanitizedMetadata.password;
      delete sanitizedMetadata.passwordConfirm;
      delete sanitizedMetadata.token;
      delete sanitizedMetadata.sessionToken;
      delete sanitizedMetadata.secret;
    }

    const event: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...eventData,
      metadata: sanitizedMetadata,
      timestamp: new Date().toISOString(),
    };

    AUDIT_LOGS_DB.unshift(event);

    // Keep memory bound to 5,000 most recent records in memory
    if (AUDIT_LOGS_DB.length > 5000) {
      AUDIT_LOGS_DB.pop();
    }

    // Structured server log for observability
    console.log(
      `[AUDIT] [${event.severity.toUpperCase()}] [${event.category}] ${event.eventType} by ${event.actorName} (${event.actorRole}) on ${event.targetType || "system"}`,
    );

    return event;
  }

  /**
   * Query audit logs with server-side filtering, searching, and pagination
   */
  static query(params: {
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
    const {
      category,
      eventType,
      severity,
      actorId,
      targetId,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = params;

    let filtered = [...AUDIT_LOGS_DB];

    if (category && category !== "all") {
      filtered = filtered.filter((e) => e.category === category);
    }

    if (eventType && eventType !== "all") {
      filtered = filtered.filter((e) => e.eventType === eventType);
    }

    if (severity && severity !== "all") {
      filtered = filtered.filter((e) => e.severity === severity);
    }

    if (actorId) {
      filtered = filtered.filter((e) => e.actorId === actorId);
    }

    if (targetId) {
      filtered = filtered.filter((e) => e.targetId === targetId);
    }

    if (startDate) {
      const startMs = new Date(startDate).getTime();
      if (!isNaN(startMs)) {
        filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= startMs);
      }
    }

    if (endDate) {
      const endMs = new Date(endDate).getTime();
      if (!isNaN(endMs)) {
        filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= endMs);
      }
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.eventType.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q) ||
          (e.targetName && e.targetName.toLowerCase().includes(q)) ||
          (e.actorEmail && e.actorEmail.toLowerCase().includes(q)) ||
          e.ipAddress.includes(q),
      );
    }

    const total = filtered.length;
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const offset = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(offset, offset + limitNum);

    return {
      events: paginated,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      hasMore: offset + limitNum < total,
    };
  }

  /**
   * Aggregate metrics for Admin Activity Dashboard
   */
  static getMetrics() {
    const totalEvents = AUDIT_LOGS_DB.length;
    const failedLogins = AUDIT_LOGS_DB.filter((e) => e.eventType === "auth.login.failure").length;
    const successfulLogins = AUDIT_LOGS_DB.filter(
      (e) => e.eventType === "auth.login.success",
    ).length;
    const roleChanges = AUDIT_LOGS_DB.filter((e) => e.eventType === "admin.role.updated").length;
    const rateLimitTrips = AUDIT_LOGS_DB.filter(
      (e) => e.eventType === "security.rate_limited",
    ).length;
    const aiQueries = AUDIT_LOGS_DB.filter((e) => e.category === "ai").length;
    const criticalEvents = AUDIT_LOGS_DB.filter((e) => e.severity === "critical").length;

    return {
      totalEvents,
      successfulLogins,
      failedLogins,
      roleChanges,
      rateLimitTrips,
      aiQueries,
      criticalEvents,
    };
  }
}
