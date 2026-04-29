export interface D1Result<T = unknown> {
  results?: T[];
  success?: boolean;
  meta?: unknown;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(columnName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
}

export interface KVNamespaceLike {
  get(key: string, options?: { type?: 'text' | 'json' }): Promise<unknown>;
  put?(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface WorkerEnv {
  LEADS_DB?: D1DatabaseLike;
  ATTORNEY_ROUTING?: KVNamespaceLike;
  TURNSTILE_SECRET_KEY?: string;
  LEAD_HASH_SALT?: string;
  OTP_DEV_MODE?: string;
  OTP_DEV_CODE?: string;
  SMS_PROVIDER?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
  NODE_ENV?: string;
}

export function getWorkerEnv(): WorkerEnv {
  try {
    const context = (globalThis as typeof globalThis & {
      [key: symbol]: { env?: WorkerEnv } | undefined;
    })[Symbol.for('__cloudflare-request-context__')];
    if (context?.env) {
      return context.env as WorkerEnv;
    }
  } catch {
    // Local Next.js development does not provide a Cloudflare request context.
  }

  return process.env as WorkerEnv;
}
