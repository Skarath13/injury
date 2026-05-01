#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'https://api.brevo.com/v3';
const FEELER_FROM = {
  name: 'Katelyn Nguyen',
  email: 'contact@californiasettlementcalculator.com',
};
const FEELER_REPLY_TO = {
  name: 'Katelyn Nguyen',
  email: 'contact@californiasettlementcalculator.com',
};
const FEELER_URL = 'https://californiasettlementcalculator.com';
const FEELER_SUPPRESSION_FILE = 'outreach/sponsorship_feeler_suppression.csv';
const usage = `
Brevo outreach helper

Reads BREVO_API_KEY from the shell or ignored env files (.env.local, .env).
It also accepts BREVO_API_KEY_B64 or BREVO_MCP_TOKEN when the value is a
base64 JSON envelope like {"api_key":"xkeysib-..."}.

Commands:
  npm run brevo -- account
  npm run brevo -- senders
  npm run brevo -- sender:create "From Name" sender@example.com
  npm run brevo -- sender:validate 2 123456
  npm run brevo -- domains
  npm run brevo -- domain:create example.com
  npm run brevo -- domain:check example.com
  npm run brevo -- domain:authenticate example.com
  npm run brevo -- lists
  npm run brevo -- contact:upsert email@example.com 123 --fname Jane --lname Doe --firm "Firm" --ack-legitimate-list
  npm run brevo -- campaign:draft outreach/brevo_campaign_draft.example.json
  npm run brevo -- campaign:test 123 you@example.com
  npm run brevo -- feeler:preview "CallJacob"
  npm run brevo -- feeler:test "CallJacob" drburton369@gmail.com
  npm run brevo -- feeler:suppress info@example.com "not interested"
  npm run brevo -- feeler:send-one outreach/sponsorship_feeler_queue.json calljacob --confirm-send-one-to-one
  BREVO_ALLOW_SEND_NOW=1 npm run brevo -- campaign:send-now 123 --confirm-send-now

Safety notes:
  - feeler:test sends one transactional test email to the test recipient.
  - feeler:suppress records an opt-out in outreach/sponsorship_feeler_suppression.csv.
  - feeler:send-one sends exactly one transactional email and requires --confirm-send-one-to-one.
  - feeler:send-one refuses suppressed recipients before sending.
  - campaign:draft refuses scheduledAt/sendAtBestTime so it cannot schedule a send.
  - campaign:send-now requires BREVO_ALLOW_SEND_NOW=1 and --confirm-send-now.
  - contact:upsert requires --ack-legitimate-list because Brevo requires legitimate contacts.
`.trim();

loadEnvFile('.env.local');
loadEnvFile('.env');

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '-h' || command === '--help') {
  console.log(usage);
  process.exit(command ? 0 : 1);
}

const apiKey = getApiKey();

if (!apiKey && !['feeler:preview', 'feeler:suppress'].includes(command)) {
  fail('Missing BREVO_API_KEY. Add it to your shell or ignored .env.local, then retry.');
}

if (apiKey && !apiKey.startsWith('xkeysib-')) {
  fail('BREVO_API_KEY does not look like a Brevo v3 API key. Use the xkeysib-* value for REST API commands.');
}

try {
  const result = await run(command, args.slice(1));
  if (result !== undefined) {
    printJson(result);
  }
} catch (error) {
  fail(redactSecret(error.message || String(error)));
}

