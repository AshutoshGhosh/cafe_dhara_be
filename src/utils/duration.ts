/**
 * Parse a short duration string (e.g. "15m", "7d", "3600s", "12h") into
 * milliseconds. Falls back to `fallbackMs` if the string is unrecognized.
 */
export function durationToMs(value: string, fallbackMs: number): number {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(value.trim());
  if (!match) {
    const asNum = Number(value);
    return Number.isFinite(asNum) && asNum > 0 ? asNum : fallbackMs;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return amount * multipliers[unit];
}

/** Returns a Date `value` from now (see durationToMs). */
export function fromNow(value: string, fallbackMs: number): Date {
  return new Date(Date.now() + durationToMs(value, fallbackMs));
}
