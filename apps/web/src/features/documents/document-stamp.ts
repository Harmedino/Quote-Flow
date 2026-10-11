/** When a stamp was inked, for its mono line: "Oct 5 · 10:47" in the business time zone. */
export function stampMoment(iso: string, timeZone: string, locale?: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone });
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  });
  return `${day.format(date)} · ${time.format(date)}`;
}
