// Combining marks (Unicode general category M) left behind by NFKD decomposition.
const COMBINING_MARKS = /\p{M}/gu;
// Every maximal run of characters outside the ASCII slug alphabet.
const NON_SLUG_RUNS = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

/**
 * Convert a string into an ASCII slug.
 *
 * Synchronous and pure: no transliteration table, no locale discovery, and no
 * file, network or environment access. Arguments after the first are ignored.
 *
 * @param {string} s input string
 * @returns {string} slug containing only a-z, 0-9 and interior hyphens
 * @throws {TypeError} if `s` is not a primitive string; the value is never coerced
 */
export function slugify(s) {
  if (typeof s !== 'string') {
    throw new TypeError(`slugify expects a string, received ${typeof s}`);
  }

  return s
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(NON_SLUG_RUNS, '-')
    .replace(EDGE_HYPHENS, '');
}
