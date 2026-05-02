import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decideGeoAccess,
  isTrustedCrawlerUserAgent,
  leadGeoEligibility,
  shouldBypassGeoAccess
} from '../lib/geoAccess.mjs';

test('California-only geo gate allows California visitors', () => {
  const geo = { country: 'US', regionCode: 'CA', region: 'California', city: 'Irvine' };
  const decision = decideGeoAccess(geo, { NODE_ENV: 'production', GEO_ACCESS_MODE: 'california' });

  assert.equal(decision.allowed, true);
  assert.equal(decision.decision, 'allowed_california');
  assert.equal(decision.leadEligibility, 'california');
});

test('California-only geo gate blocks non-California US visitors', () => {
  const geo = { country: 'US', regionCode: 'NV', region: 'Nevada', city: 'Las Vegas' };
  const decision = decideGeoAccess(geo, { NODE_ENV: 'production', GEO_ACCESS_MODE: 'california' });

  assert.equal(decision.allowed, false);
  assert.equal(decision.decision, 'blocked_outside_california');
  assert.equal(decision.leadEligibility, 'outside_california');
});

test('US geo gate can allow non-California visitors without lead eligibility', () => {
  const geo = { country: 'US', regionCode: 'NV', region: 'Nevada', city: 'Las Vegas' };
  const decision = decideGeoAccess(geo, { NODE_ENV: 'production', GEO_ACCESS_MODE: 'us' });

  assert.equal(decision.allowed, true);
  assert.equal(decision.decision, 'allowed_us_non_california');
  assert.equal(decision.leadEligibility, 'outside_california');
});

test('production geo gate blocks unknown location unless explicitly allowed', () => {
  const geo = { country: '', regionCode: '', region: '', city: '' };
  const strictDecision = decideGeoAccess(geo, { NODE_ENV: 'production', GEO_ACCESS_MODE: 'california' });
  const allowedDecision = decideGeoAccess(geo, {
    NODE_ENV: 'production',
    GEO_ACCESS_MODE: 'california',
    GEO_ALLOW_UNKNOWN: 'true'
  });

  assert.equal(strictDecision.allowed, false);
  assert.equal(strictDecision.decision, 'blocked_unknown_location');
  assert.equal(allowedDecision.allowed, true);
  assert.equal(allowedDecision.decision, 'allowed_unknown_location');
});

test('local geo gate allows unknown location for development', () => {
  const geo = { country: '', regionCode: '', region: '', city: '' };
  const decision = decideGeoAccess(geo, { NODE_ENV: 'development', GEO_ACCESS_MODE: 'california' });

  assert.equal(decision.allowed, true);
  assert.equal(decision.decision, 'allowed_unknown_location');
});

test('lead geo eligibility distinguishes California from broader US access', () => {
  assert.equal(leadGeoEligibility({ country: 'US', regionCode: 'CA', region: '', city: '' }), 'california');
  assert.equal(leadGeoEligibility({ country: 'US', regionCode: 'OR', region: 'Oregon', city: '' }), 'outside_california');
  assert.equal(leadGeoEligibility({ country: 'CA', regionCode: 'BC', region: 'British Columbia', city: '' }), 'outside_us');
});

test('static asset paths bypass geo gate', () => {
  assert.equal(shouldBypassGeoAccess('/_next/static/app.js'), true);
  assert.equal(shouldBypassGeoAccess('/vehicle-damage/example.webp'), true);
  assert.equal(shouldBypassGeoAccess('/llms.txt'), true);
  assert.equal(shouldBypassGeoAccess('/image-sitemap.xml'), true);
  assert.equal(shouldBypassGeoAccess('/api/estimate/preview'), false);
  assert.equal(shouldBypassGeoAccess('/'), false);
});

test('trusted crawlers can reach public SEO pages but not APIs or estimate routes', () => {
  const googlebot = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

  assert.equal(isTrustedCrawlerUserAgent(googlebot), true);
  assert.equal(isTrustedCrawlerUserAgent('Applebot/0.1'), true);
  assert.equal(isTrustedCrawlerUserAgent('CCBot/2.0 (+https://commoncrawl.org/faq/)'), true);
  assert.equal(shouldBypassGeoAccess('/', googlebot), true);
  assert.equal(shouldBypassGeoAccess('/california-car-accident-settlement-factors', 'OAI-SearchBot'), true);
  assert.equal(shouldBypassGeoAccess('/guides', 'Applebot-Extended'), true);
  assert.equal(shouldBypassGeoAccess('/api/estimate/preview', googlebot), false);
  assert.equal(shouldBypassGeoAccess('/estimate/start', googlebot), false);
});
