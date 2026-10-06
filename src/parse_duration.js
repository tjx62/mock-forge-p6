const MINUTES_PER_UNIT = {
  ms: 1 / 60000,
  s: 1 / 60,
  m: 1,
  h: 60,
  d: 1440,
};

const TOKEN = /(\d+(?:\.\d+)?)(ms|s|m|h|d)/iy;

export function parse_duration(input) {
  if (typeof input !== 'string') {
    throw new TypeError('duration must be a string');
  }

  const duration = input.trim();
  if (duration.length === 0) {
    throw new Error('duration must contain at least one token');
  }

  let minutes = 0;
  let position = 0;
  let tokenCount = 0;

  while (position < duration.length) {
    TOKEN.lastIndex = position;
    const match = TOKEN.exec(duration);
    if (match === null) {
      throw new Error('invalid duration');
    }

    const value = Number(match[1]);
    const contribution = value * MINUTES_PER_UNIT[match[2].toLowerCase()];
    if (!Number.isFinite(contribution)) {
      throw new RangeError('duration is outside the finite number range');
    }

    minutes += contribution;
    if (!Number.isFinite(minutes)) {
      throw new RangeError('duration sum is outside the finite number range');
    }

    tokenCount += 1;
    position = TOKEN.lastIndex;

    const whitespace = /^\s+/.exec(duration.slice(position));
    if (whitespace !== null) {
      position += whitespace[0].length;
    }
  }

  if (tokenCount === 0) {
    throw new Error('duration must contain at least one token');
  }

  return minutes;
}
