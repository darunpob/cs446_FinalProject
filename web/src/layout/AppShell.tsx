import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import { House, LogIn, LogOut, SearchCheck, ShieldCheck, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";
import { USE_MOCK, resetMockData } from "../api/client";
import { ROUTE_STOCK } from "../design-system/FormSection";
import type { RouteStock } from "../design-system/FormSection";
import type { Messages } from "../i18n/messages/th";
import { useI18n } from "../i18n/useI18n";
import { AccountMenuButton, AccountMenuTab } from "./AccountMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PageErrorBoundary } from "./PageErrorBoundary";
import { ReportMenuButton, ReportMenuFab } from "./ReportMenu";
import { ThemeToggle } from "./ThemeToggle";

interface NavEntry {
  to: string;
  labelKey: keyof Messages["nav"];
  icon: LucideIcon;
  stock: RouteStock;
}

const PUBLIC_NAV: NavEntry[] = [
  { to: "/", labelKey: "found", icon: House, stock: "found" },
  { to: "/looking-for", labelKey: "lostBoard", icon: SearchCheck, stock: "lost" },
];

const GUARD_NAV: NavEntry = { to: "/admin", labelKey: "guard", icon: ShieldCheck, stock: "guard" };

const FELT_ICON_BUTTON = "grid size-10 cursor-pointer place-items-center rounded-md text-on-felt-2 transition-colors duration-150 hover:bg-board hover:text-on-felt";

function BrandMark() {
  const { t } = useI18n();
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 rounded-md" aria-label={t.nav.homeLabel}>
      <span className="rounded-sm bg-stock-yellow px-1.5 py-0.5 text-[15px] leading-none font-bold text-stock-ink shadow-paper">BU</span>
      <span className="font-display text-xl leading-none whitespace-nowrap text-on-felt">Lost &amp; Found</span>
    </Link>
  );
}

function desktopLinkClass(stock: RouteStock) {
  return ({ isActive }: { isActive: boolean }): string => {
    const state = isActive ? `${ROUTE_STOCK[stock]} text-stock-ink shadow-paper` : "text-on-felt-2 hover:bg-board hover:text-on-felt";
    return `rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-150 ${state}`;
  };
}

function AccountControl() {
  const { session, signOut } = useAuth();
  const { t } = useI18n();
  if (!session) {
    return (
      <Link to="/login" className="hidden h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-on-felt-2 transition-colors duration-150 hover:bg-board hover:text-on-felt sm:flex">
        <LogIn className="size-4" aria-hidden /> {t.nav.login}
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <AccountMenuButton displayName={session.user.displayName} />
      <button type="button" onClick={signOut} aria-label={t.nav.logout} title={t.nav.logout} className={FELT_ICON_BUTTON}>
        <LogOut className="size-[18px]" />
      </button>
    </div>
  );
}

function Header({ navEntries }: { navEntries: NavEntry[] }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-felt">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <BrandMark />
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label={t.nav.mainMenu}>
            {navEntries.map((entry) => (
              <NavLink key={entry.to} to={entry.to} end className={desktopLinkClass(entry.stock)}>
                {t.nav[entry.labelKey]}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-0.5">
            <LanguageSwitcher />
            <ThemeToggle />
            <AccountControl />
            <span className="ml-2 hidden md:block">
              <ReportMenuButton />
            </span>
          </div>
        </div>
      </div>
      <div className="scallop" aria-hidden />
    </header>
  );
}

function MobileTabBar({ navEntries }: { navEntries: NavEntry[] }) {
  const { session } = useAuth();
  const { t } = useI18n();
  const loginTab: NavEntry = { to: "/login", labelKey: "account", icon: UserRound, stock: "account" };
  const splitAt = Math.ceil((navEntries.length + 1) / 2);
  const trailing = navEntries.slice(splitAt).map((entry) => <MobileTab key={entry.to} entry={entry} />);
  return (
    <nav aria-label={t.nav.mobileMenu} className="paper fixed inset-x-0 bottom-0 z-40 border-t-4 border-stock-yellow pb-[env(safe-area-inset-bottom)] shadow-sheet md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2">
        {navEntries.slice(0, splitAt).map((entry) => <MobileTab key={entry.to} entry={entry} />)}
        <ReportMenuFab />
        {trailing}
        {session ? <AccountMenuTab /> : <MobileTab entry={loginTab} />}
      </div>
    </nav>
  );
}

function MobileTab({ entry }: { entry: NavEntry }) {
  const { t } = useI18n();
  const Icon = entry.icon;
  return (
    <NavLink to={entry.to} end className={({ isActive }) => `group flex min-w-14 flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold transition-colors duration-150 ${isActive ? "text-ink" : "text-ink-3"}`}>
      {({ isActive }) => (
        <>
          <span className={`grid h-7 w-11 place-items-center rounded-md transition-colors duration-150 ${isActive ? ROUTE_STOCK[entry.stock] : ""}`}>
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="text-center leading-tight">{t.nav[entry.labelKey]}</span>
        </>
      )}
    </NavLink>
  );
}

function Footer() {
  const { t } = useI18n();
  const handleReset = () => {
    resetMockData();
    window.location.reload();
  };
  return (
    <footer className="mx-auto max-w-6xl px-4 pt-16 pb-28 text-sm text-on-felt-2 sm:px-6 md:pb-10">
      <div className="flex flex-col gap-3 border-t border-felt-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p>{t.footer.credit}</p>
        {USE_MOCK && (
          <p className="flex items-center gap-2">
            <span className="rounded-sm bg-stock-yellow px-2 py-0.5 text-xs font-bold text-stock-ink">{t.footer.mockData}</span>
            <button type="button" onClick={handleReset} className="cursor-pointer rounded px-1 underline transition-colors duration-150 hover:text-on-felt">
              {t.footer.resetMock}
            </button>
          </p>
        )}
      </div>
    </footer>
  );
}

export function AppShell() {
  const { session } = useAuth();
  const { pathname } = useLocation();
  const navEntries = session?.user.role === "guard" ? [...PUBLIC_NAV, GUARD_NAV] : PUBLIC_NAV;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <Header navEntries={navEntries} />
      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
        <PageErrorBoundary resetKey={pathname}>
          <Outlet />
        </PageErrorBoundary>
      </main>
      <Footer />
      <MobileTabBar navEntries={navEntries} />
    </div>
  );
}
