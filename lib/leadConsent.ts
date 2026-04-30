import { ResponsibleAttorney } from '@/types/calculator';

export const DEFAULT_ATTORNEY_CONSENT_COPY_VERSION = 'attorney-delivery-consent-2026-04-29-v1';

export function attorneyConsentCopyVersion(attorney: ResponsibleAttorney): string {
  return attorney.consentCopyVersion || DEFAULT_ATTORNEY_CONSENT_COPY_VERSION;
}

export function attorneyDeliveryConsentText(attorney: ResponsibleAttorney): string {
  return [
    `I authorize California Settlement Calculator to send my calculator inputs, estimate results, name, email, and phone number to the named law firm or attorney sponsor shown in the unlock flow: ${attorney.name}, State Bar No. ${attorney.barNumber}.`,
    `I authorize ${attorney.name} or the responsible law firm shown in the unlock flow to call, text, or email me about my auto injury inquiry, including by automated technology.`,
    'I agree to receive a one-time SMS verification code for this unlock, and I understand message and data rates may apply.',
    'I understand consent is not required to view my estimate, this does not create an attorney-client relationship, the firm may decline representation, and California Settlement Calculator may be compensated for a sponsored contact submission.'
  ].join(' ');
}
