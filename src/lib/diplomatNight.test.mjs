import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNightSoldOut, readEventRef, rememberEventRef } from './diplomatNight.js';

/** A stand-in for document.cookie: keeps name=value pairs and records every cookie string written. */
function fakeDocument() {
  const jar = new Map();
  const written = [];
  globalThis.document = {
    get cookie() {
      return [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
    },
    set cookie(line) {
      written.push(line);
      const [pair] = line.split(';');
      const at = pair.indexOf('=');
      jar.set(pair.slice(0, at).trim(), pair.slice(at + 1));
    },
  };
  return { jar, written };
}

test('a night is sold out only when every tier with a row says so', () => {
  assert.equal(isNightSoldOut({ ticketTiersJson: [{ priceUsd: 20, soldOut: true }, { priceUsd: 40, soldOut: true }] }), true);
  assert.equal(isNightSoldOut({ ticketTiersJson: [{ priceUsd: 20, soldOut: true }, { priceUsd: 40, soldOut: false }] }), false);
  assert.equal(isNightSoldOut({ ticketTiersJson: [] }), false);
  assert.equal(isNightSoldOut({}), false);
  assert.equal(isNightSoldOut(null), false);
});

test('a referral code is six lower-case letters or digits', () => {
  // Node has no document, so a valid code reports "new" (the click is counted).
  assert.equal(rememberEventRef('ev', 'abc123'), true);
  assert.equal(rememberEventRef('ev', 'ABC123'), false);
  assert.equal(rememberEventRef('ev', 'abc12'), false);
  assert.equal(rememberEventRef('ev', undefined), false);
});

test('the referral code is a 30-day cookie per night; a new code replaces it', () => {
  const { jar, written } = fakeDocument();
  try {
    assert.equal(rememberEventRef('ev', 'abc123'), true);
    assert.equal(written[0], 'pxi_ref_ev=abc123; Max-Age=2592000; Path=/; SameSite=Lax');
    assert.equal(rememberEventRef('ev', 'abc123'), false, 'the same code is not counted twice');
    assert.equal(readEventRef('ev'), 'abc123');
    assert.equal(readEventRef('other'), '');
    assert.equal(rememberEventRef('ev', 'zzz999'), true);
    assert.equal(readEventRef('ev'), 'zzz999');
    assert.equal(rememberEventRef('ev', 'NOPE'), false, 'an invalid code leaves the cookie alone');
    assert.equal(rememberEventRef('a;b', 'abc123'), false, 'an event id that cannot be a cookie name is ignored');
    assert.equal(jar.get('pxi_ref_ev'), 'zzz999');
  } finally {
    delete globalThis.document;
  }
});
