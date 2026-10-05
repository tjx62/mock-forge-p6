import { describe, expect, it } from 'vitest';

import { slugify } from '../src/slugify.js';

describe('slugify: required contract examples', () => {
  it('slugifies an ASCII phrase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('drops combining marks from accented Latin letters', () => {
    expect(slugify('Cr\u00e8me')).toBe('creme');
    expect(slugify('Cre\u0300me')).toBe('creme');
  });

  it('folds fullwidth Latin letters through NFKD', () => {
    expect(slugify('\uff21\uff22\uff23')).toBe('abc');
  });

  it('reduces the dotted capital I to a plain i', () => {
    expect(slugify('\u0130')).toBe('i');
  });

  it('yields empty for sharp-s, because no transliteration is applied', () => {
    expect(slugify('\u00df')).toBe('');
  });

  it('yields empty for Greek capital Omega, because no transliteration is applied', () => {
    expect(slugify('\u03a9')).toBe('');
  });

  it('turns an interior NBSP into a single hyphen', () => {
    expect(slugify('a\u00a0b')).toBe('a-b');
  });

  it('preserves digits', () => {
    expect(slugify('2024')).toBe('2024');
    expect(slugify('Version 2 Release 10')).toBe('version-2-release-10');
  });
});

describe('slugify: separator runs and edges', () => {
  it('collapses each run of disallowed characters into one hyphen', () => {
    expect(slugify('a   b')).toBe('a-b');
    expect(slugify('a---b')).toBe('a-b');
    expect(slugify('a_@#b')).toBe('a-b');
    expect(slugify('a \t\n b')).toBe('a-b');
    expect(slugify('one, two; three')).toBe('one-two-three');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('--a--')).toBe('a');
    expect(slugify('  Hello  ')).toBe('hello');
    expect(slugify('***Hello World***')).toBe('hello-world');
    expect(slugify('-')).toBe('');
  });
});

describe('slugify: results that may be empty', () => {
  it('returns empty for an empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('returns empty for whitespace-only input', () => {
    expect(slugify('   ')).toBe('');
    expect(slugify('\t\n\u00a0')).toBe('');
  });

  it('returns empty for symbol-only input', () => {
    expect(slugify('!!!')).toBe('');
    expect(slugify('@#$%^&*()')).toBe('');
  });

  it('returns empty for non-Latin-only input', () => {
    expect(slugify('\u041f\u0440\u0438\u0432\u0435\u0442')).toBe('');
    expect(slugify('\u65e5\u672c\u8a9e')).toBe('');
  });

  it('returns empty for combining-mark-only input', () => {
    expect(slugify('\u0301')).toBe('');
    expect(slugify('\u0301\u0300\u0308')).toBe('');
  });

  it('returns empty for a lone surrogate', () => {
    expect(slugify('\uD800')).toBe('');
    expect(slugify('\uDC00')).toBe('');
  });
});

describe('slugify: no transliteration table', () => {
  it('does not expand or romanize letters that NFKD leaves intact', () => {
    expect(slugify('\u00df')).toBe('');
    expect(slugify('\u00f8')).toBe('');
    expect(slugify('\u00e6')).toBe('');
    expect(slugify('\u0111')).toBe('');
  });

  it('keeps only the ASCII letters NFKD actually produces', () => {
    expect(slugify('Stra\u00dfe')).toBe('stra-e');
  });
});

describe('slugify: argument handling', () => {
  it('ignores extra arguments', () => {
    expect(slugify('Hello World', 'extra', 42, null)).toBe('hello-world');
  });

  const nonStrings = [
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['NaN', Number.NaN],
    ['a boolean', true],
    ['a bigint', 10n],
    ['a symbol', Symbol('s')],
    ['an array', ['Hello World']],
    ['a plain object', { toString: () => 'Hello World' }],
    ['a boxed string', new String('Hello World')],
  ];

  for (const [label, value] of nonStrings) {
    it(`throws TypeError for ${label}`, () => {
      expect(() => slugify(value)).toThrow(TypeError);
    });
  }

  it('throws when called with no arguments', () => {
    expect(() => slugify()).toThrow(TypeError);
  });

  it('does not coerce a non-string via its toString', () => {
    let called = false;
    const hostile = {
      toString() {
        called = true;
        return 'Hello World';
      },
    };
    expect(() => slugify(hostile)).toThrow(TypeError);
    expect(called).toBe(false);
  });
});

describe('slugify: purity', () => {
  it('is synchronous and returns a string', () => {
    const out = slugify('Hello World');
    expect(typeof out).toBe('string');
  });

  it('returns the same result for repeated calls and leaves input untouched', () => {
    const input = 'Cr\u00e8me  Br\u00fbl\u00e9e!';
    const first = slugify(input);
    const second = slugify(input);
    expect(first).toBe(second);
    expect(first).toBe('creme-brulee');
    expect(input).toBe('Cr\u00e8me  Br\u00fbl\u00e9e!');
  });

  it('does not depend on call order across differing inputs', () => {
    expect(slugify('a---b')).toBe('a-b');
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('a---b')).toBe('a-b');
  });
});
