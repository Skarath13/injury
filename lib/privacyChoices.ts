export const PRIVACY_CHOICES_STORAGE_KEY = 'privacyChoices';
export const PRIVACY_CHOICES_VERSION = 'privacy-choices-2026-04-29-v1';

export interface PrivacyChoices {
  version: string;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
}

export interface PrivacyChoiceSnapshot extends PrivacyChoices {
  gpcEnabled: boolean;
  gpcHonored: boolean;
  effectiveAnalytics: boolean;
  effectiveMarketing: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  const storage = window.localStorage;
  if (
    !storage ||
    typeof storage.getItem !== 'function' ||
    typeof storage.setItem !== 'function'
  ) {
    return null;
  }

  return storage;
}

export function createDefaultPrivacyChoices(updatedAt = nowIso()): PrivacyChoices {
  return {
    version: PRIVACY_CHOICES_VERSION,
    analytics: false,
    marketing: false,
    updatedAt
  };
}

export function normalizePrivacyChoices(value: unknown, updatedAt = nowIso()): PrivacyChoices {
  if (!value || typeof value !== 'object') {
    return createDefaultPrivacyChoices(updatedAt);
  }

  const candidate = value as Partial<PrivacyChoices>;
  return {
    version: typeof candidate.version === 'string' ? candidate.version : PRIVACY_CHOICES_VERSION,
    analytics: candidate.analytics === true,
    marketing: candidate.marketing === true,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : updatedAt
  };
}

export function createPrivacyChoiceSnapshot(
  choices: PrivacyChoices,
  gpcEnabled: boolean
): PrivacyChoiceSnapshot {
  return {
    ...choices,
    gpcEnabled,
    gpcHonored: gpcEnabled,
    effectiveAnalytics: choices.analytics,
    effectiveMarketing: gpcEnabled ? false : choices.marketing
  };
}

export function readBrowserPrivacyChoices(): PrivacyChoiceSnapshot {
  const gpcEnabled = typeof navigator !== 'undefined' &&
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

  if (typeof window === 'undefined') {
    return createPrivacyChoiceSnapshot(createDefaultPrivacyChoices(), gpcEnabled);
  }

  try {
    const stored = getBrowserStorage()?.getItem(PRIVACY_CHOICES_STORAGE_KEY);
    return createPrivacyChoiceSnapshot(
      normalizePrivacyChoices(stored ? JSON.parse(stored) : null),
      gpcEnabled
    );
  } catch {
    return createPrivacyChoiceSnapshot(createDefaultPrivacyChoices(), gpcEnabled);
  }
}

export function writeBrowserPrivacyChoices(choices: PrivacyChoices): void {
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    storage.setItem(PRIVACY_CHOICES_STORAGE_KEY, JSON.stringify(choices));
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }
}
