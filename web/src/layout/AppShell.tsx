import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import { CirclePlus, House, LogIn, LogOut, Megaphone, Search, ShieldCheck, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";
import { isMockMode, resetMockData } from "../api/client";
import { ButtonLink } from "../design-system/Button";
import type { Messages } from "../i18n/messages/th";
import { useI18n } from "../i18n/useI18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PageErrorBoundary } from "./PageErrorBoundary";
import { ThemeToggle } from "./ThemeToggle";

interface NavEntry {
  to: string;
  labelKey: keyof Messages["nav"];
  icon: LucideIcon;
}

const PUBLIC_NAV: NavEntry[] = [
  { to: "/", labelKey: "found", icon: House },
  { to: "/report-lost", labelKey: "reportLost", icon: Megaphone },
];

const GUARD_NAV: NavEntry = { to: "/admin", labelKey: "guard", icon: ShieldCheck };

function BrandMark() {
  const { t } = useI18n();
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label={t.nav.homeLabel}>
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-accent text-white shadow-glow transition-transform duration-200 group-hover:-rotate-6">
        <Search className="size-[18px]" strokeWidth={2.6} />
      </span>
      <span className="font-display text-[17px] leading-none font-bold tracking-tight whitespace-nowrap">
        BU <span className="text-brand">Lost</span>&amp;<span className="text-accent">Found</span>
      </span>
    </Link>
  );
}

function desktopLinkClass({ isActive }: { isActive: boolean }): string {
  const state = isActive ? "bg-surface-2 text-ink" : "text-ink-2 hover:text-ink hover:bg-surface-2/60";
  return `rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${state}`;
}

function AccountControl() {
  const { session, signOut } = useAuth();
  const { t } = useI18n();
  if (!session) {
    return (
      <Link to="/login" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink sm:flex">
        <LogIn className="size-4" /> {t.nav.login}
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <span className="hidden items-center gap-2 rounded-xl bg-surface-2 py-1.5 pr-3 pl-1.5 text-sm md:flex">
        <span className="grid size-6 place-items-center rounded-lg bg-brand-soft text-brand-ink">
          <UserRound className="size-3.5" />
        </span>
        <span className="max-w-36 truncate">{session.user.displayName}</span>
      </span>
      <button type="button" onClick={signOut} aria-label={t.nav.logout} title={t.nav.logout} className="grid size-10 cursor-pointer place-items-center rounded-xl text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
        <LogOut className="size-[18px]" />
      </button>
    </div>
  );
}

function Header({ navEntries }: { navEntries: NavEntry[] }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-[var(--glass)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <BrandMark />
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label={t.nav.mainMenu}>
          {navEntries.map((entry) => (
            <NavLink key={entry.to} to={entry.to} end className={desktopLinkClass}>
              {t.nav[entry.labelKey]}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          <AccountControl />
          <span className="ml-1 hidden sm:block">
            <ButtonLink to="/report-found" size="sm" icon={<CirclePlus className="size-4" />}>
              {t.nav.reportFound}
            </ButtonLink>
          </span>
        </div>
      </div>
    </header>
  );
}

function MobileTabBar({ navEntries }: { navEntries: NavEntry[] }) {
  const { session } = useAuth();
  const { t } = useI18n();
  const tabs = [...navEntries];
  if (!session) tabs.push({ to: "/login", labelKey: "account", icon: UserRound });
  return (
    <nav aria-label={t.nav.mobileMenu} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[var(--glass)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2">
        {tabs.slice(0, 1).map((entry) => <MobileTab key={entry.to} entry={entry} />)}
        <Link to="/report-found" aria-label={t.nav.reportFound} className="-mt-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-accent text-white shadow-glow transition-transform duration-200 active:scale-95">
          <CirclePlus className="size-6" />
        </Link>
        {tabs.slice(1).map((entry) => <MobileTab key={entry.to} entry={entry} />)}
      </div>
    </nav>
  );
}

function MobileTab({ entry }: { entry: NavEntry }) {
  const { t } = useI18n();
  const Icon = entry.icon;
  return (
    <NavLink to={entry.to} end className={({ isActive }) => `flex min-w-16 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors duration-150 ${isActive ? "text-brand" : "text-ink-3"}`}>
      <Icon className="size-5" />
      {t.nav[entry.labelKey]}
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
    <footer className="mx-auto max-w-6xl px-4 pt-16 pb-28 text-sm text-ink-3 sm:px-6 md:pb-10">
      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p>{t.footer.credit}</p>
        {isMockMode && (
          <p className="flex items-center gap-2">
            <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-medium text-warn">{t.footer.mockData}</span>
            <button type="button" onClick={handleReset} className="cursor-pointer underline-offset-4 transition-colors duration-150 hover:text-ink hover:underline">
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
    <div className="relative min-h-dvh">
      <div className="backdrop-mesh pointer-events-none absolute inset-x-0 top-0 h-[36rem]" aria-hidden />
      <Header navEntries={navEntries} />
      <main className="relative mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
        <PageErrorBoundary resetKey={pathname}>
          <Outlet />
        </PageErrorBoundary>
      </main>
      <Footer />
      <MobileTabBar navEntries={navEntries} />
    </div>
  );
}
