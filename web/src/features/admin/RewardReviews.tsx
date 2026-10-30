import { useState } from "react";
import { Gift, Scale, Undo2, UserRound } from "lucide-react";
import { api } from "../../api/client";
import type { RewardReview, RewardReviewDecision } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { EmptyState, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { formatRelative } from "../catalog/thaiTime";

function ReviewPhoto({ label, title, imageUrl }: { label: string; title: string; imageUrl: string | undefined }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1 text-xs font-semibold text-ink-3">{label}</figcaption>
      {imageUrl ? (
        <img src={imageUrl} alt={title} loading="lazy" className="aspect-[4/3] w-full rounded-sm bg-surface-2 object-cover" />
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center rounded-sm bg-surface-2 text-ink-3">
          <Gift className="size-6" aria-hidden />
        </div>
      )}
      <p className="mt-1.5 truncate text-sm font-semibold">{title}</p>
    </figure>
  );
}

function useDecision(rewardId: string, onResolved: () => void) {
  const [armed, setArmed] = useState<RewardReviewDecision | null>(null);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const choose = async (decision: RewardReviewDecision) => {
    if (armed !== decision) return setArmed(decision);
    setSaving(true);
    setFailure(null);
    try {
      await api.resolveRewardReview(rewardId, decision);
      onResolved();
    } catch (reviewError) {
      setFailure(describeError(reviewError));
      setArmed(null);
    } finally {
      setSaving(false);
    }
  };
  return { armed, saving, failure, choose };
}

function ReviewRow({ review, onResolved }: { review: RewardReview; onResolved: () => void }) {
  const { t } = useI18n();
  const text = t.reward;
  const decision = useDecision(review.rewardId, onResolved);
  return (
    <li className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <Scale className="size-4 text-ink-2" aria-hidden /> {text.amount(review.amount)}
        </p>
        <span className="text-xs text-ink-2">{formatRelative(review.flaggedAt)}</span>
      </div>
      <p className="rounded-sm bg-verify-soft px-3 py-2 text-[13px] leading-relaxed">{text.reviewReason[review.reason]}</p>
      <div className="grid grid-cols-2 gap-3">
        <ReviewPhoto label={text.reviewNotice} title={review.reportTitle} imageUrl={review.reportImageUrls[0]} />
        <ReviewPhoto label={text.reviewItem} title={review.itemTitle} imageUrl={review.itemImageUrls[0]} />
      </div>
      <p className="inline-flex items-center gap-1 text-[13px] text-ink-2">
        <UserRound className="size-3.5 text-ink-3" aria-hidden /> {text.reviewFinder(review.finderName)}
      </p>
      {decision.failure && <p role="alert" className="text-[13px] text-danger">{decision.failure}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant={decision.armed === "refund" ? "danger" : "secondary"} loading={decision.saving && decision.armed === "refund"}
          disabled={decision.saving} onClick={() => decision.choose("refund")} icon={<Undo2 className="size-4" aria-hidden />}>
          {decision.armed === "refund" ? text.reviewArmed : text.reviewRefund}
        </Button>
        <Button size="sm" variant={decision.armed === "release" ? "success" : "primary"} loading={decision.saving && decision.armed === "release"}
          disabled={decision.saving} onClick={() => decision.choose("release")} icon={<Gift className="size-4" aria-hidden />}>
          {decision.armed === "release" ? text.reviewArmed : text.reviewRelease}
        </Button>
      </div>
    </li>
  );
}

interface RewardReviewsProps {
  reviews: RewardReview[] | null;
  failure: string | null;
  onRetry: () => void;
  onResolved: () => void;
}

export function RewardReviews({ reviews, failure, onRetry, onResolved }: RewardReviewsProps) {
  const { t } = useI18n();
  if (failure) return <ErrorNotice message={failure} onRetry={onRetry} />;
  if (!reviews) return <div className="skeleton h-40 rounded-sm" />;
  if (reviews.length === 0) {
    return <EmptyState icon={<Scale className="size-7" />} title={t.reward.reviewsEmptyTitle} description={t.reward.reviewsEmptyDescription} />;
  }
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-on-felt-2">{t.reward.reviewsNote}</p>
      <ul className="paper divide-y divide-line overflow-hidden rounded-sm shadow-paper">
        {reviews.map((review) => <ReviewRow key={review.rewardId} review={review} onResolved={onResolved} />)}
      </ul>
    </div>
  );
}
