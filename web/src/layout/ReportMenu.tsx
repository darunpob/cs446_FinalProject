import { useEffect, useId, useRef, useState } from "react";
import type { RefObject } from "react";
import { Link, useLocation } from "react-router";
import { HandHelping, Megaphone, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "../i18n/useI18n";

interface ReportChoice {
  to: string;
  icon: LucideIcon;
  stock: string;
  label: string;
  hint: string;
}

function useReportChoices(): ReportChoice[] {
  const { t } = useI18n();
  return [
    { to: "/report-lost", icon: Megaphone, stock: "bg-stock-pink", label: t.nav.reportLost, hint: t.nav.reportLostHint },
    { to: "/report-found", icon: HandHelping, stock: "bg-stock-mint", label: t.nav.reportFound, hint: t.nav.reportFoundHint },
  ];
}

/** Closes the menu on Escape, on a press outside it, and whenever the route changes. */
function useDismiss(open: boolean, close: () => void, containerRef: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  useEffect(close, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close, containerRef]);
}

function ChoiceLink({ choice }: { choice: ReportChoice }) {
  const Icon = choice.icon;
  return (
    <Link to={choice.to} role="menuitem" className="flex items-center gap-3 rounded-md p-3 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:bg-surface-2">
      <span className={`grid size-11 shrink-0 place-items-center rounded-sm text-stock-ink ${choice.stock}`}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-ink">{choice.label}</span>
        <span className="block text-[13px] leading-snug text-ink-2">{choice.hint}</span>
      </span>
    </Link>
  );
}

function useMenuState() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const close = useRef(() => setOpen(false)).current;
  useDismiss(open, close, containerRef);
  return { open, toggle: () => setOpen((previous) => !previous), containerRef };
}

/** Header "+" button: one entry point for both lost and found reports. */
export function ReportMenuButton() {
  const { t } = useI18n();
  const menuId = useId();
  const choices = useReportChoices();
  const { open, toggle, containerRef } = useMenuState();
  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="menu" aria-controls={menuId}
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-stock-mint px-3 text-sm font-semibold text-stock-ink shadow-paper transition-[translate,box-shadow] duration-150 hover:-translate-y-px hover:shadow-lifted active:translate-y-px">
        <Plus className={`size-4 transition-transform duration-200 ${open ? "rotate-45" : ""}`} aria-hidden /> {t.nav.reportMenu}
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={t.nav.reportMenu} className="paper absolute top-full right-0 z-50 mt-2 w-72 rounded-md p-1.5 shadow-lifted">
          {choices.map((choice) => <ChoiceLink key={choice.to} choice={choice} />)}
        </div>
      )}
    </div>
  );
}

/** Mobile tab-bar "+" button: opens the same two choices as a sheet above the bar. */
export function ReportMenuFab() {
  const { t } = useI18n();
  const menuId = useId();
  const choices = useReportChoices();
  const { open, toggle, containerRef } = useMenuState();
  return (
    <div ref={containerRef} className="flex justify-center">
      {open && <div onClick={toggle} className="fixed inset-0 -z-10 bg-ink/30" aria-hidden />}
      {open && (
        <div id={menuId} role="menu" aria-label={t.nav.reportMenu} className="paper fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] rounded-md p-1.5 shadow-lifted">
          {choices.map((choice) => <ChoiceLink key={choice.to} choice={choice} />)}
        </div>
      )}
      <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="menu" aria-controls={menuId} aria-label={t.nav.reportMenu}
        className="-mt-6 grid size-14 cursor-pointer place-items-center rounded-lg bg-stock-mint text-stock-ink shadow-lifted transition-[translate] duration-150 active:translate-y-px">
        <Plus className={`size-7 transition-transform duration-200 ${open ? "rotate-45" : ""}`} aria-hidden />
      </button>
    </div>
  );
}
