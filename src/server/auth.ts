import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ACM@1109';

interface FailedAttemptRecord {
  count: number;
  lockedUntil?: number;
}

const failedAttempts = new Map<string, FailedAttemptRecord>();
const activeSessions = new Map<string, { createdAt: number; expiresAt: number }>();

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

function cleanOldSessions() {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(token);
    }
  }
}

export function verifyAdminPassword(password: string, clientIp: string): { success: boolean; token?: string; error?: string } {
  cleanOldSessions();
  const now = Date.now();

  const ipRecord = failedAttempts.get(clientIp);
  if (ipRecord && ipRecord.lockedUntil && ipRecord.lockedUntil > now) {
    const remainingMinutes = Math.ceil((ipRecord.lockedUntil - now) / 60000);
    return {
      success: false,
      error: `Too many failed attempts. Control Center locked for ${remainingMinutes} more minute(s).`,
    };
  }

  // Constant-time comparison
  const passwordBuffer = Buffer.from(password);
  const targetBuffer = Buffer.from(ADMIN_PASSWORD);

  let isMatch = false;
  if (passwordBuffer.length === targetBuffer.length) {
    isMatch = crypto.timingSafeEqual(passwordBuffer, targetBuffer);
  }

  if (!isMatch) {
    const record = failedAttempts.get(clientIp) || { count: 0 };
    record.count += 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_MS;
    }
    failedAttempts.set(clientIp, record);
    return {
      success: false,
      error: `Incorrect administrator password. Attempt ${record.count} of ${MAX_FAILED_ATTEMPTS}.`,
    };
  }

  // Reset failed attempts on success
  failedAttempts.delete(clientIp);

  // Generate secure session token
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, {
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });

  return { success: true, token };
}

export function validateSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  cleanOldSessions();
  const session = activeSessions.get(token);
  if (!session) return false;
  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

export function invalidateSession(token: string) {
  activeSessions.delete(token);
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-admin-token'] as string);

  if (!validateSessionToken(token)) {
    return res.status(401).json({
      error: 'Unauthorized. Please sign in to the Competition Control Center.',
    });
  }

  next();
}
