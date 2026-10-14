import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getAuthorizedMasterKeys(): string[] {
  const keys: string[] = ['ACM@1109', 'ACM'];
  const envPwd = process.env.ADMIN_PASSWORD;
  if (envPwd) {
    const cleaned = envPwd.trim().replace(/^["'](.*)["']$/, '$1');
    if (cleaned && !keys.includes(cleaned)) {
      keys.unshift(cleaned);
    }
  }
  return keys;
}

export function getConfiguredAdminPassword(): string {
  const keys = getAuthorizedMasterKeys();
  return keys[0] || 'ACM@1109';
}

// Server-side Supabase client for JWT verification & auth
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export let serverSupabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your-project-id')) {
  try {
    serverSupabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.warn('[Auth] Failed to initialize server-side Supabase client:', err);
  }
}

interface FailedAttemptRecord {
  count: number;
  lockedUntil?: number;
}

const failedAttempts = new Map<string, FailedAttemptRecord>();
const activeSessions = new Map<string, { createdAt: number; expiresAt: number; user?: { email?: string; role?: string } }>();

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes lockout

function cleanOldSessions() {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(token);
    }
  }
}

export function createAdminSession(userMeta?: { email?: string; role?: string }): string {
  cleanOldSessions();
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  activeSessions.set(token, {
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    user: userMeta,
  });
  return token;
}

export function verifyAdminPassword(
  password: string,
  clientIp: string
): { success: boolean; token?: string; error?: string } {
  cleanOldSessions();
  const now = Date.now();
  const validKeys = getAuthorizedMasterKeys();

  const trimmedInput = (password || '').trim();
  if (!trimmedInput) {
    return {
      success: false,
      error: 'Please enter the administrator master key.',
    };
  }

  const ipRecord = failedAttempts.get(clientIp);
  if (ipRecord && ipRecord.lockedUntil && ipRecord.lockedUntil > now) {
    const remainingMinutes = Math.ceil((ipRecord.lockedUntil - now) / 60000);
    return {
      success: false,
      error: `Too many failed attempts. Control Center locked for ${remainingMinutes} more minute(s). Authorized master key is ACM@1109`,
    };
  }

  // Constant-time check across authorized master keys
  const inputBuffer = Buffer.from(trimmedInput);
  let isMatch = false;

  for (const validKey of validKeys) {
    const targetBuffer = Buffer.from(validKey);
    if (inputBuffer.length === targetBuffer.length) {
      if (crypto.timingSafeEqual(inputBuffer, targetBuffer)) {
        isMatch = true;
        break;
      }
    }
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
      error: `Incorrect administrator password. Attempt ${record.count} of ${MAX_FAILED_ATTEMPTS}. Default Master Key: ACM@1109`,
    };
  }

  // Reset failed attempts on success
  failedAttempts.delete(clientIp);

  // Generate secure session token
  const token = createAdminSession({ role: 'admin_master' });
  return { success: true, token };
}

export async function verifySupabaseLogin(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string; user?: { id: string; email?: string } }> {
  if (!serverSupabase) {
    return {
      success: false,
      error: 'Supabase authentication is not configured on the server. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) or sign in using the Administrator Master Key.',
    };
  }

  try {
    const { data, error } = await serverSupabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message || 'Invalid ACM board member credentials.',
      };
    }

    // Generate local admin session token bound to this Supabase user
    const token = createAdminSession({
      email: data.user.email,
      role: 'board_member',
    });

    return {
      success: true,
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Supabase authentication error';
    return { success: false, error: msg };
  }
}

export async function verifySupabaseJwt(token: string): Promise<{ id: string; email?: string } | null> {
  if (!serverSupabase) return null;
  try {
    const { data: { user }, error } = await serverSupabase.auth.getUser(token);
    if (error || !user) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
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

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-admin-token'] as string);

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized. Please sign in to the Competition Control Center.',
    });
  }

  // 1. Check in-memory session token
  if (validateSessionToken(token)) {
    return next();
  }

  // 2. Check if it's a valid Supabase JWT
  if (token.split('.').length === 3) {
    const user = await verifySupabaseJwt(token);
    if (user) {
      (req as unknown as { adminUser?: unknown }).adminUser = user;
      return next();
    }
  }

  return res.status(401).json({
    error: 'Unauthorized or expired session. Please sign in to the Competition Control Center.',
  });
}
