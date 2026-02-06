/**
 * POST /api/auth/login-verify
 * Verify WebAuthn authentication response
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { userDB, authenticatorDB } from '@/lib/db';
import { createSession, createSessionCookie } from '@/lib/auth';

// Share challenge store with login-options
declare global {
  var loginChallengeStore: Map<string, { challenge: string; expiresAt: number; userId: number }> | undefined;
}

const challengeStore = global.loginChallengeStore || new Map();
global.loginChallengeStore = challengeStore;

const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const origin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { response, username } = body;

    if (!username || !response) {
      return NextResponse.json(
        { error: 'Missing username or response' },
        { status: 400 }
      );
    }

    // Retrieve stored challenge
    const storedChallenge = challengeStore.get(username);
    if (!storedChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found or expired' },
        { status: 400 }
      );
    }

    // Check expiration
    if (storedChallenge.expiresAt < Date.now()) {
      challengeStore.delete(username);
      return NextResponse.json(
        { error: 'Challenge expired' },
        { status: 400 }
      );
    }

    // Get authenticator
    const credentialId = response.id;
    const authenticator = authenticatorDB.getByCredentialId(credentialId);
    
    if (!authenticator) {
      return NextResponse.json(
        { error: 'Authenticator not found' },
        { status: 404 }
      );
    }

    // Verify authentication response
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.credential_id,
        publicKey: Buffer.from(authenticator.credential_public_key, 'base64'),
        counter: authenticator.counter ?? 0,
      },
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 400 }
      );
    }

    // Clear challenge
    challengeStore.delete(username);

    // Update authenticator counter (anti-replay protection)
    const newCounter = verification.authenticationInfo.newCounter;
    authenticatorDB.updateCounter(credentialId, newCounter);

    // Get user
    const user = userDB.getById(authenticator.user_id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create session
    const sessionToken = await createSession(user.id, user.username);

    // Return success with session cookie
    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    res.headers.set('Set-Cookie', createSessionCookie(sessionToken));

    return res;
  } catch (error) {
    console.error('Login verification error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