async function run(cmd, rest) {
  switch (cmd) {
    case 'account':
      return brevo('GET', '/account');

    case 'senders':
      return brevo('GET', '/senders');

    case 'sender:create': {
      const name = requireArg(rest[0], 'from name');
      const email = requireArg(rest[1], 'from email');
      return brevo('POST', '/senders', { name, email });
    }

    case 'sender:validate': {
      const senderId = requireArg(rest[0], 'sender id');
      const otp = Number(requireArg(rest[1], '6-digit verification code'));
      if (!Number.isInteger(otp) || otp < 100000 || otp > 999999) {
        fail('Verification code must be a 6-digit number.');
      }
      return brevo('PUT', `/senders/${encodeURIComponent(senderId)}/validate`, { otp });
    }

    case 'domains':
      return brevo('GET', '/senders/domains');

    case 'domain:create': {
      const domain = requireArg(rest[0], 'domain');
      return brevo('POST', '/senders/domains', { name: domain });
    }

    case 'domain:check': {
      const domain = requireArg(rest[0], 'domain');
      return brevo('GET', `/senders/domains/${encodeURIComponent(domain)}`);
    }

    case 'domain:authenticate': {
      const domain = requireArg(rest[0], 'domain');
      return brevo('PUT', `/senders/domains/${encodeURIComponent(domain)}/authenticate`);
    }

    case 'lists':
      return brevo('GET', '/contacts/lists?limit=50&offset=0');

    case 'contact:upsert': {
      requireFlag(rest, '--ack-legitimate-list');
      const email = requireArg(rest[0], 'email');
      const listIds = parseIdList(requireArg(rest[1], 'comma-separated list id(s)'));
      const attributes = {};
      setAttr(attributes, 'FIRSTNAME', flagValue(rest, '--fname'));
      setAttr(attributes, 'LASTNAME', flagValue(rest, '--lname'));
      setAttr(attributes, 'FIRM', flagValue(rest, '--firm'));

      return brevo('POST', '/contacts', {
        email,
        listIds,
        attributes,
        updateEnabled: true,
      });
    }

    case 'campaign:draft': {
      const file = requireArg(rest[0], 'campaign JSON file');
      const payload = readJson(file);
      assertDraftOnly(payload);
      return brevo('POST', '/emailCampaigns', payload);
    }

    case 'campaign:test': {
      const campaignId = requireArg(rest[0], 'campaign id');
      const emailTo = requireArg(rest[1], 'comma-separated test email(s)')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);
      return brevo('POST', `/emailCampaigns/${encodeURIComponent(campaignId)}/sendTest`, { emailTo });
    }

    case 'feeler:preview': {
      const firm = requireArg(rest[0], 'firm name');
      return buildFeelerEmail({ firm });
    }

    case 'feeler:test': {
      const firm = requireArg(rest[0], 'firm name');
      const email = requireArg(rest[1], 'test recipient email');
      const payload = buildFeelerEmail({
        firm,
        to: [{ email }],
      });
      return brevo('POST', '/smtp/email', payload);
    }

    case 'feeler:suppress': {
      const email = requireArg(rest[0], 'email');
      const reason = rest.slice(1).join(' ') || 'opt_out';
      return suppressEmail(email, reason);
    }

    case 'feeler:send-one': {
      requireFlag(rest, '--confirm-send-one-to-one');
      const file = requireArg(rest[0], 'queue JSON file');
      const id = requireArg(rest[1], 'queue id');
      const queue = readJson(file);
      if (!Array.isArray(queue)) {
        fail('Queue JSON must be an array.');
      }
      const entry = queue.find((item) => item.id === id);
      if (!entry) {
        fail(`No queue entry found for id: ${id}`);
      }
      if (entry.status !== 'ready') {
        fail(`Queue entry ${id} is not ready. Current status: ${entry.status || 'missing'}`);
      }
      if (isSuppressedEmail(entry.email)) {
        fail(`Refusing to send to suppressed recipient: ${entry.email}`);
      }
      const payload = buildFeelerEmail({
        firm: entry.firm,
        to: [{ email: entry.email }],
      });
      const result = await brevo('POST', '/smtp/email', payload);
      return {
        id,
        firm: entry.firm,
        email: entry.email,
        result,
      };
    }

    case 'campaign:send-now': {
      requireFlag(rest, '--confirm-send-now');
      if (process.env.BREVO_ALLOW_SEND_NOW !== '1') {
        fail('Refusing to send. Set BREVO_ALLOW_SEND_NOW=1 and pass --confirm-send-now.');
      }
      const campaignId = requireArg(rest[0], 'campaign id');
      return brevo('POST', `/emailCampaigns/${encodeURIComponent(campaignId)}/sendNow`);
    }

    default:
      fail(`Unknown command: ${cmd}\n\n${usage}`);
  }
}

async function brevo(method, endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const data = parseJson(text);

  if (!response.ok) {
    const detail = typeof data === 'object' && data ? JSON.stringify(data) : text || response.statusText;
    throw new Error(`${method} ${endpoint} failed (${response.status}): ${detail}`);
  }

  return data ?? { ok: true, status: response.status };
}

