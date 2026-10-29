import { useState } from "react";
import { Hourglass, PackageCheck, PackageSearch, TimerReset } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "../../api/client";
import { useApiQuery } from "../../api/useApiQuery";
import { PageHeading } from "../../design-system/FormSection";
import { useI18n } from "../../i18n/useI18n";
import { STALE_AFTER_DAYS } from "../catalog/categories";
import { useAuth } from "../auth/AuthProvider";
import { PendingPayouts } from "./PendingPayouts";
import { PendingReturns } from "./PendingReturns";
import { StaleItems } from "./StaleItems";

type AdminTab = "returns" | "payouts" | "stale";

function Metric({ icon: Icon, label, value, stock }: { icon: LucideIcon; label: string; value: number | null; stock: string }) {
  return (
    <div className="paper rounded-sm shadow-paper">
      <div className={`flex h-8 items-center px-3 text-stock-ink ${stock}`}>
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="p-4 pt-3">
        <p className="text-3xl font-bold tabular-nums">{value ?? "–"}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{label}</p>
      </div>
    </div>
  );
}

function TabButton({ active, count, label, onClick }: { active: boolean; count: number | null; label: string; onClick: () => void }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick}
      className={`flex h-11 cursor-pointer items-center gap-2 rounded-t-md px-4 text-[15px] font-semibold transition-colors duration-150 ${active ? "paper" : "text-on-felt-2 hover:bg-felt hover:text-on-felt"}`}>
      {label}
      {count !== null && <span className={`rounded-sm px-1.5 py-0.5 text-xs font-bold tabular-nums ${active ? "bg-stock-sky text-stock-ink" : "bg-felt-line text-on-felt"}`}>{count}</span>}
    </button>
  );
}

export function AdminPage() {
  const { session } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<AdminTab>("returns");
  const stats = useApiQuery(() => api.getStats(), []);
  const pending = useApiQuery(() => api.listPendingReturns(), []);
  const stale = useApiQuery(() => api.listStaleItems(STALE_AFTER_DAYS), []);
  const payouts = useApiQuery(() => api.listPendingPayouts(), []);

  const statValues = stats.state.phase === "ready" ? stats.state.value : null;
  const claims = pending.state.phase === "ready" ? pending.state.value : null;
  const staleItems = stale.state.phase === "ready" ? stale.state.value : null;
  const payoutList = payouts.state.phase === "ready" ? payouts.state.value : null;

  const handleReturned = () => {
    pending.reload();
    stats.reload();
    payouts.reload();
  };

  return (
    <div>
      <PageHeading stock="guard" title={t.admin.greeting(session?.user.displayName ?? "")} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Metric icon={Hourglass} label={t.admin.metricAwaiting} value={statValues?.awaitingPickup ?? null} stock="bg-stock-sky" />
        <Metric icon={PackageSearch} label={t.admin.metricWaiting} value={statValues?.waiting ?? null} stock="bg-stock-yellow" />
        <Metric icon={TimerReset} label={t.admin.metricStale(STALE_AFTER_DAYS)} value={staleItems?.length ?? null} stock="bg-stock-orange" />
        <Metric icon={PackageCheck} label={t.admin.metricReturned} value={statValues?.returnedThisMonth ?? null} stock="bg-stock-mint" />
      </div>
      <div role="tablist" className="mt-10 flex gap-1 border-b-2 border-felt-line">
        <TabButton active={tab === "returns"} count={claims?.length ?? null} label={t.admin.tabReturns} onClick={() => setTab("returns")} />
        <TabButton active={tab === "payouts"} count={payoutList?.length ?? null} label={t.reward.tabPayouts} onClick={() => setTab("payouts")} />
        <TabButton active={tab === "stale"} count={staleItems?.length ?? null} label={t.admin.tabStale} onClick={() => setTab("stale")} />
      </div>
      <div className="pt-6" role="tabpanel">
        {tab === "returns" && <PendingReturns claims={claims} failure={pending.state.phase === "failed" ? pending.state.message : null} onRetry={pending.reload} onReturned={handleReturned} />}
        {tab === "payouts" && <PendingPayouts payouts={payoutList} failure={payouts.state.phase === "failed" ? payouts.state.message : null} onRetry={payouts.reload} onPaid={payouts.reload} />}
        {tab === "stale" && <StaleItems staleItems={staleItems} failure={stale.state.phase === "failed" ? stale.state.message : null} onRetry={stale.reload} />}
      </div>
    </div>
  );
}
