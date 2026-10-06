const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];

const FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function human_bytes(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new TypeError('human_bytes: n must be a finite number');
  }
  if (n < 0) {
    throw new RangeError('human_bytes: n must not be negative');
  }

  let magnitude = n === 0 ? 0 : n;
  let unitIndex = 0;
  while (magnitude >= 1024 && unitIndex < UNITS.length - 1) {
    magnitude /= 1024;
    unitIndex += 1;
  }

  return `${FORMATTER.format(magnitude)} ${UNITS[unitIndex]}`;
}
