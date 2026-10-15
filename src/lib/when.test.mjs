import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  weekdayOf,
  nightOf,
  whenNights,
  whenLabel,
  whenOptions,
  whenParams,
  eventInWhen,
  whenNight,
  WHEN_WEEK,
  WHEN_WEEKEND,
  WHEN_TONIGHT,
  WHEN_TOMORROW,
  whenMatchesRow,
  whenKey,
} from './when.js';

// 2026-10-12 is a Monday.
const DAYS = [
  ['Mon', '2026-10-12', ['Wed 14', 'Thu 15', 'Fri 16', 'Sat 17', 'Sun 18']],
  ['Tue', '2026-10-13', ['Thu 15', 'Fri 16', 'Sat 17', 'Sun 18']],
  ['Wed', '2026-10-14', ['Fri 16', 'Sat 17', 'Sun 18']],
  ['Thu', '2026-10-15', ['Sat 17', 'Sun 18']],
  ['Fri', '2026-10-16', ['Sun 18']],
  ['Sat', '2026-10-17', []],
  ['Sun', '2026-10-18', []],
];

test('fixture days are the weekdays they claim', () => {
  for (const [name, night] of DAYS) assert.equal(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekdayOf(night)], name);
});

for (const [name, tonight, rest] of DAYS) {
  test(`options on a ${name}`, () => {
    const opts = whenOptions(tonight);
    const ids = opts.map((o) => o.id);
    assert.deepEqual(ids.slice(0, 4), ['tonight', 'tomorrow', 'weekend', 'week']);
    assert.equal(ids.at(-1), 'pick');
    assert.deepEqual(opts.slice(4, -1).map((o) => o.label), rest);
    assert.equal(new Set(ids).size, ids.length, 'no duplicate rows');
    // weekday rows are only nights after tomorrow, up to Sunday
    for (const o of opts.slice(4, -1)) {
      assert.ok(o.when.night > addDays(tonight, 1));
      assert.ok(whenNights(WHEN_WEEK, tonight).includes(o.when.night));
    }
  });

  test(`nights on a ${name}`, () => {
    assert.deepEqual(whenNights(WHEN_TONIGHT, tonight), [tonight]);
    assert.deepEqual(whenNights(WHEN_TOMORROW, tonight), [addDays(tonight, 1)]);
    const week = whenNights(WHEN_WEEK, tonight);
    assert.equal(week[0], tonight);
    assert.equal(weekdayOf(week.at(-1)), 0, 'week ends on Sunday');
    assert.ok(week.length >= 1 && week.length <= 7);
    const wk = whenNights(WHEN_WEEKEND, tonight);
    assert.equal(weekdayOf(wk.at(-1)), 0);
    assert.ok(wk.length >= 1 && wk.length <= 3);
    for (const n of wk) assert.ok([5, 6, 0].includes(weekdayOf(n)));
  });
}

test('weekend: whole Fri-Sun from Mon..Thu, the rest of it from Fri..Sun', () => {
  assert.deepEqual(whenNights(WHEN_WEEKEND, '2026-10-13'), ['2026-10-16', '2026-10-17', '2026-10-18']);
  assert.deepEqual(whenNights(WHEN_WEEKEND, '2026-10-16'), ['2026-10-16', '2026-10-17', '2026-10-18']);
  assert.deepEqual(whenNights(WHEN_WEEKEND, '2026-10-17'), ['2026-10-17', '2026-10-18']);
  assert.deepEqual(whenNights(WHEN_WEEKEND, '2026-10-18'), ['2026-10-18']);
});

test('labels', () => {
  const t = '2026-10-13'; // Tuesday
  assert.equal(whenLabel(WHEN_TONIGHT, t), 'Tonight');
  assert.equal(whenLabel(whenNight('2026-10-13'), t), 'Tonight');
  assert.equal(whenLabel(whenNight('2026-10-14'), t), 'Tomorrow');
  assert.equal(whenLabel(whenNight('2026-10-16'), t), 'Fri 16');
  assert.equal(whenLabel(whenNight('2026-10-29'), t), 'Oct 29');
  assert.equal(whenLabel(whenNight('2026-10-19'), t), 'Oct 19', 'next Monday is outside this week');
  assert.equal(whenLabel(WHEN_WEEKEND, t), 'This weekend');
  assert.equal(whenLabel(WHEN_WEEK, t), 'This week');
});

