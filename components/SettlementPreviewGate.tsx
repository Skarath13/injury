'use client';

import { useState } from 'react';
import { AlertCircle, KeyRound, Lock, MessageSquare, Phone, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  EstimatePreviewResponse,
  ResponsibleAttorney,
  SettlementResult,
  UnlockStartResponse,
  UnlockVerifyResponse
} from '@/types/calculator';

interface Props {
  preview: EstimatePreviewResponse;
  onBack: () => void;
  onUnlocked: (results: SettlementResult, attorney: ResponsibleAttorney | null, leadDeliveryStatus: string) => void;
}

export default function SettlementPreviewGate({ preview, onBack, onUnlocked }: Props) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [otpSent, setOtpSent] = useState<UnlockStartResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startUnlock = async () => {
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch('/api/estimate/unlock/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: preview.sessionId,
          phone,
          consentToAttorneyShare: preview.requiresAttorneyConsent ? consent : false,
          phoneContactConsent: preview.requiresAttorneyConsent ? consent : false
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to send verification code.');
      }

      setOtpSent(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send verification code.');
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    setError(null);
    setIsVerifying(true);

    try {
      const response = await fetch('/api/estimate/unlock/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: preview.sessionId,
          code
        })
      });

      const payload: UnlockVerifyResponse & { error?: string } = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to verify code.');
      }

      onUnlocked(payload.results, payload.responsibleAttorney, payload.leadDeliveryStatus);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to verify code.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="mx-auto max-w-4xl shadow-sm">
      <CardHeader className="bg-slate-950 text-white">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Lock data-icon="inline-start" />
          Your range is ready
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-6 md:p-8">
        <div className="relative grid grid-cols-3 gap-2 text-center sm:gap-4">
          {['Conservative', 'Most likely', 'Upper range'].map((label) => (
            <div key={label} className="overflow-hidden rounded-lg border bg-emerald-50 p-4">
              <p className="mb-2 text-xs text-muted-foreground sm:text-sm">{label}</p>
              <p className="select-none text-xl font-bold text-emerald-700 blur-sm sm:text-3xl" aria-hidden="true">
                $••,•••
              </p>
            </div>
          ))}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg border bg-background/95 px-4 py-2 shadow-sm">
              <p className="text-sm font-semibold">{preview.blurredRangeLabel}</p>
            </div>
          </div>
        </div>

        <details className="rounded-lg border bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
          <summary className="flex cursor-pointer items-center gap-2 font-medium text-foreground">
            <ShieldCheck className="size-4 text-sky-700" />
            Preview details
          </summary>
          <div className="mt-2 flex flex-col gap-1">
            <p>
              County: <span className="font-semibold">{preview.county}</span>. Severity band: <span className="font-semibold">{preview.severityBand}</span>.
            </p>
            <p>Logic version {preview.logicVersion} ({preview.logicHash}) was used for this preview.</p>
          </div>
        </details>

        {preview.responsibleAttorney ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-0">
              <CardTitle>Attorney advertising disclosure</CardTitle>
              <CardDescription>{preview.responsibleAttorney.disclosure}</CardDescription>
            </CardHeader>
            <CardContent>
              <Field orientation="horizontal">
                <Checkbox
                  id="attorney-consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                />
                <FieldContent>
                  <FieldLabel htmlFor="attorney-consent">
                    Send my results to {preview.responsibleAttorney.name}
                  </FieldLabel>
                  <FieldDescription>
                    I give permission to send my calculator results and contact information to {preview.responsibleAttorney.name}, State Bar No. {preview.responsibleAttorney.barNumber}. This does not create an attorney-client relationship.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <AlertDescription>
              No active attorney advertiser is configured for this county; results will not be sent to an attorney.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare data-icon="inline-start" />
              Phone verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="unlock-phone">
                  <Phone data-icon="inline-start" />
                  Mobile phone
                </FieldLabel>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Input
                    id="unlock-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="(555) 555-5555"
                  />
                  <Button
                    type="button"
                    onClick={startUnlock}
                    disabled={isSending || !phone || (preview.requiresAttorneyConsent && !consent)}
                    className="bg-emerald-700 text-white hover:bg-emerald-600"
                  >
                    {isSending ? 'Sending...' : 'Send code'}
                  </Button>
                </div>
              </Field>

              {otpSent && (
                <Field>
                  <FieldLabel>
                    <KeyRound data-icon="inline-start" />
                    4-digit code
                  </FieldLabel>
                  <FieldDescription>
                    Code sent to {otpSent.maskedPhone}.
                    {otpSent.duplicateWithin30Days && ' This phone was already used for a recent attorney-delivery request, so any attorney lead is marked duplicate/no-charge.'}
                    {otpSent.devCode && ` Development code: ${otpSent.devCode}.`}
                  </FieldDescription>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <InputOTP maxLength={4} value={code} onChange={setCode}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                    <Button
                      type="button"
                      onClick={verifyCode}
                      disabled={isVerifying || code.length !== 4}
                      className="bg-sky-700 text-white hover:bg-sky-600"
                    >
                      {isVerifying ? 'Verifying...' : 'Unlock estimate'}
                    </Button>
                  </div>
                </Field>
              )}
            </FieldGroup>

            {error && (
              <Alert className="mt-4" variant="destructive">
                <AlertCircle data-icon="inline-start" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <details className="rounded-lg border bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">Notice at collection</summary>
          <p className="mt-2">
            We use calculator inputs, phone verification data, IP/user-agent hashes, coarse California eligibility signals, and consent records to create the estimate session, reduce duplicate submissions, and, only if you consent, send results to the named attorney shown above. See the{' '}
            <a href="/privacy" className="font-medium text-primary underline">Privacy Policy</a>
            {' '}and{' '}
            <a href="/privacy#do-not-sell-or-share" className="font-medium text-primary underline">Do Not Sell/Share</a>
            {' '}options.
          </p>
        </details>

        <Button type="button" variant="ghost" className="w-fit" onClick={onBack}>
          Back to calculator
        </Button>
      </CardContent>
    </Card>
  );
}
