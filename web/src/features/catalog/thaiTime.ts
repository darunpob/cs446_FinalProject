const dateTimeFormat = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit" });

const relativeFormat = new Intl.RelativeTimeFormat("th-TH", { numeric: "auto" });

const STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["minute", 60],
  ["hour", 24],
  ["day", 30],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

export function formatDateTime(iso: string): string {
  return `${dateTimeFormat.format(new Date(iso))} น.`;
}

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  let amount = (new Date(iso).getTime() - now.getTime()) / 60_000;
  if (Math.abs(amount) < 1) return "เมื่อสักครู่";
  for (const [unit, unitsInNext] of STEPS) {
    if (Math.abs(amount) < unitsInNext) return relativeFormat.format(Math.round(amount), unit);
    amount /= unitsInNext;
  }
  return formatDate(iso);
}

export function toLocalInputValue(moment: Date): string {
  const offsetMs = moment.getTimezoneOffset() * 60_000;
  return new Date(moment.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function fromLocalInputValue(localValue: string): string {
  return new Date(localValue).toISOString();
}
