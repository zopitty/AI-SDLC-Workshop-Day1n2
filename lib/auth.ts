/**
 * Simple auth helper for development
 * For production, implement full WebAuthn as per PRP 11
 */

import { userDB } from './db';

// For now, use a simple hardcoded user for development
export const DEV_USER_ID = 1;

export function getOrCreateDevUser() {
  let user = userDB.findById(DEV_USER_ID);
  if (!user) {
    user = userDB.create('devuser');
  }
  return user;
}

export async function getSession() {
  // For development, always return the dev user
  // In production, implement JWT session management as per PRP 11
  return { userId: DEV_USER_ID };
}
