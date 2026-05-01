import { NextRequest, NextResponse } from 'next/server';
import { getWorkerEnv, isProductionRuntime } from '@/lib/cloudflareEnv';
import {
  decodeLocalSessionCookie,
  encodeLocalSessionCookie,
  getLeadSession,
  localSessionCookieName,
  rememberLocalLeadSession,
  restoreUnlockedEstimate
} from '@/lib/leadGate';
import { RestoreUnlockedEstimateResponse } from '@/types/calculator';

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

    const restored = await restoreUnlockedEstimate(body.sessionId, env);
    const response: RestoreUnlockedEstimateResponse = {
      results: restored.result,
      responsibleAttorney: restored.attorney,
      leadDeliveryStatus: restored.session.leadDeliveryStatus
    };

    const nextResponse = NextResponse.json(response);
    if (!env.LEADS_DB) {
      nextResponse.cookies.set(localSessionCookieName(body.sessionId), encodeLocalSessionCookie(restored.session), {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProductionRuntime(env),
        path: '/',
        maxAge: 30 * 60
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Unlocked estimate restore error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to restore the unlocked estimate.' },
      { status: 400 }
    );
  }
}
