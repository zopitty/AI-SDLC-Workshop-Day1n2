/**
 * Simple auth helper for development
 * For production, implement full WebAuthn as per PRP 11
 */

import { userDB } from './db';

// For now, use a simple hardcoded user for development
export const DEV_USER_ID = 1;

// Initialize dev user on module load
let devUser = userDB.findById(DEV_USER_ID);
if (!devUser) {
  devUser = userDB.create('devuser');
}

export function getOrCreateDevUser() {
  return devUser || userDB.findById(DEV_USER_ID) || userDB.create('devuser');
}

export async function getSession() {
  // For development, always return the dev user
  // In production, implement JWT session management as per PRP 11
  const user = getOrCreateDevUser();
  return { userId: user.id };
}
