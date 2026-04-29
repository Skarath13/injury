import { NextRequest, NextResponse } from 'next/server';
import { getWorkerEnv } from '@/lib/cloudflareEnv';
import {
  decodeLocalSessionCookie,
  encodeLocalSessionCookie,
  getLeadSession,
  localSessionCookieName,
  rememberLocalLeadSession,
  verifyOtpUnlock
} from '@/lib/leadGate';
import { UnlockVerifyResponse } from '@/types/calculator';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const env = getWorkerEnv();
    const body = await request.json() as {
      sessionId?: string;
      code?: string;
    };

    if (!body.sessionId || !body.code) {
      return NextResponse.json({ error: 'Session and verification code are required.' }, { status: 400 });
    }

    if (!env.LEADS_DB) {
      const existingSession = await getLeadSession(body.sessionId, env);
      if (!existingSession) {
        const cookieSession = decodeLocalSessionCookie(request.cookies.get(localSessionCookieName(body.sessionId))?.value);
        if (cookieSession) {
          rememberLocalLeadSession(cookieSession);
        }
      }
    }

    const unlocked = await verifyOtpUnlock(body.sessionId, body.code, env);
    const response: UnlockVerifyResponse = {
      results: unlocked.result,
      responsibleAttorney: unlocked.attorney,
      leadDeliveryStatus: unlocked.session.leadDeliveryStatus
    };

    const nextResponse = NextResponse.json(response);
    if (!env.LEADS_DB) {
      nextResponse.cookies.set(localSessionCookieName(body.sessionId), encodeLocalSessionCookie(unlocked.session), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 30 * 60
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to verify code.' },
      { status: 400 }
    );
  }
}
