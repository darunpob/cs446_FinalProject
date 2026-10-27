import { intlTag, messages } from "../../i18n/locale";

interface Formatters {
  dateTime: Intl.DateTimeFormat;
  date: Intl.DateTimeFormat;
  relative: Intl.RelativeTimeFormat;
}

const formattersByTag = new Map<string, Formatters>();

function formatters(): Formatters {
  const tag = intlTag();
  let cached = formattersByTag.get(tag);
  if (!cached) {
    cached = {
      dateTime: new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }),
      date: new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", year: "2-digit" }),
      relative: new Intl.RelativeTimeFormat(tag, { numeric: "auto" }),
    };
    formattersByTag.set(tag, cached);
  }
  return cached;
}

const STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["minute", 60],
  ["hour", 24],
  ["day", 30],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

export function formatDateTime(iso: string): string {
  return `${formatters().dateTime.format(new Date(iso))}${messages().time.clockSuffix}`;
}

export function formatDate(iso: string): string {
  return formatters().date.format(new Date(iso));
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  let amount = (new Date(iso).getTime() - now.getTime()) / 60_000;
  if (Math.abs(amount) < 1) return messages().time.justNow;
  for (const [unit, unitsInNext] of STEPS) {
    if (Math.abs(amount) < unitsInNext) return formatters().relative.format(Math.round(amount), unit);
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
