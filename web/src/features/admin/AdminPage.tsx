import { useState } from "react";
import type { CSSProperties } from "react";
import { Hourglass, PackageCheck, PackageSearch, TimerReset } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "../../api/client";
import { useApiQuery } from "../../api/useApiQuery";
import { STALE_AFTER_DAYS } from "../catalog/categories";
import { useAuth } from "../auth/AuthProvider";
import { PendingReturns } from "./PendingReturns";
import { StaleItems } from "./StaleItems";

type AdminTab = "returns" | "stale";

function Metric({ icon: Icon, label, value, hue }: { icon: LucideIcon; label: string; value: number | null; hue: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <span className="tint grid size-9 place-items-center rounded-xl" style={{ "--h": hue } as CSSProperties}>
        <Icon className="size-[18px]" />
      </span>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums">{value ?? "–"}</p>
      <p className="text-[13px] text-ink-2">{label}</p>
    </div>
  );
}

function TabButton({ active, count, label, onClick }: { active: boolean; count: number | null; label: string; onClick: () => void }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick}
      className={`relative -mb-px flex cursor-pointer items-center gap-2 border-b-2 px-1 pb-3 text-[15px] font-medium transition-colors duration-150 ${active ? "border-brand text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}>
      {label}
      {count !== null && <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${active ? "bg-brand-soft text-brand-ink" : "bg-surface-2"}`}>{count}</span>}
    </button>
  );
}

export function AdminPage() {
  const { session } = useAuth();
  const [tab, setTab] = useState<AdminTab>("returns");
  const stats = useApiQuery(() => api.getStats(), []);
  const pending = useApiQuery(() => api.listPendingReturns(), []);
  const stale = useApiQuery(() => api.listStaleItems(STALE_AFTER_DAYS), []);

  const statValues = stats.state.phase === "ready" ? stats.state.value : null;
  const claims = pending.state.phase === "ready" ? pending.state.value : null;
  const staleItems = stale.state.phase === "ready" ? stale.state.value : null;

  const handleReturned = () => {
    pending.reload();
    stats.reload();
  };

  return (
    <div className="animate-rise">
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand">แผงควบคุม รปภ.</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">สวัสดี, {session?.user.displayName}</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={Hourglass} label="รอเจ้าของมารับ" value={statValues?.awaitingPickup ?? null} hue={38} />
        <Metric icon={PackageSearch} label="ของที่ยังไม่มีเจ้าของ" value={statValues?.waiting ?? null} hue={254} />
        <Metric icon={TimerReset} label={`ค้างเกิน ${STALE_AFTER_DAYS} วัน`} value={staleItems?.length ?? null} hue={352} />
        <Metric icon={PackageCheck} label="คืนแล้วเดือนนี้" value={statValues?.returnedThisMonth ?? null} hue={160} />
      </div>
      <div role="tablist" className="mt-10 mb-6 flex gap-6 border-b border-line">
        <TabButton active={tab === "returns"} count={claims?.length ?? null} label="รอส่งคืน" onClick={() => setTab("returns")} />
        <TabButton active={tab === "stale"} count={staleItems?.length ?? null} label="ของค้างนาน" onClick={() => setTab("stale")} />
      </div>
      {tab === "returns" ? (
        <PendingReturns claims={claims} failure={pending.state.phase === "failed" ? pending.state.message : null} onRetry={pending.reload} onReturned={handleReturned} />
      ) : (
        <StaleItems staleItems={staleItems} failure={stale.state.phase === "failed" ? stale.state.message : null} onRetry={stale.reload} />
      )}
    </div>
  );
}
