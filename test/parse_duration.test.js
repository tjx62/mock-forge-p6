import { describe, expect, it } from 'vitest';

import { parse_duration } from '../src/parse_duration.js';

describe('parse_duration', () => {
  it('converts supported units to minutes', () => {
    expect(parse_duration('1h30m')).toBe(90);
    expect(parse_duration('1.5h')).toBe(90);
    expect(parse_duration('2d')).toBe(2880);
    expect(parse_duration('90s')).toBe(1.5);
    expect(parse_duration('10ms')).toBeCloseTo(1 / 6000, 15);
    expect(parse_duration('0m')).toBe(0);
  });

  it('accepts case-insensitive, repeated, and unordered units', () => {
    expect(parse_duration('1H 30M 500MS')).toBeCloseTo(90 + 1 / 120, 15);
    expect(parse_duration('1h2h')).toBe(180);
    expect(parse_duration('30m1h15m')).toBe(105);
    expect(parse_duration('1s1d1ms1m1h')).toBeCloseTo(
      1 / 60 + 1440 + 1 / 60000 + 1 + 60,
      12,
    );
  });

  it('allows ECMAScript whitespace outside and between tokens', () => {
    expect(parse_duration('\uFEFF\u00A0\t1h\u2028 30m\u3000\r\n')).toBe(90);
    expect(parse_duration('1h\u202F2m')).toBe(62);
  });

  it('preserves fractional minutes and large finite results', () => {
    expect(parse_duration('0.1m0.2m')).toBeCloseTo(0.3, 15);
    const largeDigits = `1${'0'.repeat(300)}`;
    expect(parse_duration(`${largeDigits}m`)).toBe(Number(largeDigits));
  });

  it.each([
    '',
    '   ',
    '1e9h',
    '.5h',
    '1.h',
    '-1h',
    '+1h',
    '1w',
    '1 h',
    '1,000m',
    '1',
    'ms',
    '1hm',
    '1h garbage',
    'garbage 1h',
    '1h,30m',
    '1\u200Bm',
    '١h',
  ])('rejects invalid grammar: %j', (input) => {
    expect(() => parse_duration(input)).toThrow(Error);
  });

  it.each([null, undefined, 1, NaN, true, {}, [], new String('1h')])(
    'rejects non-string input: %j',
    (input) => {
      expect(() => parse_duration(input)).toThrow(TypeError);
    },
  );

  it('throws RangeError for non-finite conversions and sums', () => {
    expect(() => parse_duration(`${'9'.repeat(400)}h`)).toThrow(RangeError);
    const nearMaximum = `1${'0'.repeat(308)}`;
    expect(() => parse_duration(`${nearMaximum}m${nearMaximum}m`)).toThrow(RangeError);
  });
});
