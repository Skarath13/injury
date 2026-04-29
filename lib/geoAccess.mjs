const STATIC_ASSET_PATTERN = /\.(?:avif|bmp|css|gif|ico|jpe?g|js|json|map|mp4|png|svg|txt|webmanifest|webp|woff2?)$/i;
const VALID_GEO_ACCESS_MODES = new Set(['california', 'us', 'off']);

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function upper(value) {
  return cleanText(value).toUpperCase();
}

export function getGeoAccessMode(env = {}) {
  const mode = cleanText(env.GEO_ACCESS_MODE || 'california').toLowerCase();
  return VALID_GEO_ACCESS_MODES.has(mode) ? mode : 'california';
}

export function shouldBypassGeoAccess(pathname) {
  const path = pathname || '/';
  return path.startsWith('/_next/') ||
    path.startsWith('/__nextjs') ||
    path === '/favicon.ico' ||
    path === '/robots.txt' ||
    path === '/sitemap.xml' ||
    path === '/manifest.json' ||
    path.startsWith('/icons/') ||
    path.startsWith('/vehicle-damage/') ||
    STATIC_ASSET_PATTERN.test(path);
}

export function readRequestGeo(request) {
  const headers = request.headers;
  const cf = request.cf || {};

  return {
    country: upper(cf.country || headers.get('cf-ipcountry') || headers.get('x-vercel-ip-country') || headers.get('x-injury-geo-country')),
    regionCode: upper(cf.regionCode || headers.get('cf-region-code') || headers.get('x-vercel-ip-country-region') || headers.get('x-injury-geo-region-code')),
    region: cleanText(cf.region || headers.get('cf-region') || headers.get('x-injury-geo-region')),
    city: cleanText(cf.city || headers.get('cf-ipcity') || headers.get('x-vercel-ip-city') || headers.get('x-injury-geo-city'))
  };
}

export function isCaliforniaGeo(geo) {
  return geo.country === 'US' && (
    geo.regionCode === 'CA' ||
    geo.region.toLowerCase() === 'california'
  );
}

export function leadGeoEligibility(geo) {
  if (isCaliforniaGeo(geo)) return 'california';
  if (geo.country === 'US') return 'outside_california';
  if (geo.country) return 'outside_us';
  return 'unknown';
}

export function decideGeoAccess(geo, env = {}) {
  const mode = getGeoAccessMode(env);
  const leadEligibility = leadGeoEligibility(geo);

  if (mode === 'off') {
    return {
      allowed: true,
      decision: 'allowed_geo_off',
      reason: 'geo_access_disabled',
      mode,
      leadEligibility
    };
  }

  if (!geo.country) {
    const allowUnknown = env.NODE_ENV !== 'production' || env.GEO_ALLOW_UNKNOWN === 'true';
    return {
      allowed: allowUnknown,
      decision: allowUnknown ? 'allowed_unknown_location' : 'blocked_unknown_location',
      reason: 'geolocation_unavailable',
      mode,
      leadEligibility
    };
  }

  if (mode === 'us') {
    const allowed = geo.country === 'US';
    return {
      allowed,
      decision: allowed
        ? (leadEligibility === 'california' ? 'allowed_california' : 'allowed_us_non_california')
        : 'blocked_outside_us',
      reason: allowed ? 'us_visitor_allowed' : 'outside_us',
      mode,
      leadEligibility
    };
  }

  const allowed = leadEligibility === 'california';
  return {
    allowed,
    decision: allowed
      ? 'allowed_california'
      : (geo.country === 'US' ? 'blocked_outside_california' : 'blocked_outside_us'),
    reason: allowed
      ? 'california_visitor_allowed'
      : (geo.country === 'US' ? 'outside_california' : 'outside_us'),
    mode,
    leadEligibility
  };
}

export function requestWithGeoHeaders(request, geo, decision) {
  const headers = new Headers(request.headers);
  headers.set('x-injury-geo-decision', decision.decision);
  headers.set('x-injury-geo-eligibility', decision.leadEligibility);
  if (geo.country) headers.set('x-injury-geo-country', geo.country);
  if (geo.regionCode) headers.set('x-injury-geo-region-code', geo.regionCode);
  if (geo.region) headers.set('x-injury-geo-region', geo.region);
  if (geo.city) headers.set('x-injury-geo-city', geo.city);
  return new Request(request, { headers });
}

