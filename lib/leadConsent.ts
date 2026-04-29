import { ResponsibleAttorney } from '@/types/calculator';

export const DEFAULT_ATTORNEY_CONSENT_COPY_VERSION = 'attorney-delivery-consent-2026-04-29-v1';

export function attorneyConsentCopyVersion(attorney: ResponsibleAttorney): string {
  return attorney.consentCopyVersion || DEFAULT_ATTORNEY_CONSENT_COPY_VERSION;
}

export function attorneyDeliveryConsentText(attorney: ResponsibleAttorney): string {
  return [
    `I authorize California Settlement Calculator to send my calculator inputs, estimate results, and contact information to ${attorney.name}, State Bar No. ${attorney.barNumber}.`,
    `I authorize ${attorney.name} or the law firm responsible for this attorney advertisement to call or text me at the phone number I provide about my auto injury inquiry, including by automated technology.`,
    'I understand consent is not required to view my estimate, this does not create an attorney-client relationship, and California Settlement Calculator may be compensated for a qualified lead.'
  ].join(' ');
}
