import { NextRequest, NextResponse } from 'next/server';
import { getWorkerEnv, isProductionRuntime } from '@/lib/cloudflareEnv';
import { attorneyConsentCopyVersion, attorneyDeliveryConsentText } from '@/lib/leadConsent';
import {
  decodeLocalSessionCookie,
  encodeLocalSessionCookie,
  getLeadSession,
  localSessionCookieName,
  rememberLocalLeadSession,
  startOtpUnlock
} from '@/lib/leadGate';
import { ResponsibleAttorney, UnlockStartResponse } from '@/types/calculator';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const env = getWorkerEnv();
    const body = await request.json() as {
      sessionId?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      consentToAttorneyShare?: boolean;
      phoneContactConsent?: boolean;
    };

    if (!body.sessionId || !body.firstName || !body.lastName || !body.email || !body.phone) {
      return NextResponse.json({ error: 'Session, name, email, and phone number are required.' }, { status: 400 });
    }

    let session = await getLeadSession(body.sessionId, env);
    if (!session && !env.LEADS_DB) {
      const cookieSession = decodeLocalSessionCookie(request.cookies.get(localSessionCookieName(body.sessionId))?.value);
      if (cookieSession) {
        rememberLocalLeadSession(cookieSession);
        session = cookieSession;
      }
    }
    if (!session) {
      return NextResponse.json({ error: 'Estimate session was not found. Please prepare the preview again.' }, { status: 404 });
    }

    const attorney = session.attorneyJson ? JSON.parse(session.attorneyJson) as ResponsibleAttorney : null;
    if (!attorney) {
      return NextResponse.json(
        { error: 'No named law firm or attorney contact option is available for this estimate.' },
        { status: 400 }
      );
    }

    if (!body.consentToAttorneyShare || !body.phoneContactConsent) {
      return NextResponse.json(
        { error: `Please confirm permission to send your results to ${attorney.name} and be contacted about your inquiry.` },
        { status: 400 }
      );
    }

    const otp = await startOtpUnlock(body.sessionId, {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone
    }, {
      attorneyDeliveryConsent: true,
      phoneContactConsent: true,
      consentCopyVersion: attorneyConsentCopyVersion(attorney),
      consentText: attorneyDeliveryConsentText(attorney)
    }, env);
    const response: UnlockStartResponse = {
      maskedPhone: otp.maskedPhone,
      duplicateWithin30Days: otp.duplicateWithin30Days,
      provider: otp.provider,
      otpLength: otp.otpLength,
      providerStatus: otp.providerStatus,
      devCode: otp.devCode
    };

    const nextResponse = NextResponse.json(response);
    if (!env.LEADS_DB) {
      const updatedSession = await getLeadSession(body.sessionId, env);
      if (updatedSession) {
        nextResponse.cookies.set(localSessionCookieName(body.sessionId), encodeLocalSessionCookie(updatedSession), {
          httpOnly: true,
          sameSite: 'lax',
          secure: isProductionRuntime(env),
          path: '/',
          maxAge: 30 * 60
        });
      }
    }

    return nextResponse;
  } catch (error) {
    console.error('OTP start error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to send verification code.' },
      { status: 400 }
    );
  }
}
