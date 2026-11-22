import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { durationToMs, fromNow } from './duration';

describe('durationToMs', () => {
  it('parses seconds correctly', () => {
    assert.equal(durationToMs('30s', 0), 30000);
    assert.equal(durationToMs('1s', 0), 1000);
  });

  it('parses minutes correctly', () => {
    assert.equal(durationToMs('15m', 0), 15 * 60 * 1000);
    assert.equal(durationToMs('1m', 0), 60000);
  });

  it('parses hours correctly', () => {
    assert.equal(durationToMs('2h', 0), 2 * 60 * 60 * 1000);
    assert.equal(durationToMs('24h', 0), 24 * 60 * 60 * 1000);
  });

  it('parses days correctly', () => {
    assert.equal(durationToMs('7d', 0), 7 * 24 * 60 * 60 * 1000);
    assert.equal(durationToMs('1d', 0), 86400000);
  });

  it('falls back to fallbackMs for invalid unit', () => {
    assert.equal(durationToMs('invalid', 5000), 5000);
    assert.equal(durationToMs('', 10000), 10000);
  });

  it('parses pure numeric milliseconds strings', () => {
    assert.equal(durationToMs('45000', 0), 45000);
  });
});

describe('fromNow', () => {
  it('returns a future Date approximately now + duration', () => {
    const before = Date.now();
    const date = fromNow('1h', 0);
    const after = Date.now();

    const expectedMin = before + 3600000;
    const expectedMax = after + 3600000;

    assert.ok(date.getTime() >= expectedMin);
    assert.ok(date.getTime() <= expectedMax);
  });
});
