// Worker entry point for Next.js on Cloudflare
import workerCode from './.vercel/output/static/_worker.js/index.js';
import {
  createGeoBlockResponse,
  decideGeoAccess,
  readRequestGeo,
  requestWithGeoHeaders,
  shouldBypassGeoAccess
} from './lib/geoAccess.mjs';

let geoAccessLogSchemaReady = false;

async function sha256(value) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hashForAudit(value, env) {
  const salt = env.LEAD_HASH_SALT || (env.NODE_ENV === 'production' ? null : 'development-only-lead-hash-salt');
  if (!salt) {
    return 'unavailable';
  }
  return sha256(`${salt}:${value || 'unknown'}`);
}

function clientIp(request) {
  return request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
}

async function ensureGeoAccessLogSchema(env) {
  if (!env.LEADS_DB || geoAccessLogSchemaReady) return;

  await env.LEADS_DB.prepare(`
    CREATE TABLE IF NOT EXISTS geo_access_logs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      path TEXT NOT NULL,
      method TEXT NOT NULL,
      decision TEXT NOT NULL,
      reason TEXT,
      mode TEXT NOT NULL,
      lead_eligibility TEXT NOT NULL,
      country TEXT,
      region_code TEXT,
      region TEXT,
      city TEXT,
      ip_hash TEXT NOT NULL,
      user_agent_hash TEXT NOT NULL
    )
  `).run();
  await env.LEADS_DB.prepare('CREATE INDEX IF NOT EXISTS idx_geo_access_logs_created ON geo_access_logs (created_at)').run();
  await env.LEADS_DB.prepare('CREATE INDEX IF NOT EXISTS idx_geo_access_logs_decision_created ON geo_access_logs (decision, created_at)').run();
  geoAccessLogSchemaReady = true;
}

async function logGeoAccess(request, env, geo, decision) {
  if (!env.LEADS_DB) return;

  try {
    const url = new URL(request.url);
    await ensureGeoAccessLogSchema(env);
    await env.LEADS_DB.prepare(`
      INSERT INTO geo_access_logs (
        id, created_at, path, method, decision, reason, mode, lead_eligibility,
        country, region_code, region, city, ip_hash, user_agent_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      new Date().toISOString(),
      url.pathname,
      request.method,
      decision.decision,
      decision.reason,
      decision.mode,
      decision.leadEligibility,
      geo.country || null,
      geo.regionCode || null,
      geo.region || null,
      geo.city || null,
      await hashForAudit(clientIp(request), env),
      await hashForAudit(request.headers.get('user-agent') || 'unknown', env)
    ).run();
  } catch (error) {
    console.warn('Unable to write geo access log', error);
  }
}

export default {
  async fetch(request, env, ctx) {
    if (!env.ASSETS) {
      console.error('Missing Cloudflare static assets binding: ASSETS');
      return new Response('Static asset binding is not configured.', { status: 503 });
    }

    const url = new URL(request.url);
    if (!shouldBypassGeoAccess(url.pathname, request.headers.get('user-agent') || '')) {
      const geo = readRequestGeo(request);
      const decision = decideGeoAccess(geo, env);
      ctx.waitUntil(logGeoAccess(request, env, geo, decision));

      if (!decision.allowed) {
        return createGeoBlockResponse(request, decision, geo);
      }

      request = requestWithGeoHeaders(request, geo, decision);
    }
    
    // Call the original worker with the env that includes ASSETS
    return workerCode.fetch(request, env, ctx);
  }
};
