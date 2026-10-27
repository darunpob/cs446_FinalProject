import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { LOCALES } from "../i18n/locale";
import type { Locale } from "../i18n/locale";
import { useI18n } from "../i18n/useI18n";

function useDismiss(open: boolean, close: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, close]);

  return containerRef;
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useDismiss(open, () => setOpen(false));
  const current = LOCALES.find((option) => option.id === locale) ?? LOCALES[0];

  const choose = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.common.language}
        title={t.common.language}
        className={`flex h-10 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold transition-colors duration-150 hover:bg-board hover:text-on-felt ${open ? "bg-board text-on-felt" : "text-on-felt-2"}`}
      >
        <Languages className="size-[18px]" aria-hidden />
        <span>{current.short}</span>
        <ChevronDown className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div role="menu" aria-label={t.common.language} className="paper absolute right-0 top-full z-50 mt-2 w-44 animate-fade overflow-hidden rounded-md p-1.5 pt-2.5 shadow-lifted">
          <div className="absolute inset-x-0 top-0 h-1 bg-stock-yellow" aria-hidden />
          {LOCALES.map((option) => {
            const selected = option.id === locale;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => choose(option.id)}
                lang={option.id}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2.5 text-left text-[15px] transition-colors duration-150 ${selected ? "bg-stock-yellow font-semibold text-stock-ink" : "text-ink hover:bg-surface-2"}`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={`w-6 text-xs font-bold ${selected ? "text-stock-ink" : "text-ink-3"}`}>{option.short}</span>
                  {option.label}
                </span>
                {selected && <Check className="size-4" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
