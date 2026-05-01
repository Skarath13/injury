#!/usr/bin/env node

import dns from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'https://api.cloudflare.com/client/v4';

const BREVO_RECORDS = [
  {
    type: 'CNAME',
    name: 'brevo1._domainkey.californiasettlementcalculator.com',
    content: 'b1.californiasettlementcalculator-com.dkim.brevo.com',
    proxied: false,
  },
  {
    type: 'CNAME',
    name: 'brevo2._domainkey.californiasettlementcalculator.com',
    content: 'b2.californiasettlementcalculator-com.dkim.brevo.com',
    proxied: false,
  },
  {
    type: 'TXT',
    name: 'californiasettlementcalculator.com',
    content: 'brevo-code:49f60760d4fe0e48f3bc73028ee841ab',
  },
  {
    type: 'TXT',
    name: '_dmarc.californiasettlementcalculator.com',
    content: 'v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com',
  },
];

const SPF_RECORD = {
  type: 'TXT',
  name: 'californiasettlementcalculator.com',
  content: 'v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com mx ~all',
};

const usage = `
Cloudflare DNS helper

Reads either:
  - CLOUDFLARE_API_TOKEN, or
  - CLOUDFLARE_GLOBAL_API_KEY plus CLOUDFLARE_EMAIL
from the shell or ignored env files (.env.local, .env).
API tokens need Zone:Read and DNS:Edit for californiasettlementcalculator.com.

Commands:
  npm run cloudflare:dns -- verify-brevo-dns
  npm run cloudflare:dns -- plan-brevo-email-auth
  npm run cloudflare:dns -- upsert-brevo-email-auth
`.trim();

loadEnvFile('.env.local');
loadEnvFile('.env');

const command = process.argv[2];

if (!command || command === '-h' || command === '--help') {
  console.log(usage);
  process.exit(command ? 0 : 1);
}

try {
  switch (command) {
    case 'verify-brevo-dns':
      await verifyDns();
      break;
    case 'plan-brevo-email-auth':
      printPlan();
      break;
    case 'upsert-brevo-email-auth':
      await upsertBrevoEmailAuth();
      break;
    default:
      fail(`Unknown command: ${command}\n\n${usage}`);
  }
} catch (error) {
  fail(error.message || String(error));
}

async function upsertBrevoEmailAuth() {
  const authHeaders = getAuthHeaders();

  const zone = await getZone(authHeaders, 'californiasettlementcalculator.com');
  const existingRecords = await listRecords(authHeaders, zone.id);

  await upsertRecord(authHeaders, zone.id, existingRecords, SPF_RECORD);
  for (const record of BREVO_RECORDS) {
    await upsertRecord(authHeaders, zone.id, existingRecords, record);
  }

  console.log('Cloudflare DNS records upserted. DNS propagation can take a few minutes.');
  await verifyDns();
}

