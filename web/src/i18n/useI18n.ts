import { useSyncExternalStore } from "react";
import { getLocale, messages, setLocale, subscribeLocale } from "./locale";

export function useI18n() {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return { locale, setLocale, t: messages(locale) };
}
