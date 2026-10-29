import { useState } from "react";
import { Check, FlaskConical, Gift, IdCard, Mail } from "lucide-react";
import { api } from "../../api/client";
import type { RewardPayout } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { EmptyState, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { formatRelative } from "../catalog/thaiTime";

function PayoutRow({ payout, onPaid }: { payout: RewardPayout; onPaid: () => void }) {
  const { t } = useI18n();
  const [armed, setArmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const confirm = async () => {
    if (!armed) return setArmed(true);
    setSaving(true);
    setFailure(null);
    try {
      await api.confirmPayout(payout.rewardId);
      onPaid();
    } catch (payoutError) {
      setFailure(describeError(payoutError));
      setArmed(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <span className="grid size-14 shrink-0 place-items-center rounded-sm bg-stock-yellow text-stock-ink" aria-hidden>
        <Gift className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{payout.itemTitle}</p>
        <p className="mt-0.5 text-sm font-semibold tabular-nums">{t.reward.payoutAmounts(payout.grossAmount, payout.fee, payout.netAmount)}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-1"><IdCard className="size-3.5 text-ink-3" /> {payout.finderName}{payout.finderStudentId && ` · ${payout.finderStudentId}`}</span>
          <span className="inline-flex items-center gap-1"><Mail className="size-3.5 text-ink-3" /> {payout.finderEmail}</span>
        </div>
        {failure && <p className="mt-2 text-[13px] text-danger">{failure}</p>}
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
        <span className="text-xs text-ink-2">{formatRelative(payout.releasedAt)}</span>
        <div className="flex gap-2">
          {armed && !saving && <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>{t.common.cancel}</Button>}
          <Button size="sm" variant={armed ? "success" : "secondary"} loading={saving} onClick={confirm} icon={<Check className="size-4" />}>
            {armed ? t.reward.payoutConfirmArmed : t.reward.payoutConfirm}
          </Button>
        </div>
      </div>
    </li>
  );
}

interface PendingPayoutsProps {
  payouts: RewardPayout[] | null;
  failure: string | null;
  onRetry: () => void;
  onPaid: () => void;
}

export function PendingPayouts({ payouts, failure, onRetry, onPaid }: PendingPayoutsProps) {
  const { t } = useI18n();
  if (failure) return <ErrorNotice message={failure} onRetry={onRetry} />;
  if (!payouts) return <div className="skeleton h-40 rounded-sm" />;
  if (payouts.length === 0) {
    return <EmptyState icon={<Gift className="size-7" />} title={t.reward.payoutsEmptyTitle} description={t.reward.payoutsEmptyDescription} />;
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm text-on-felt-2">
        <FlaskConical className="size-4 shrink-0 text-stock-yellow" aria-hidden /> {t.reward.payoutsNote}
      </p>
      <ul className="paper divide-y divide-line overflow-hidden rounded-sm shadow-paper">
        {payouts.map((payout) => <PayoutRow key={payout.rewardId} payout={payout} onPaid={onPaid} />)}
      </ul>
    </div>
  );
}
