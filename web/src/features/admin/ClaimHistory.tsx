import { History, IdCard, ShieldCheck, Store } from "lucide-react";
import type { Claim } from "../../api/contract";
import { Badge, EmptyState, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatDateTime } from "../catalog/thaiTime";
import { ItemVisual } from "../items/ItemVisual";

function HistoryRow({ claim }: { claim: Claim }) {
  const { dropOffPoint } = useDirectory();
  const { t } = useI18n();
  const returned = claim.status === "returned";
  const closedAt = claim.returnedAt ?? claim.cancelledAt;
  return (
    <li className="flex gap-4 p-4 sm:p-5">
      <ItemVisual foundItem={{ category: claim.itemCategory, imageUrl: null, title: claim.itemTitle }} iconSize="size-6" className="size-14 shrink-0 rounded-sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 truncate font-semibold">{claim.itemTitle}</p>
          <Badge tone={returned ? "success" : "danger"}>{returned ? t.admin.historyReturned : t.admin.historyCancelled}</Badge>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-1"><IdCard className="size-3.5 text-ink-3" /> {claim.claimantName} · {claim.studentId}</span>
          <span className="inline-flex items-center gap-1"><Store className="size-3.5 text-ink-3" /> {dropOffPoint(claim.dropOffPointId)?.name}</span>
          {claim.handledBy && <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5 text-ink-3" /> {t.admin.handledBy(claim.handledBy)}</span>}
        </div>
        <p className="mt-1 text-xs text-ink-3 tabular-nums">{claim.pickupCode}{closedAt && ` · ${formatDateTime(closedAt)}`}</p>
      </div>
    </li>
  );
}

interface ClaimHistoryProps {
  claims: Claim[] | null;
  failure: string | null;
  onRetry: () => void;
}

export function ClaimHistory({ claims, failure, onRetry }: ClaimHistoryProps) {
  const { t } = useI18n();
  if (failure) return <ErrorNotice message={failure} onRetry={onRetry} />;
  if (!claims) return <div className="skeleton h-40 rounded-sm" />;
  if (claims.length === 0) {
    return <EmptyState icon={<History className="size-7" />} title={t.admin.historyEmptyTitle} description={t.admin.historyEmptyDescription} />;
  }
  return (
    <ul className="paper divide-y divide-line overflow-hidden rounded-sm shadow-paper">
      {claims.map((claim) => <HistoryRow key={claim.id} claim={claim} />)}
    </ul>
  );
}