test('a picked night that matches a row counts as that row', () => {
  const t = '2026-10-13';
  const rows = whenOptions(t);
  const fri = rows.find((r) => r.id === '2026-10-16');
  assert.ok(whenMatchesRow(whenNight('2026-10-16'), fri, t));
  assert.ok(whenMatchesRow(whenNight('2026-10-14'), rows[1], t));
  assert.ok(!whenMatchesRow(WHEN_WEEK, rows[0], t));
  assert.equal(whenKey(null), 'any');
  assert.equal(whenKey(whenNight('2026-10-16')), 'night:2026-10-16');
});

test('the night turns over at 5 am in the city zone', () => {
  const tz = 'America/New_York';
  assert.equal(nightOf('2026-10-14T06:59:00Z', tz), '2026-10-13'); // 02:59 EDT
  assert.equal(nightOf('2026-10-14T09:00:00Z', tz), '2026-10-14'); // 05:00 EDT
  assert.equal(nightOf('2026-10-14T03:30:00Z', tz), '2026-10-13'); // 23:30 EDT
});

test('the night survives a DST change (US fall back 2026-11-01)', () => {
  const tz = 'America/New_York';
  assert.equal(nightOf('2026-11-01T05:30:00Z', tz), '2026-10-31'); // 01:30 EDT
  assert.equal(nightOf('2026-11-01T06:30:00Z', tz), '2026-10-31'); // 01:30 EST, the repeated hour
  assert.equal(nightOf('2026-11-01T09:59:00Z', tz), '2026-10-31'); // 04:59 EST
  assert.equal(nightOf('2026-11-01T10:00:00Z', tz), '2026-11-01'); // 05:00 EST
  assert.equal(addDays('2026-10-30', 3), '2026-11-02');
});

test('params for the feeds', () => {
  assert.deepEqual(whenParams(null, 'x'), {});
  assert.deepEqual(whenParams(WHEN_WEEK, 'x'), { window: 'week' });
  assert.deepEqual(whenParams(WHEN_TONIGHT, 'x'), { window: 'tonight' });
  assert.deepEqual(whenParams(whenNight('2026-10-16'), 'America/New_York'), {
    window: 'night',
    night: '2026-10-16',
    tz: 'America/New_York',
  });
});

test('events fall in the nights they are on', () => {
  const tz = 'America/New_York';
  const t = '2026-10-13';
  const at = (iso, end) => ({ startDate: iso, endDate: end });
  // Tue 11 pm EDT = 03:00Z Wed -> still Tuesday's night
  assert.ok(eventInWhen(at('2026-10-14T03:00:00Z'), WHEN_TONIGHT, t, tz));
  assert.ok(!eventInWhen(at('2026-10-14T03:00:00Z'), WHEN_TOMORROW, t, tz));
  // Wed 8 pm EDT
  assert.ok(eventInWhen(at('2026-10-15T00:00:00Z'), WHEN_TOMORROW, t, tz));
  assert.ok(eventInWhen(at('2026-10-15T00:00:00Z'), WHEN_WEEK, t, tz));
  assert.ok(!eventInWhen(at('2026-10-15T00:00:00Z'), WHEN_WEEKEND, t, tz));
  // Next Monday is outside the week
  assert.ok(!eventInWhen(at('2026-10-20T00:00:00Z'), WHEN_WEEK, t, tz));
  // a festival that began Monday and runs to Wednesday is on tonight
  assert.ok(eventInWhen(at('2026-10-12T20:00:00Z', '2026-10-15T20:00:00Z'), WHEN_TONIGHT, t, tz));
  // yesterday's one-off is not
  assert.ok(!eventInWhen(at('2026-10-12T20:00:00Z'), WHEN_TONIGHT, t, tz));
  assert.ok(eventInWhen(at('bad'), null, t, tz));
  assert.ok(!eventInWhen(at('bad'), WHEN_TONIGHT, t, tz));
});
