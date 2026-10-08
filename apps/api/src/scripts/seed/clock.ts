const HOUR_MS = 60 * 60 * 1000;

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * HOUR_MS);
}

export function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24);
}

/** Dates relative to one fixed "now", so every seeded record agrees on the current time. */
export interface SeedClock {
  now: Date;
  daysAgo(days: number): Date;
  /** Caps a planned event at now, so recent documents never get timestamps in the future. */
  notAfterNow(date: Date): Date;
}

export function createSeedClock(now = new Date()): SeedClock {
  return {
    now,
    daysAgo: (days) => addDays(now, -days),
    notAfterNow: (date) => (date > now ? now : date),
  };
}
