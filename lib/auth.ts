import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const SESSION_COOKIE = 'todo-session';

export interface Session {
  userId: number;
  username: string;
}

/**
 * Create a session token and set cookie
 */
export async function createSession(userId: number, username: string): Promise<void> {
  const token = jwt.sign({ userId, username }, JWT_SECRET, {
    expiresIn: '7d',
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

/**
 * Get current session from cookie
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as Session;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Clear session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
