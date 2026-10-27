import { en } from "./messages/en";
import { ja } from "./messages/ja";
import { th } from "./messages/th";
import type { Messages } from "./messages/th";
import { zh } from "./messages/zh";

export type Locale = "th" | "en" | "zh" | "ja";

export interface LocaleOption {
  id: Locale;
  label: string;
  short: string;
  intlTag: string;
}

export const LOCALES: LocaleOption[] = [
  { id: "th", label: "ไทย", short: "TH", intlTag: "th-TH" },
  { id: "en", label: "English", short: "EN", intlTag: "en-US" },
  { id: "zh", label: "中文", short: "中", intlTag: "zh-CN" },
  { id: "ja", label: "日本語", short: "日", intlTag: "ja-JP" },
];

const MESSAGES: Record<Locale, Messages> = { th, en, zh, ja };

const LOCALE_KEY = "bu-lf-lang";

function isLocale(candidate: string | null): candidate is Locale {
  return LOCALES.some((option) => option.id === candidate);
}

function initialLocale(): Locale {
  if (typeof window === "undefined") return "th";
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (isLocale(saved)) return saved;
  } catch (storageError) {
    console.warn("Language preference unavailable", storageError);
  }
  const browserLanguage = navigator.language.slice(0, 2).toLowerCase();
  return isLocale(browserLanguage) ? browserLanguage : "th";
}

let currentLocale: Locale = initialLocale();
const listeners = new Set<() => void>();

function applyDocumentLanguage(locale: Locale): void {
  if (typeof document !== "undefined") document.documentElement.lang = locale;
}

applyDocumentLanguage(currentLocale);

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(nextLocale: Locale): void {
  if (nextLocale === currentLocale) return;
  currentLocale = nextLocale;
  applyDocumentLanguage(nextLocale);
  try {
    localStorage.setItem(LOCALE_KEY, nextLocale);
  } catch (storageError) {
    console.warn("Language preference could not be saved", storageError);
  }
  listeners.forEach((notify) => notify());
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Messages for the active language — usable outside React (validators, API clients). */
export function messages(locale: Locale = currentLocale): Messages {
  return MESSAGES[locale];
}

export function intlTag(locale: Locale = currentLocale): string {
  return LOCALES.find((option) => option.id === locale)?.intlTag ?? "th-TH";
}
