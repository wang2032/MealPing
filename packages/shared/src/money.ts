/** Convert price stored as integer cents to a yuan string with 2 decimals. */
export function centsToYuan(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Parse a yuan number/string into integer cents. */
export function yuanToCents(yuan: number | string): number {
  const n = typeof yuan === 'string' ? Number(yuan) : yuan;
  if (!Number.isFinite(n)) throw new Error('Invalid amount');
  return Math.round(n * 100);
}
