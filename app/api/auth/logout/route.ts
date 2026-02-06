import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Clear session
 */
export async function POST(request: NextRequest) {
  await clearSession();
  return NextResponse.json({ success: true });
}