function buildFeelerEmail({ firm, to, subjectPrefix = '' }) {
  const subject = `${subjectPrefix}California injury calculator for ${firm}?`;
  const textContent = `Hi ${firm} team,

I built California Settlement Calculator:

${FEELER_URL}

Unlike a lot of "calculator" pages that stop at a vague "contact a lawyer" screen, this gives users an educational estimate. It is built from practical California injury-value factors, kept intentionally conservative, and the site makes clear throughout that it is educational only, not legal advice or a guaranteed outcome.

Quick context:

- It gives users a visible estimate instead of sending them straight into a generic intake form.
- It had 1,000+ Cloudflare-tracked visitors in the last 30 days before the recent mobile/desktop and SEO rebuild.
- I'm planning to test with one California PI sponsor, not a rotating marketplace of firms.

What may make it useful is the screening. Before any handoff, the flow checks California relevance, accident/county details, whether the visitor already has an attorney, affirmative sharing consent, US mobile/SMS verification, and recent duplicate phones. The goal is eligible, consented inquiries, not raw form-fill traffic.

I'm reaching out to a short list of California PI firms to see whether a flat monthly sponsorship or joint-ad placement is worth testing.

This would not be a referral fee, pay-per-signed-client deal, or guarantee of volume, case value, conversion rate, or outcome. Any placement would need written terms, attorney/ethics review, and clear SB 37-aware disclosures.

Worth reviewing?

If so, reply "send details" and I'll send the traffic snapshot and a simple sponsorship outline.

Best,
Katelyn Nguyen
Independent operator, California Settlement Calculator
${FEELER_FROM.email}
${FEELER_URL}
359 San Miguel Dr #107, Newport Beach, CA 92660

If this is not relevant, just reply "not interested" and I won't follow up.`;

  const htmlContent = `<!doctype html>
<html><body style="margin:0;padding:0;">
<div style="margin:0;padding:0;max-width:640px;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;">
<p style="margin:0 0 14px 0;">Hi ${escapeHtml(firm)} team,</p>
<p style="margin:0 0 14px 0;">I built California Settlement Calculator:</p>
<p style="margin:0 0 14px 0;"><a href="${FEELER_URL}">${FEELER_URL}</a></p>
<p style="margin:0 0 14px 0;">Unlike a lot of "calculator" pages that stop at a vague "contact a lawyer" screen, this gives users an <strong>educational estimate</strong>. It is built from practical California injury-value factors, kept intentionally conservative, and the site makes clear throughout that it is <em>educational only</em>, not legal advice or a guaranteed outcome.</p>
<p style="margin:0 0 8px 0;font-weight:700;color:#111;">Quick context:</p>
<ul style="margin:0 0 14px 20px;padding:0;">
  <li style="margin:0 0 6px 0;">It gives users a <strong>visible estimate</strong> instead of sending them straight into a generic intake form.</li>
  <li style="margin:0 0 6px 0;">It had <strong>1,000+ Cloudflare-tracked visitors</strong> in the last 30 days before the recent mobile/desktop and SEO rebuild.</li>
  <li style="margin:0;">I'm planning to test with <strong>one California PI sponsor</strong>, not a rotating marketplace of firms.</li>
</ul>
<p style="margin:0 0 14px 0;"><strong>What may make it useful is the screening.</strong> Before any handoff, the flow checks California relevance, accident/county details, whether the visitor already has an attorney, affirmative sharing consent, US mobile/SMS verification, and recent duplicate phones. The goal is <strong>eligible, consented inquiries</strong>, not raw form-fill traffic.</p>
<p style="margin:0 0 14px 0;">I'm reaching out to a short list of California PI firms to see whether a flat monthly sponsorship or joint-ad placement is worth testing.</p>
<p style="margin:0 0 14px 0;">This would not be a referral fee, pay-per-signed-client deal, or guarantee of volume, case value, conversion rate, or outcome. Any placement would need written terms, attorney/ethics review, and clear SB 37-aware disclosures.</p>
<p style="margin:0 0 14px 0;"><strong>Worth reviewing?</strong></p>
<p style="margin:0 0 18px 0;">If so, reply <strong>"send details"</strong> and I'll send the traffic snapshot and a simple sponsorship outline.</p>
<div style="margin:18px 0 0 0;">
  <div style="margin:0 0 6px 0;">Best,</div>
  <div style="font-weight:700;color:#111;">Katelyn Nguyen</div>
  <div style="color:#374151;">Independent operator, California Settlement Calculator</div>
  <div style="margin-top:6px;">
    <a href="mailto:${FEELER_FROM.email}" style="color:#2563eb;text-decoration:none;">${FEELER_FROM.email}</a>
    <span style="color:#9ca3af;"> | </span>
    <a href="${FEELER_URL}" style="color:#2563eb;text-decoration:none;">${FEELER_URL.replace('https://', '')}</a>
  </div>
  <div style="margin-top:4px;color:#6b7280;font-size:12px;">359 San Miguel Dr #107, Newport Beach, CA 92660</div>
</div>
<p style="margin:18px 0 0 0;color:#4b5563;">If this is not relevant, just reply <strong>"not interested"</strong> and I won't follow up.</p>
</div>
</body></html>`.trim();

  return {
    sender: FEELER_FROM,
    replyTo: FEELER_REPLY_TO,
    ...(to ? { to } : {}),
    subject,
    htmlContent,
    textContent,
  };
}

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = unquote(rawValue.trim());
  }
}

