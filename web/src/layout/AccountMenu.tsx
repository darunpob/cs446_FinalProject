import { useId } from "react";
import { useLocation } from "react-router";
import { ChevronDown, HandHelping, Megaphone, UserRound } from "lucide-react";
import { ROUTE_STOCK } from "../design-system/FormSection";
import { useI18n } from "../i18n/useI18n";
import { ChoiceLink, useMenuState } from "./ReportMenu";
import type { MenuChoice } from "./ReportMenu";

const ACCOUNT_PATHS = ["/my-finds", "/my-reports", "/account"];

function useAccountChoices(): MenuChoice[] {
  const { t } = useI18n();
  return [
    { to: "/my-finds", icon: HandHelping, stock: "bg-stock-mint", label: t.nav.myFinds, hint: t.nav.myFindsHint },
    { to: "/my-reports", icon: Megaphone, stock: "bg-stock-pink", label: t.nav.myReports, hint: t.nav.myReportsHint },
    { to: "/account", icon: UserRound, stock: ROUTE_STOCK.account, label: t.account.title, hint: t.nav.accountHint },
  ];
}

/** Header account button: the signed-in user's finds, lost reports and profile live behind their name. */
export function AccountMenuButton({ displayName }: { displayName: string }) {
  const { t } = useI18n();
  const menuId = useId();
  const choices = useAccountChoices();
  const { pathname } = useLocation();
  const { open, toggle, containerRef } = useMenuState();
  const active = open || ACCOUNT_PATHS.includes(pathname);
  return (
    <div ref={containerRef} className="relative hidden md:block">
      <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="menu" aria-controls={menuId} title={t.nav.accountMenu}
        className={`flex h-10 max-w-52 cursor-pointer items-center gap-2 rounded-md px-2 text-sm transition-colors duration-150 ${active ? "bg-board text-on-felt" : "text-on-felt hover:bg-board"}`}>
        <UserRound className="size-4 shrink-0 text-on-felt-2" aria-hidden />
        <span className="truncate">{displayName}</span>
        <ChevronDown className={`size-4 shrink-0 text-on-felt-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={t.nav.accountMenu} className="paper absolute top-full right-0 z-50 mt-2 w-72 rounded-md p-1.5 shadow-lifted">
          {choices.map((choice) => <ChoiceLink key={choice.to} choice={choice} />)}
        </div>
      )}
    </div>
  );
}

/** Mobile tab-bar "Account" tab: opens the same three choices as a sheet above the bar. */
export function AccountMenuTab() {
  const { t } = useI18n();
  const menuId = useId();
  const choices = useAccountChoices();
  const { pathname } = useLocation();
  const { open, toggle, containerRef } = useMenuState();
  const active = ACCOUNT_PATHS.includes(pathname);
  return (
    <div ref={containerRef} className="flex min-w-14 flex-1 justify-center">
      {open && <div onClick={toggle} className="fixed inset-0 -z-10 bg-ink/30" aria-hidden />}
      {open && (
        <div id={menuId} role="menu" aria-label={t.nav.accountMenu} className="paper fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] rounded-md p-1.5 shadow-lifted">
          {choices.map((choice) => <ChoiceLink key={choice.to} choice={choice} />)}
        </div>
      )}
      <button type="button" onClick={toggle} aria-expanded={open} aria-haspopup="menu" aria-controls={menuId}
        className={`flex w-full cursor-pointer flex-col items-center gap-0.5 py-2 text-xs font-semibold transition-colors duration-150 ${active || open ? "text-ink" : "text-ink-3"}`}>
        <span className={`grid h-7 w-11 place-items-center rounded-md transition-colors duration-150 ${active ? ROUTE_STOCK.account : ""}`}>
          <UserRound className="size-5" aria-hidden />
        </span>
        <span className="text-center leading-tight">{t.nav.account}</span>
      </button>
    </div>
  );
}
