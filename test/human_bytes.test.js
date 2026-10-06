import { describe, expect, it } from 'vitest';

import { human_bytes } from '../src/human_bytes.js';

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];

function reference(n) {
  let magnitude = n;
  let unitIndex = 0;
  while (magnitude >= 1024 && unitIndex < UNITS.length - 1) {
    magnitude /= 1024;
    unitIndex += 1;
  }
  const mantissa = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(magnitude);
  return `${mantissa} ${UNITS[unitIndex]}`;
}

describe('human_bytes', () => {
  it('formats the required spec examples', () => {
    expect(human_bytes(0)).toBe('0 B');
    expect(human_bytes(1024)).toBe('1 KB');
    expect(human_bytes(1536)).toBe('1.5 KB');
    expect(human_bytes(1023.99)).toBe('1,023.99 B');
    expect(human_bytes(1048575)).toBe('1,024 KB');
    expect(human_bytes(1048576)).toBe('1 MB');
    expect(human_bytes(1024 ** 6)).toBe('1 EB');
    expect(human_bytes(1024 ** 7)).toBe('1,024 EB');
    expect(human_bytes(0.001)).toBe('0 B');
  });

  it('crosses every unit boundary at exact powers of 1024', () => {
    expect(human_bytes(1024 ** 0)).toBe('1 B');
    expect(human_bytes(1024 ** 1)).toBe('1 KB');
    expect(human_bytes(1024 ** 2)).toBe('1 MB');
    expect(human_bytes(1024 ** 3)).toBe('1 GB');
    expect(human_bytes(1024 ** 4)).toBe('1 TB');
    expect(human_bytes(1024 ** 5)).toBe('1 PB');
    expect(human_bytes(1024 ** 6)).toBe('1 EB');
  });

  it('stays on the lower unit one byte below each boundary (no premature promotion)', () => {
    expect(human_bytes(1024 ** 2 - 1)).toBe('1,024 KB');
    expect(human_bytes(1024 ** 3 - 1)).toBe('1,024 MB');
    expect(human_bytes(1024 ** 4 - 1)).toBe('1,024 GB');
    expect(human_bytes(1024 ** 5 - 1)).toBe('1,024 TB');
    // 1024**6 - 1 is not exactly representable as a double at this magnitude
    // (it collapses to 1024**6), so use the nearest representable value
    // below the EB boundary to exercise "stay on PB" behavior instead.
    expect(human_bytes(1024 ** 6 - 1024)).toBe(reference(1024 ** 6 - 1024));
    expect(human_bytes(1024 ** 6 - 1024)).not.toBe('1 EB');
  });

  it('never promotes a unit after rounding the mantissa', () => {
    // 1024**2 - 1 rounds its KB mantissa up to 1,024.00 -> "1,024" but must stay KB, not MB.
    expect(human_bytes(1048575)).toBe('1,024 KB');
    expect(human_bytes(1048575)).not.toBe('1 MB');
  });

  it('formats fractional ties at several unit levels', () => {
    expect(human_bytes(1536)).toBe('1.5 KB'); // 1.5 KB
    expect(human_bytes(1572864)).toBe('1.5 MB'); // 1.5 * 1024**2
    expect(human_bytes(1610612736)).toBe('1.5 GB'); // 1.5 * 1024**3
  });

  it('applies en-US thousands grouping without forcing trailing zeros', () => {
    expect(human_bytes(2)).toBe('2 B');
    expect(human_bytes(2.5)).toBe('2.5 B');
    expect(human_bytes(1023.99)).toBe('1,023.99 B');
    expect(human_bytes(1234567)).toBe(reference(1234567));
  });

  it('caps fraction digits at 2 and rounds the mantissa', () => {
    expect(human_bytes(1023.994)).toBe('1,023.99 B');
    expect(human_bytes(1023.996)).toBe('1,024 B');
  });

  it('handles zero and negative zero as zero', () => {
    expect(human_bytes(0)).toBe('0 B');
    expect(human_bytes(-0)).toBe('0 B');
  });

  it('throws RangeError for negative finite input', () => {
    expect(() => human_bytes(-1)).toThrow(RangeError);
    expect(() => human_bytes(-0.5)).toThrow(RangeError);
    expect(() => human_bytes(-1024)).toThrow(RangeError);
    expect(() => human_bytes(-Number.MAX_VALUE)).toThrow(RangeError);
  });

  it('throws TypeError for NaN and infinities', () => {
    expect(() => human_bytes(NaN)).toThrow(TypeError);
    expect(() => human_bytes(Infinity)).toThrow(TypeError);
    expect(() => human_bytes(-Infinity)).toThrow(TypeError);
  });

  it('throws TypeError for non-number input without coercion', () => {
    expect(() => human_bytes('1024')).toThrow(TypeError);
    expect(() => human_bytes(null)).toThrow(TypeError);
    expect(() => human_bytes(undefined)).toThrow(TypeError);
    expect(() => human_bytes(true)).toThrow(TypeError);
    expect(() => human_bytes(false)).toThrow(TypeError);
    expect(() => human_bytes([])).toThrow(TypeError);
    expect(() => human_bytes([1024])).toThrow(TypeError);
    expect(() => human_bytes({})).toThrow(TypeError);
    expect(() => human_bytes({ valueOf: () => 1024 })).toThrow(TypeError);
    expect(() => human_bytes(10n)).toThrow(TypeError);
    // eslint-disable-next-line no-new-wrappers
    expect(() => human_bytes(new Number(1024))).toThrow(TypeError);
    expect(() => human_bytes(Symbol('x'))).toThrow(TypeError);
    expect(() => human_bytes()).toThrow(TypeError);
  });

  it('handles subnormal numbers as the smallest finite magnitude', () => {
    expect(human_bytes(Number.MIN_VALUE)).toBe('0 B');
    expect(Number.MIN_VALUE).toBeGreaterThan(0);
    expect(Number.MIN_VALUE).toBeLessThan(5e-300);
  });

  it('handles the maximum finite value by retaining a larger EB mantissa, with no new label or clamp', () => {
    const result = human_bytes(Number.MAX_VALUE);
    expect(result.endsWith(' EB')).toBe(true);
    expect(result).toBe(reference(Number.MAX_VALUE));
    expect(result).not.toContain('Infinity');
  });

  it('ignores extra arguments', () => {
    expect(human_bytes(1024, 'ignored', 123)).toBe('1 KB');
  });
});
