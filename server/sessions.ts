import crypto from 'crypto';

export interface UserSession {
  id: string;
  token: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  deviceInfo: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: number;
}

export interface PublicSessionInfo {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

export class SessionManager {
  private static SESSIONS_MAP = new Map<string, UserSession>(); // token -> UserSession
  private static USER_SESSIONS_INDEX = new Map<string, Set<string>>(); // userId -> Set<token>

  /**
   * Helper to parse simple device string from User-Agent without heavy external libraries
   */
  static parseUserAgent(ua?: string): string {
    if (!ua) return 'Web Browser · Desktop';
    let browser = 'Web Browser';
    let os = 'Unknown OS';

    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';

    if (ua.includes('Windows NT')) os = 'Windows';
    else if (ua.includes('Mac OS X')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return `${browser} · ${os}`;
  }

  /**
   * Create a new active session
   */
  static create(
    userId: string,
    userEmail: string,
    ipAddress: string,
    userAgent?: string,
    durationMs = 7 * 24 * 3600 * 1000 // 7 days
  ): { session: UserSession; token: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const sessionId = `sess-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const session: UserSession = {
      id: sessionId,
      token,
      userId,
      userEmail: userEmail.toLowerCase(),
      ipAddress: ipAddress || '127.0.0.1',
      deviceInfo: this.parseUserAgent(userAgent),
      createdAt: now,
      lastUsedAt: now,
      expiresAt: Date.now() + durationMs
    };

    this.SESSIONS_MAP.set(token, session);

    let userTokens = this.USER_SESSIONS_INDEX.get(userId);
    if (!userTokens) {
      userTokens = new Set<string>();
      this.USER_SESSIONS_INDEX.set(userId, userTokens);
    }
    userTokens.add(token);

    return { session, token };
  }

  /**
   * Validate and retrieve an active session by token
   */
  static validate(token: string): UserSession | null {
    if (!token) return null;
    const session = this.SESSIONS_MAP.get(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.revoke(token);
      return null;
    }

    // Update lastUsedAt timestamp (touch)
    session.lastUsedAt = new Date().toISOString();
    return session;
  }

  /**
   * List all active sessions for a specific user
   */
  static getSessionsForUser(userId: string, currentToken?: string): PublicSessionInfo[] {
    const tokens = this.USER_SESSIONS_INDEX.get(userId);
    if (!tokens) return [];

    const now = Date.now();
    const result: PublicSessionInfo[] = [];

    for (const token of tokens) {
      const session = this.SESSIONS_MAP.get(token);
      if (!session) {
        tokens.delete(token);
        continue;
      }

      if (now > session.expiresAt) {
        this.SESSIONS_MAP.delete(token);
        tokens.delete(token);
        continue;
      }

      result.push({
        id: session.id,
        deviceInfo: session.deviceInfo,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        isCurrent: token === currentToken
      });
    }

    return result.sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
  }

  /**
   * Revoke a specific session by token
   */
  static revoke(token: string): boolean {
    const session = this.SESSIONS_MAP.get(token);
    if (!session) return false;

    this.SESSIONS_MAP.delete(token);
    const userTokens = this.USER_SESSIONS_INDEX.get(session.userId);
    if (userTokens) {
      userTokens.delete(token);
    }
    return true;
  }

  /**
   * Revoke session by Session ID (with IDOR protection)
   */
  static revokeById(sessionId: string, authenticatedUserId: string): boolean {
    for (const [token, session] of this.SESSIONS_MAP.entries()) {
      if (session.id === sessionId) {
        if (session.userId !== authenticatedUserId) {
          return false; // Forbidden / IDOR protection
        }
        return this.revoke(token);
      }
    }
    return false;
  }

  /**
   * Invalidate all sessions for a user, optionally retaining the current session
   */
  static revokeAll(userId: string, keepCurrentToken?: string): number {
    const tokens = this.USER_SESSIONS_INDEX.get(userId);
    if (!tokens) return 0;

    let revokedCount = 0;
    for (const token of Array.from(tokens)) {
      if (keepCurrentToken && token === keepCurrentToken) {
        continue;
      }
      this.SESSIONS_MAP.delete(token);
      tokens.delete(token);
      revokedCount++;
    }

    return revokedCount;
  }
}
