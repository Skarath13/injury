export const UNLOCKED_ESTIMATE_SESSION_STORAGE_KEY = 'injury-calculator:unlocked-estimate:v1';
export const UNLOCKED_ESTIMATE_SESSION_VERSION = 1;

export interface UnlockedEstimateSession {
  version: typeof UNLOCKED_ESTIMATE_SESSION_VERSION;
  sessionId: string;
  savedAt: string;
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
    typeof storage.setItem !== 'function' ||
    typeof storage.removeItem !== 'function'
  ) {
    return null;
  }

  return storage;
}

export function normalizeUnlockedEstimateSession(value: unknown): UnlockedEstimateSession | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const candidate = value as Partial<UnlockedEstimateSession>;
  if (candidate.version !== UNLOCKED_ESTIMATE_SESSION_VERSION) return null;
  if (typeof candidate.sessionId !== 'string' || !candidate.sessionId.trim()) return null;

  return {
    version: UNLOCKED_ESTIMATE_SESSION_VERSION,
    sessionId: candidate.sessionId,
    savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : nowIso()
  };
}

export function readUnlockedEstimateSession(): UnlockedEstimateSession | null {
  const storage = getBrowserStorage();
  if (!storage) return null;

  try {
    const rawValue = storage.getItem(UNLOCKED_ESTIMATE_SESSION_STORAGE_KEY);
    return normalizeUnlockedEstimateSession(rawValue ? JSON.parse(rawValue) : null);
  } catch {
    return null;
  }
}

export function writeUnlockedEstimateSession(sessionId: string): void {
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    storage.setItem(UNLOCKED_ESTIMATE_SESSION_STORAGE_KEY, JSON.stringify({
      version: UNLOCKED_ESTIMATE_SESSION_VERSION,
      sessionId,
      savedAt: nowIso()
    }));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function clearUnlockedEstimateSession(): void {
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    storage.removeItem(UNLOCKED_ESTIMATE_SESSION_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
