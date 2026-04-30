import { NextRequest, NextResponse } from 'next/server';
import { getWorkerEnv, isProductionRuntime } from '@/lib/cloudflareEnv';
import {
  decodeLocalSessionCookie,
  encodeLocalSessionCookie,
  getLeadSession,
  localSessionCookieName,
  rememberLocalLeadSession,
  unlockEstimateOnly
} from '@/lib/leadGate';
import { EstimateOnlyUnlockResponse } from '@/types/calculator';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const env = getWorkerEnv();
    const body = await request.json() as {
      sessionId?: string;
    };

    if (!body.sessionId) {
      return NextResponse.json({ error: 'Session is required.' }, { status: 400 });
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

    const unlocked = await unlockEstimateOnly(body.sessionId, env);
    const response: EstimateOnlyUnlockResponse = {
      results: unlocked.result,
      responsibleAttorney: null,
      leadDeliveryStatus: unlocked.session.leadDeliveryStatus
    };

    const nextResponse = NextResponse.json(response);
    if (!env.LEADS_DB) {
      nextResponse.cookies.set(localSessionCookieName(body.sessionId), encodeLocalSessionCookie(unlocked.session), {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProductionRuntime(env),
        path: '/',
        maxAge: 30 * 60
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Estimate-only unlock error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to unlock the estimate.' },
      { status: 400 }
    );
  }
}
