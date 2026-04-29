import { NextResponse } from 'next/server';
import {
  createFormStartToken,
  FORM_START_COOKIE_NAME,
  formStartCookieMaxAgeSeconds
} from '@/lib/leadGate';
import { getWorkerEnv } from '@/lib/cloudflareEnv';

export const runtime = 'edge';

export async function POST() {
  const token = await createFormStartToken(getWorkerEnv());
  const response = NextResponse.json({ ok: true });

  response.cookies.set(FORM_START_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: formStartCookieMaxAgeSeconds()
  });

  return response;
}
