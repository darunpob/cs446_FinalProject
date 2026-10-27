import { useState } from "react";
import { Check, IdCard, Inbox, MessageCircle, Search, Store } from "lucide-react";
import { api } from "../../api/client";
import type { Claim } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { TextInput } from "../../design-system/Field";
import { EmptyState, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatRelative } from "../catalog/thaiTime";
import { ItemVisual } from "../items/ItemVisual";

function matchesLookup(claim: Claim, lookup: string): boolean {
  const needle = lookup.trim().toLowerCase();
  if (!needle) return true;
  return [claim.pickupCode, claim.studentId, claim.claimantName, claim.itemTitle].some((field) => field.toLowerCase().includes(needle));
}

function ClaimRow({ claim, onReturned }: { claim: Claim; onReturned: (claimId: string) => void }) {
  const { dropOffPoint } = useDirectory();
  const { t } = useI18n();
  const [armed, setArmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const confirm = async () => {
    if (!armed) return setArmed(true);
    setSaving(true);
    setFailure(null);
    try {
      await api.confirmReturn(claim.id);
      onReturned(claim.id);
    } catch (confirmError) {
      setFailure(describeError(confirmError));
      setArmed(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <ItemVisual foundItem={{ category: claim.itemCategory, imageUrl: null, title: claim.itemTitle }} iconSize="size-6" className="size-14 shrink-0 rounded-sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{claim.itemTitle}</p>
          <span className="rounded-sm bg-ink px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-surface">{claim.pickupCode}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-1"><IdCard className="size-3.5 text-ink-3" /> {claim.claimantName} · {claim.studentId}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5 text-ink-3" /> {claim.contact}</span>
          <span className="inline-flex items-center gap-1"><Store className="size-3.5 text-ink-3" /> {dropOffPoint(claim.dropOffPointId)?.name}</span>
        </div>
        {failure && <p className="mt-2 text-[13px] text-danger">{failure}</p>}
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
        <span className="text-xs text-ink-2">{t.admin.confirmedAgo(formatRelative(claim.createdAt))}</span>
        <div className="flex gap-2">
          {armed && !saving && <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>{t.common.cancel}</Button>}
          <Button size="sm" variant={armed ? "success" : "secondary"} loading={saving} onClick={confirm} icon={<Check className="size-4" />}>
            {armed ? t.admin.confirmArmed : t.admin.confirm}
          </Button>
        </div>
      </div>
    </li>
  );
}

interface PendingReturnsProps {
  claims: Claim[] | null;
  failure: string | null;
  onRetry: () => void;
  onReturned: (claimId: string) => void;
}

export function PendingReturns({ claims, failure, onRetry, onReturned }: PendingReturnsProps) {
  const { t } = useI18n();
  const [lookup, setLookup] = useState("");
  if (failure) return <ErrorNotice message={failure} onRetry={onRetry} />;
  if (!claims) return <div className="skeleton h-40 rounded-sm" />;
  if (claims.length === 0) {
    return <EmptyState icon={<Inbox className="size-7" />} title={t.admin.emptyReturnsTitle} description={t.admin.emptyReturnsDescription} />;
  }
  const visibleClaims = claims.filter((claim) => matchesLookup(claim, lookup));
  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-sm">
        <TextInput value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder={t.admin.lookupPlaceholder} leading={<Search className="size-4" />} aria-label={t.admin.lookupLabel} />
      </div>
      <ul className="paper divide-y divide-line overflow-hidden rounded-sm shadow-paper">
        {visibleClaims.map((claim) => <ClaimRow key={claim.id} claim={claim} onReturned={onReturned} />)}
        {visibleClaims.length === 0 && <li className="p-6 text-center text-sm text-ink-2">{t.admin.noLookupMatch(lookup)}</li>}
      </ul>
    </div>
  );
}
