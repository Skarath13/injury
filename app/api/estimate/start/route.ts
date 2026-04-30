import { NextResponse } from 'next/server';
import {
  createFormStartToken,
  FORM_START_COOKIE_NAME,
  formStartCookieMaxAgeSeconds
} from '@/lib/leadGate';
import { getWorkerEnv, isProductionRuntime } from '@/lib/cloudflareEnv';

export const runtime = 'edge';

export async function POST() {
  try {
    const env = getWorkerEnv();
    const token = await createFormStartToken(env);
    const response = NextResponse.json({ ok: true });

    response.cookies.set(FORM_START_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProductionRuntime(env),
      path: '/',
      maxAge: formStartCookieMaxAgeSeconds()
    });

    return response;
  } catch (error) {
    console.error('Estimate start error:', error);
    return NextResponse.json({ ok: false, error: 'Unable to start the estimate session.' });
  }
}
