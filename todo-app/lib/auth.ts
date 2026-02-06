/**
 * Session management utilities using JWT
 */

import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

export interface Session {
  userId: number;
  username: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-CHANGE-IN-PRODUCTION-use-openssl-rand-base64-32'
);

/**
 * Create a JWT session token
 */
export async function createSession(userId: number, username: string): Promise<string> {
  const jwt = await new SignJWT({ userId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET);
  
  return jwt;
}

/**
 * Verify a JWT session token
 */
export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as number,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

/**
 * Get session from request cookies
 */
export async function getSession(request: NextRequest): Promise<Session | null> {
  const token = request.cookies.get('session')?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Create session cookie header
 */
export function createSessionCookie(token: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return `session=${token}; Path=/; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Max-Age=604800`;
}

/**
 * Create cookie header to clear session
 */
export function clearSessionCookie(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return `session=; Path=/; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Max-Age=0`;
}
