/**
 * POST /api/auth/register-verify
 * Verify WebAuthn registration response
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { userDB, authenticatorDB } from '@/lib/db';
import { createSession, createSessionCookie } from '@/lib/auth';

// Share challenge store with register-options
declare global {
  var registerChallengeStore: Map<string, { challenge: string; expiresAt: number; username: string }> | undefined;
}

const challengeStore = global.registerChallengeStore || new Map();
global.registerChallengeStore = challengeStore;

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

    // Verify registration response
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 400 }
      );
    }

    // Clear challenge
    challengeStore.delete(username);

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Create user
    const user = userDB.create(username);

    // Create authenticator
    authenticatorDB.create({
      user_id: user.id,
      credential_id: credential.id,
      credential_public_key: Buffer.from(credential.publicKey).toString('base64'),
      counter: credential.counter ?? 0,
      credential_device_type: credentialDeviceType,
      credential_backed_up: credentialBackedUp,
      transports: response.response.transports || [],
    });

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
    console.error('Registration verification error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
