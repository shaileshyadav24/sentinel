export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 30],
  ["month", 12],
  ["year", Infinity],
];

export function formatRelativeTime(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  let value = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  let unit: Intl.RelativeTimeFormatUnit = "second";

  for (const [u, limit] of RELATIVE_UNITS) {
    unit = u;
    if (Math.abs(value) < limit) break;
    value = Math.round(value / limit);
  }

  return rtf.format(-value, unit);
}
