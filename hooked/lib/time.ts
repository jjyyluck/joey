/** Calendar day in US Eastern time, returned as a UTC-midnight Date (matches a Postgres DATE column). */
export function easternDay(d = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // YYYY-MM-DD
  return new Date(parts + "T00:00:00Z");
}

/** Monday of the Eastern-time week containing d, as a UTC-midnight Date. */
export function easternWeekStart(d = new Date()): Date {
  const day = easternDay(d);
  const dow = (day.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(day.getTime() - dow * 86400_000);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400_000);
}
