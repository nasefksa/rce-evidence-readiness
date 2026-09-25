/** Internal date helpers. All day maths is done in UTC to avoid TZ drift. */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole-day difference (a - b), positive when a is later than b. */
export function dayDiff(a: Date, b: Date): number {
  const ua = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const ub = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((ua - ub) / MS_PER_DAY);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

/** ISO date-only string (YYYY-MM-DD). */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
