/**
 * GET /api/auth/register-options
 * Generate WebAuthn registration challenge
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { userDB } from '@/lib/db';

// In-memory challenge storage (5-minute expiry)
declare global {
  var registerChallengeStore: Map<string, { challenge: string; expiresAt: number; username: string }> | undefined;
}

const challengeStore = global.registerChallengeStore || new Map();
global.registerChallengeStore = challengeStore;

// Clean up expired challenges every 5 minutes
if (!global.registerChallengeStore) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of challengeStore.entries()) {
      if (value.expiresAt < now) {
        challengeStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

const rpName = 'Todo App';
const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const origin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // Validate username
    if (!username || username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: 'Invalid username format. Must be 3-30 characters.' },
        { status: 400 }
      );
    }

    // Check if username already exists
    if (userDB.exists(username)) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: username,
      userDisplayName: username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257],
    });

    // Store challenge for verification (5-minute expiry)
    challengeStore.set(username, {
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
      username,
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error('Registration options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}
