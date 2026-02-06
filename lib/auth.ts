<<<<<<< HEAD
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const SESSION_COOKIE = 'todo-session';
=======
/**
 * Authentication utilities
 * Stub implementation for PRP 01 - will be expanded in PRP 11
 */

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
>>>>>>> b2574c13dd2cac1a1b2477f1115ab91683911771

export interface Session {
  userId: number;
  username: string;
}

/**
<<<<<<< HEAD
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
=======
 * Get current session from cookie
 * Returns null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Session;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Create session cookie
 */
export async function createSession(userId: number, username: string): Promise<void> {
  const session: Session = { userId, username };
  const token = jwt.sign(session, JWT_SECRET, { expiresIn: '7d' });

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
>>>>>>> b2574c13dd2cac1a1b2477f1115ab91683911771
}

/**
 * Clear session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
<<<<<<< HEAD
  cookieStore.delete(SESSION_COOKIE);
=======
  cookieStore.delete('session');
}

/**
 * Stub: Get or create a demo user session
 * This is temporary - will be replaced with WebAuthn in PRP 11
 */
export async function getDemoSession(): Promise<Session> {
  let session = await getSession();
  
  if (!session) {
    // Create a default demo user session
    const demoUserId = 1;
    const demoUsername = 'demo-user';
    await createSession(demoUserId, demoUsername);
    session = { userId: demoUserId, username: demoUsername };
  }
  
  return session;
>>>>>>> b2574c13dd2cac1a1b2477f1115ab91683911771
}
