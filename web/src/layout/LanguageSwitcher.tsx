import { Languages } from "lucide-react";
import { LOCALES } from "../i18n/locale";
import type { Locale } from "../i18n/locale";
import { useI18n } from "../i18n/useI18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const current = LOCALES.find((option) => option.id === locale) ?? LOCALES[0];
  return (
    <label className="relative flex h-10 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-ink-2 transition-colors duration-150 focus-within:ring-4 focus-within:ring-brand/15 hover:bg-surface-2 hover:text-ink" title={t.common.language}>
      <Languages className="size-[18px]" aria-hidden />
      <span aria-hidden>{current.short}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={t.common.language}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {LOCALES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
  );
}
