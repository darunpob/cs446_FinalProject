import { useState } from "react";
import { Check, IdCard, Inbox, MessageCircle, Search, Store, X } from "lucide-react";
import { api } from "../../api/client";
import { REWARD_FEE_RATE } from "../../api/contract";
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

type GuardDecision = "return" | "cancel";

/** Two-step buttons: the first press arms a decision, the second sends it. */
function useGuardDecision(claimId: string, onSettled: (claimId: string) => void) {
  const [armed, setArmed] = useState<GuardDecision | null>(null);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const choose = async (decision: GuardDecision) => {
    if (armed !== decision) return setArmed(decision);
    setSaving(true);
    setFailure(null);
    try {
      if (decision === "return") await api.confirmReturn(claimId);
      else await api.cancelPickup(claimId);
      onSettled(claimId);
    } catch (decisionError) {
      setFailure(describeError(decisionError));
      setArmed(null);
    } finally {
      setSaving(false);
    }
  };
  return { armed, saving, failure, choose, disarm: () => setArmed(null) };
}

function ClaimRow({ claim, onReturned }: { claim: Claim; onReturned: (claimId: string) => void }) {
  const { dropOffPoint } = useDirectory();
  const { t } = useI18n();
  const decision = useGuardDecision(claim.id, onReturned);
  const cancelNote = claim.fromNotice ? t.admin.cancelNoticeNote(REWARD_FEE_RATE * 100) : t.admin.cancelItemNote;

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
        {decision.armed === "cancel" && <p className="mt-2 rounded-sm bg-warn-soft px-2.5 py-1.5 text-[13px] text-warn">{cancelNote}</p>}
        {decision.failure && <p className="mt-2 text-[13px] text-danger">{decision.failure}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        <span className="text-xs text-ink-2">{t.admin.confirmedAgo(formatRelative(claim.createdAt))}</span>
        <div className="flex flex-wrap gap-2">
          {decision.armed && !decision.saving && <Button size="sm" variant="ghost" onClick={decision.disarm}>{t.admin.keepPending}</Button>}
          {decision.armed !== "return" && (
            <Button size="sm" variant={decision.armed === "cancel" ? "danger" : "ghost"} loading={decision.saving} onClick={() => decision.choose("cancel")} icon={<X className="size-4" />}>
              {decision.armed === "cancel" ? t.admin.cancelPickupArmed : t.admin.cancelPickup}
            </Button>
          )}
          {decision.armed !== "cancel" && (
            <Button size="sm" variant={decision.armed === "return" ? "success" : "secondary"} loading={decision.saving} onClick={() => decision.choose("return")} icon={<Check className="size-4" />}>
              {decision.armed === "return" ? t.admin.confirmArmed : t.admin.confirm}
            </Button>
          )}
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