function getAuthHeaders() {
  if (process.env.CLOUDFLARE_API_TOKEN) {
    return { authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` };
  }

  const globalKey = process.env.CLOUDFLARE_GLOBAL_API_KEY || process.env.CLOUDFLARE_API_KEY;
  const email = process.env.CLOUDFLARE_EMAIL;
  if (globalKey && email) {
    return {
      'X-Auth-Email': email,
      'X-Auth-Key': globalKey,
    };
  }

  fail('Missing Cloudflare auth. Set CLOUDFLARE_API_TOKEN or CLOUDFLARE_GLOBAL_API_KEY plus CLOUDFLARE_EMAIL.');
}

async function getZone(authHeaders, zoneName) {
  const data = await cloudflare(authHeaders, 'GET', `/zones?name=${encodeURIComponent(zoneName)}`);
  const zone = data.result?.[0];
  if (!zone) fail(`Could not find Cloudflare zone: ${zoneName}`);
  return zone;
}

async function listRecords(authHeaders, zoneId) {
  const records = [];
  let page = 1;
  while (true) {
    const data = await cloudflare(authHeaders, 'GET', `/zones/${zoneId}/dns_records?per_page=100&page=${page}`);
    records.push(...(data.result || []));
    if (!data.result_info || page >= data.result_info.total_pages) break;
    page += 1;
  }
  return records;
}

async function upsertRecord(authHeaders, zoneId, records, record) {
  const sameNameAndType = records.filter((item) => item.type === record.type && item.name === record.name);

  if (record.type === 'TXT' && record.content.startsWith('v=spf1')) {
    const spfRecords = sameNameAndType.filter((item) => normalizeTxt(item.content).startsWith('v=spf1'));
    const primary = spfRecords.find((item) => normalizeTxt(item.content) === record.content) || spfRecords[0];

    if (primary) {
      if (normalizeTxt(primary.content) === record.content) {
        console.log(`kept ${record.type} ${record.name}`);
      } else {
        await cloudflare(authHeaders, 'PUT', `/zones/${zoneId}/dns_records/${primary.id}`, {
          ...primary,
          content: record.content,
        });
        console.log(`updated ${record.type} ${record.name}`);
      }

      for (const duplicate of spfRecords.filter((item) => item.id !== primary.id)) {
        await cloudflare(authHeaders, 'DELETE', `/zones/${zoneId}/dns_records/${duplicate.id}`);
        console.log(`deleted duplicate SPF ${duplicate.name}`);
      }
      return;
    }
  }

  const existing = sameNameAndType.find((item) => normalizeTxt(item.content) === normalizeTxt(record.content));
  if (existing) {
    if (record.type === 'CNAME' && existing.proxied !== false) {
      await cloudflare(authHeaders, 'PUT', `/zones/${zoneId}/dns_records/${existing.id}`, {
        ...existing,
        content: record.content,
        proxied: false,
      });
      console.log(`updated ${record.type} ${record.name}`);
    } else {
      console.log(`kept ${record.type} ${record.name}`);
    }
    return;
  }

  const updateCandidate = sameNameAndType.length === 1 ? sameNameAndType[0] : null;
  const payload = {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: 1,
    proxied: record.type === 'CNAME' ? false : undefined,
  };

  if (updateCandidate && record.name !== 'californiasettlementcalculator.com') {
    await cloudflare(authHeaders, 'PUT', `/zones/${zoneId}/dns_records/${updateCandidate.id}`, payload);
    console.log(`updated ${record.type} ${record.name}`);
    return;
  }

  await cloudflare(authHeaders, 'POST', `/zones/${zoneId}/dns_records`, payload);
  console.log(`created ${record.type} ${record.name}`);
}

async function cloudflare(authHeaders, method, endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      ...authHeaders,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(`${method} ${endpoint} failed: ${JSON.stringify(data.errors || data)}`);
  }
  return data;
}

async function verifyDns() {
  const checks = [
    resolve('MX', 'californiasettlementcalculator.com', () => dns.resolveMx('californiasettlementcalculator.com')),
    resolve('TXT root', 'californiasettlementcalculator.com', async () => flattenTxt(await dns.resolveTxt('californiasettlementcalculator.com'))),
    resolve('TXT _dmarc', '_dmarc.californiasettlementcalculator.com', async () => flattenTxt(await dns.resolveTxt('_dmarc.californiasettlementcalculator.com'))),
    resolve('CNAME brevo1', 'brevo1._domainkey.californiasettlementcalculator.com', () => dns.resolveCname('brevo1._domainkey.californiasettlementcalculator.com')),
    resolve('CNAME brevo2', 'brevo2._domainkey.californiasettlementcalculator.com', () => dns.resolveCname('brevo2._domainkey.californiasettlementcalculator.com')),
  ];

  const results = await Promise.all(checks);
  console.log(JSON.stringify(results, null, 2));
}

async function resolve(label, name, fn) {
  try {
    return { label, name, ok: true, value: await fn() };
  } catch (error) {
    return { label, name, ok: false, error: error.code || error.message };
  }
}

function flattenTxt(records) {
  return records.map((parts) => parts.join(''));
}

function normalizeTxt(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/^"(.*)"$/, '$1');
}

function printPlan() {
  console.log(JSON.stringify([SPF_RECORD, ...BREVO_RECORDS], null, 2));
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

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
