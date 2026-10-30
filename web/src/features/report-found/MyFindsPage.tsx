import { useCallback } from "react";
import { Link } from "react-router";
import { Gift, HandHelping, Megaphone, Store } from "lucide-react";
import { api } from "../../api/client";
import type { FinderRewardStatus, FindStage, MyFind } from "../../api/contract";
import { ApiError } from "../../api/errors";
import { useApiQuery } from "../../api/useApiQuery";
import { ButtonLink } from "../../design-system/Button";
import { PageHeading } from "../../design-system/FormSection";
import { Badge, EmptyState, ErrorNotice, Spinner } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { useAuth } from "../auth/AuthProvider";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatRelative } from "../catalog/thaiTime";
import { ItemVisual } from "../items/ItemVisual";

const STAGE_TONE: Record<FindStage, "neutral" | "verify" | "warn" | "success"> = {
  posted: "neutral",
  sent: "warn",
  confirmed: "verify",
  returned: "success",
};

const REWARD_TONE: Record<FinderRewardStatus, "neutral" | "verify" | "warn" | "success"> = {
  promised: "neutral",
  pending_payout: "warn",
  paid_out: "success",
  forfeited: "neutral",
};

function RewardLine({ reward }: { reward: NonNullable<MyFind["reward"]> }) {
  const { t } = useI18n();
  return (
    <p className="flex flex-wrap items-center gap-2 rounded-sm bg-surface-2 px-3 py-2 text-[13px] font-semibold">
      <Gift className="size-4 shrink-0 text-ink-2" aria-hidden />
      <span className={reward.status === "forfeited" ? "text-ink-3 line-through" : ""}>{t.myFinds.rewardLine(reward.netAmount)}</span>
      <Badge tone={REWARD_TONE[reward.status]}>{t.myFinds.rewardStatus[reward.status]}</Badge>
    </p>
  );
}

function FindRow({ find }: { find: MyFind }) {
  const { dropOffPoint } = useDirectory();
  const { t } = useI18n();
  const point = dropOffPoint(find.item.dropOffPointId);
  return (
    <li className="flex gap-4 p-4 sm:p-5">
      <Link to={`/items/${find.item.id}`} className="shrink-0 overflow-hidden rounded-sm transition-opacity duration-150 hover:opacity-85">
        <ItemVisual foundItem={find.item} iconSize="size-7" className="size-20 sm:size-24" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link to={`/items/${find.item.id}`} className="line-clamp-2 font-semibold wrap-anywhere underline-offset-2 hover:underline">{find.item.title}</Link>
          <Badge tone={STAGE_TONE[find.stage]}>{t.myFinds.stage[find.stage]}</Badge>
        </div>
        {find.noticeTitle && (
          <p className="flex items-center gap-1.5 text-[13px] text-ink-2">
            <Megaphone className="size-3.5 shrink-0 text-ink-3" aria-hidden />
            <span className="min-w-0 truncate">{t.myFinds.answersNotice(find.noticeTitle)}</span>
          </p>
        )}
        <p className="flex items-center gap-1.5 text-[13px] text-ink-2">
          <Store className="size-3.5 shrink-0 text-ink-3" aria-hidden />
          <span className="min-w-0 truncate">{t.myFinds.dropOffAt(point?.name ?? t.claim.dropOffFallback)}</span>
        </p>
        <p className="text-xs text-ink-3">{formatRelative(find.item.reportedAt)}</p>
        {find.reward && <RewardLine reward={find.reward} />}
      </div>
    </li>
  );
}

export function MyFindsPage() {
  const { session, signOut } = useAuth();
  const { t } = useI18n();
  const text = t.myFinds;

  const loadFinds = useCallback(async () => {
    try {
      return await api.listMyFinds();
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.code === "UNAUTHORIZED") signOut();
      throw loadError;
    }
  }, [signOut]);

  const { state, reload } = useApiQuery(loadFinds, [session?.user.email]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading stock="reportFound" title={text.title} description={text.subtitle} />
      {state.phase === "loading" && <Spinner />}
      {state.phase === "failed" && <ErrorNotice message={state.message} onRetry={reload} />}
      {state.phase === "ready" && state.value.length === 0 && (
        <EmptyState icon={<HandHelping className="size-7" />} title={text.emptyTitle} description={text.emptyDescription}
          action={<ButtonLink to="/looking-for" className="mt-2">{text.browseBoard}</ButtonLink>} />
      )}
      {state.phase === "ready" && state.value.length > 0 && (
        <ul className="paper divide-y divide-line overflow-hidden rounded-sm shadow-paper">
          {state.value.map((find) => <FindRow key={find.item.id} find={find} />)}
        </ul>
      )}
    </div>
  );
}