function blockMessage(decision) {
  if (decision.reason === 'outside_california') {
    return 'This calculator is built for California auto injury claims, so we only open the full site to visitors who appear to be in California.';
  }

  if (decision.reason === 'outside_us') {
    return 'This calculator is built for California auto injury claims in the United States, so the full site is not available from your current location.';
  }

  return 'We could not confirm that your visit is coming from California. To protect the calculator and attorney-delivery flow, we paused access for now.';
}

export function buildGeoBlockHtml({ decision, geo }) {
  const location = [geo.city, geo.region || geo.regionCode, geo.country].filter(Boolean).join(', ');
  const locationLine = location
    ? `Our location check read: ${escapeHtml(location)}.`
    : 'Our location check could not read a reliable location.';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="robots" content="noindex">
    <title>California Visitors Only</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #0f172a;
        --muted: #475569;
        --line: #cbd5e1;
        --sky: #0369a1;
        --gold: #b45309;
        --leaf: #166534;
        --bg: #f8fafc;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        min-height: 100dvh;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          linear-gradient(180deg, rgba(240, 249, 255, 0.95), rgba(255, 255, 255, 0.96) 46%, rgba(240, 253, 244, 0.88)),
          var(--bg);
      }
      main {
        min-height: 100vh;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: calc(24px + env(safe-area-inset-top)) 18px calc(24px + env(safe-area-inset-bottom));
      }
      .panel {
        width: min(100%, 680px);
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.45);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
      }
      .stripe {
        height: 8px;
        background: linear-gradient(90deg, var(--sky), var(--leaf), var(--gold));
      }
      .content {
        padding: clamp(28px, 7vw, 48px);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        min-height: 36px;
        border: 1px solid rgba(3, 105, 161, 0.2);
        border-radius: 999px;
        padding: 7px 12px;
        background: #e0f2fe;
        color: #075985;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      h1 {
        margin: 20px 0 12px;
        font-size: clamp(32px, 8vw, 58px);
        line-height: 0.98;
        letter-spacing: 0;
      }
      p {
        margin: 0;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.65;
      }
      .lead {
        max-width: 56ch;
        font-size: clamp(18px, 4.4vw, 21px);
        color: #334155;
      }
      .note {
        margin-top: 24px;
        border: 1px solid #fde68a;
        border-radius: 12px;
        background: #fffbeb;
        padding: 14px 16px;
      }
      .note p {
        color: #713f12;
        font-size: 14px;
        line-height: 1.55;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 26px;
      }
      a, button {
        min-height: 44px;
        border-radius: 10px;
        padding: 11px 15px;
        font: inherit;
        font-size: 15px;
        font-weight: 700;
        text-decoration: none;
      }
      .primary {
        border: 1px solid #0369a1;
        background: #0369a1;
        color: white;
      }
      .secondary {
        border: 1px solid var(--line);
        background: white;
        color: var(--ink);
      }
      .fineprint {
        margin-top: 22px;
        color: #64748b;
        font-size: 13px;
      }
      @media (max-width: 520px) {
        .panel { border-radius: 14px; }
        .actions { display: grid; }
        a, button { width: 100%; text-align: center; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="panel" aria-labelledby="geo-title">
        <div class="stripe"></div>
        <div class="content">
          <span class="badge">California website</span>
          <h1 id="geo-title">Thanks for stopping by.</h1>
          <p class="lead">${escapeHtml(blockMessage(decision))}</p>
          <div class="note">
            <p>${locationLine} If you are physically in California and this seems wrong, your network, VPN, or mobile carrier may be routing traffic through another region.</p>
          </div>
          <div class="actions">
            <a class="primary" href="/">Try again</a>
            <a class="secondary" href="mailto:shufflin_00@me.com?subject=California%20access%20help">Contact support</a>
          </div>
          <p class="fineprint">This educational calculator is designed for California auto injury claims only. Access controls also help reduce duplicate or non-eligible attorney lead submissions.</p>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export function createGeoBlockResponse(request, decision, geo) {
  const url = new URL(request.url);
  const wantsJson = url.pathname.startsWith('/api/') ||
    (request.headers.get('accept') || '').includes('application/json');

  if (wantsJson) {
    return Response.json({
      error: 'This California calculator is only available to eligible California visitors.',
      decision: decision.decision,
      reason: decision.reason
    }, {
      status: 403,
      headers: {
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex'
      }
    });
  }

  return new Response(buildGeoBlockHtml({ decision, geo }), {
    status: 403,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex'
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