function getApiKey() {
  return [
    process.env.BREVO_API_KEY,
    process.env.BREVO_API_KEY_B64,
    process.env.BREVO_MCP_TOKEN,
  ]
    .map(extractApiKey)
    .find(Boolean);
}

function extractApiKey(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith('xkeysib-')) return trimmed;

  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    if (typeof parsed.api_key === 'string') return parsed.api_key.trim();
  } catch {
    // Not a base64 JSON token; let the caller decide whether it is usable.
  }

  return trimmed;
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function readJson(file) {
  const filePath = path.resolve(process.cwd(), file);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parseIdList(value) {
  const ids = value.split(',').map((item) => Number(item.trim()));
  if (!ids.length || ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    fail(`Invalid list id(s): ${value}`);
  }
  return ids;
}

function assertDraftOnly(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    fail('Campaign JSON must be an object.');
  }
  if (payload.scheduledAt || payload.sendAtBestTime) {
    fail('campaign:draft refuses scheduledAt/sendAtBestTime. Create the draft first, then send manually after review.');
  }
  if (!payload.name || !payload.sender || !payload.subject) {
    fail('Campaign JSON must include name, sender, and subject.');
  }
  const contentFields = ['htmlContent', 'htmlUrl', 'templateId'].filter((field) => payload[field] !== undefined);
  if (contentFields.length !== 1) {
    fail('Campaign JSON must include exactly one of htmlContent, htmlUrl, or templateId.');
  }
}

function flagValue(values, flag) {
  const index = values.indexOf(flag);
  return index === -1 ? undefined : values[index + 1];
}

function requireFlag(values, flag) {
  if (!values.includes(flag)) {
    fail(`Missing required safety flag: ${flag}`);
  }
}

function requireArg(value, name) {
  if (!value || value.startsWith('--')) {
    fail(`Missing ${name}.`);
  }
  return value;
}

function setAttr(attributes, key, value) {
  if (value) attributes[key] = value;
}

function suppressEmail(email, reason) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) fail('Invalid email for suppression.');
  ensureSuppressionFile();
  if (isSuppressedEmail(normalizedEmail)) {
    return { email: normalizedEmail, status: 'already_suppressed' };
  }

  const row = [
    new Date().toISOString(),
    normalizedEmail,
    reason,
  ].map(csvValue).join(',');
  fs.appendFileSync(path.resolve(process.cwd(), FEELER_SUPPRESSION_FILE), `${row}\n`);
  return { email: normalizedEmail, status: 'suppressed' };
}

function isSuppressedEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;
  ensureSuppressionFile();
  const filePath = path.resolve(process.cwd(), FEELER_SUPPRESSION_FILE);
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .some((line) => normalizeEmail(line.split(',')[1] || '') === normalizedEmail);
}

function ensureSuppressionFile() {
  const filePath = path.resolve(process.cwd(), FEELER_SUPPRESSION_FILE);
  if (fs.existsSync(filePath)) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, 'created_at,email,reason\n');
}

function normalizeEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : '';
}

function csvValue(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function redactSecret(value) {
  return value.replaceAll(apiKey, '[redacted]');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
