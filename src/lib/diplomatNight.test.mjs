import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNightSoldOut, rememberEventRef } from './diplomatNight.js';

test('a night is sold out only when every tier with a row says so', () => {
  assert.equal(isNightSoldOut({ ticketTiersJson: [{ priceUsd: 20, soldOut: true }, { priceUsd: 40, soldOut: true }] }), true);
  assert.equal(isNightSoldOut({ ticketTiersJson: [{ priceUsd: 20, soldOut: true }, { priceUsd: 40, soldOut: false }] }), false);
  assert.equal(isNightSoldOut({ ticketTiersJson: [] }), false);
  assert.equal(isNightSoldOut({}), false);
  assert.equal(isNightSoldOut(null), false);
});

test('a referral code is six lower-case letters or digits', () => {
  // Node has no sessionStorage, so a valid code reports "new" (the click is counted).
  assert.equal(rememberEventRef('ev', 'abc123'), true);
  assert.equal(rememberEventRef('ev', 'ABC123'), false);
  assert.equal(rememberEventRef('ev', 'abc12'), false);
  assert.equal(rememberEventRef('ev', undefined), false);
});
