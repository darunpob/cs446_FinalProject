import { Link } from "react-router";
import { ChevronRight, PartyPopper, Store } from "lucide-react";
import type { StaleItem } from "../../api/contract";
import { Badge, EmptyState, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatDate } from "../catalog/thaiTime";
import { ItemVisual } from "../items/ItemVisual";

const HANDOVER_AFTER_DAYS = 90;

function severityTone(daysWaiting: number): "danger" | "warn" | "neutral" {
  if (daysWaiting >= 60) return "danger";
  if (daysWaiting >= 30) return "warn";
  return "neutral";
}

interface StaleItemsProps {
  staleItems: StaleItem[] | null;
  failure: string | null;
  onRetry: () => void;
}

export function StaleItems({ staleItems, failure, onRetry }: StaleItemsProps) {
  const { placeName, dropOffPoint } = useDirectory();
  const { t } = useI18n();
  if (failure) return <ErrorNotice message={failure} onRetry={onRetry} />;
  if (!staleItems) return <div className="skeleton h-40 rounded-2xl" />;
  if (staleItems.length === 0) {
    return <EmptyState icon={<PartyPopper className="size-7" />} title={t.admin.staleEmptyTitle} description={t.admin.staleEmptyDescription} />;
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-2">{t.admin.staleNote(HANDOVER_AFTER_DAYS)}</p>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {staleItems.map((stale) => (
          <li key={stale.id}>
            <Link to={`/items/${stale.id}`} className="group flex items-center gap-4 p-4 transition-colors duration-150 hover:bg-surface-2/60 sm:p-5">
              <ItemVisual foundItem={stale} iconSize="size-6" className="size-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{stale.title}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-[13px] text-ink-2">
                  <span>{t.admin.foundAtPlace(placeName(stale.foundLocationId), formatDate(stale.foundAt))}</span>
                  <span className="inline-flex items-center gap-1"><Store className="size-3.5 text-ink-3" /> {dropOffPoint(stale.dropOffPointId)?.name}</span>
                </p>
              </div>
              <Badge tone={severityTone(stale.daysWaiting)} className="tabular-nums">{t.admin.days(stale.daysWaiting)}</Badge>
              <ChevronRight className="size-4 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
