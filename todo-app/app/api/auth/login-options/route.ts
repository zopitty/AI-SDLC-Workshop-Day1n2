/**
 * GET /api/auth/login-options
 * Generate WebAuthn authentication challenge
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { userDB, authenticatorDB } from '@/lib/db';

// In-memory challenge storage
declare global {
  var loginChallengeStore: Map<string, { challenge: string; expiresAt: number; userId: number }> | undefined;
}

const challengeStore = global.loginChallengeStore || new Map();
global.loginChallengeStore = challengeStore;

const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = userDB.getByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's authenticators
    const authenticators = authenticatorDB.getByUserId(user.id);
    if (authenticators.length === 0) {
      return NextResponse.json(
        { error: 'No authenticators found for user' },
        { status: 404 }
      );
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: authenticators.map(auth => ({
        id: auth.credential_id,
        transports: JSON.parse(auth.transports || '[]'),
      })),
      userVerification: 'preferred',
    });

    // Store challenge
    challengeStore.set(username, {
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
      userId: user.id,
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error('Login options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate login options' },
      { status: 500 }
    );
  }
}
