import { useState } from "react";
import { CreditCard, Gift } from "lucide-react";
import { api } from "../../api/client";
import type { Reward, RewardStatus } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { Badge } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { formatDate } from "../catalog/thaiTime";

const STATUS_TONE: Record<RewardStatus, "warn" | "verify" | "success" | "neutral"> = {
  awaiting_payment: "warn",
  held: "verify",
  pending_payout: "verify",
  paid_out: "success",
  refunded: "neutral",
  voided: "neutral",
};

/** Sends the owner to the gateway's hosted checkout (the in-app test checkout when running on mock data). */
function useRewardCheckout(reportId: string) {
  const [starting, setStarting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const start = async () => {
    setStarting(true);
    setFailure(null);
    try {
      const { checkoutUrl } = await api.startRewardCheckout(reportId);
      window.location.assign(checkoutUrl);
    } catch (checkoutError) {
      setFailure(describeError(checkoutError));
      setStarting(false);
    }
  };
  return { start, starting, failure };
}

export function RewardPanel({ reportId, reward }: { reportId: string; reward: Reward }) {
  const { t } = useI18n();
  const text = t.reward;
  const checkout = useRewardCheckout(reportId);
  const awaitingPayment = reward.status === "awaiting_payment";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface-2 p-3 sm:p-4">
      <Gift className="size-5 shrink-0 text-ink-2" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {text.amount(reward.amount)}
          <Badge tone={STATUS_TONE[reward.status]}>{text.status[reward.status]}</Badge>
        </p>
        {reward.status === "held" && reward.expiresAt && <p className="mt-0.5 text-[13px] text-ink-2">{text.heldUntil(formatDate(reward.expiresAt))}</p>}
        {awaitingPayment && <p className="mt-0.5 text-[13px] text-ink-2">{text.payPromptBody}</p>}
        {reward.refundAmount !== null && <p className="mt-0.5 text-[13px] text-ink-2">{text.refundedAmount(reward.refundAmount, reward.fee)}</p>}
        {checkout.failure && <p role="alert" className="mt-1 text-[13px] text-danger">{checkout.failure}</p>}
      </div>
      {awaitingPayment && (
        <Button size="sm" loading={checkout.starting} onClick={checkout.start} icon={<CreditCard className="size-4" aria-hidden />}>{text.payNow}</Button>
      )}
    </div>
  );
}
