import { NextRequest, NextResponse } from 'next/server';
import { userDB } from '@/lib/db';
import { createSession } from '@/lib/auth';

/**
 * POST /api/auth/login
 * Simple login (create user if doesn't exist)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    let user = userDB.getByUsername(username);
    
    if (!user) {
      user = userDB.create(username);
    }

    await createSession(user.id, user.username);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
