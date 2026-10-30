import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { CircleCheckBig, Gift, MailCheck, Megaphone, Plus, Ticket } from "lucide-react";
import { api } from "../../api/client";
import type { EarnedReward, MyClaim } from "../../api/contract";
import { ApiError } from "../../api/errors";
import { useApiQuery } from "../../api/useApiQuery";
import { ButtonLink } from "../../design-system/Button";
import { PageHeading } from "../../design-system/FormSection";
import { Badge, Card, EmptyState, ErrorNotice, Spinner } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { useAuth } from "../auth/AuthProvider";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatRelative } from "../catalog/thaiTime";
import { ItemVisual } from "../items/ItemVisual";
import { MyReportCard } from "./MyReportCard";

function ClaimTicket({ claim }: { claim: MyClaim }) {
  const { dropOffPoint } = useDirectory();
  const { t } = useI18n();
  const point = dropOffPoint(claim.dropOffPointId);
  const waiting = claim.status === "verified";
  return (
    <li className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
      <ItemVisual foundItem={{ category: claim.itemCategory, imageUrl: null, title: claim.itemTitle }} iconSize="size-6" className="size-14 shrink-0 rounded-sm" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-semibold wrap-anywhere">{claim.itemTitle}</p>
        <p className="mt-0.5 text-[13px] text-ink-2">{point ? `${point.name} · ${point.hours}` : t.claim.dropOffFallback}</p>
        <p className="text-xs text-ink-3">{formatRelative(claim.createdAt)}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className={`rounded-sm px-3 py-1 font-mono text-xl font-bold tracking-[0.2em] tabular-nums ${waiting ? "bg-ink text-surface" : "bg-surface-2 text-ink-3 line-through"}`}>{claim.pickupCode}</span>
        <Badge tone={waiting ? "verify" : "neutral"}>{waiting ? t.myReports.claimWaiting : t.myReports.claimReturned}</Badge>
      </div>
    </li>
  );
}

function ClaimTickets({ claims }: { claims: MyClaim[] }) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="my-claims-title" className="flex flex-col gap-3">
      <h2 id="my-claims-title" className="flex items-center gap-2 font-display text-2xl text-on-felt">
        <Ticket className="size-5 text-stock-yellow" aria-hidden /> {t.myReports.claimsTitle}
      </h2>
      <p className="-mt-1 text-sm text-on-felt-2">{t.myReports.claimsHint}</p>
      <ul className="paper divide-y divide-line overflow-hidden rounded-sm shadow-paper">
        {claims.map((claim) => <ClaimTicket key={claim.claimId} claim={claim} />)}
      </ul>
    </section>
  );
}

function EarnedRewards({ rewards }: { rewards: EarnedReward[] }) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="earned-rewards-title" className="flex flex-col gap-3">
      <h2 id="earned-rewards-title" className="flex items-center gap-2 font-display text-2xl text-on-felt">
        <Gift className="size-5 text-stock-yellow" aria-hidden /> {t.reward.earnedTitle}
      </h2>
      <p className="-mt-1 text-sm text-on-felt-2">{t.reward.earnedHint}</p>
      <ul className="paper divide-y divide-line overflow-hidden rounded-sm shadow-paper">
        {rewards.map((earned) => (
          <li key={earned.rewardId} className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-semibold wrap-anywhere">{earned.itemTitle}</p>
              <p className="text-xs text-ink-3">{formatRelative(earned.releasedAt)}</p>
            </div>
            <span className="font-semibold tabular-nums">{t.reward.amount(earned.netAmount)}</span>
            <Badge tone={earned.status === "paid_out" ? "success" : "verify"}>{t.reward.earnedStatus[earned.status]}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MyReportsPage() {
  const { session, signOut } = useAuth();
  const { t } = useI18n();
  const text = t.myReports;
  const [params] = useSearchParams();
  const justPaid = params.has("paid");

  const loadMine = useCallback(async () => {
    try {
      return await api.listMyLostReports();
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.code === "UNAUTHORIZED") signOut();
      throw loadError;
    }
  }, [signOut]);

  const { state, reload } = useApiQuery(loadMine, [session?.user.email]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading stock="lost" title={text.title} description={text.subtitle} />
      {justPaid && (
        <div className="mb-6 flex flex-col gap-3">
          <p role="status" className="paper flex gap-3 rounded-md border-2 border-success p-4 text-sm font-medium text-ink shadow-paper">
            <CircleCheckBig className="size-5 shrink-0 text-success" aria-hidden /> {t.reward.paidNotice}
          </p>
          {session && (
            <div role="note" className="paper flex gap-3 rounded-md border-2 border-warn p-4 shadow-paper">
              <MailCheck className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-ink">{t.reportLost.confirmEmailTitle}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{t.reportLost.confirmEmailBody(session.user.email)}</p>
              </div>
            </div>
          )}
        </div>
      )}
      {state.phase === "loading" && <Spinner />}
      {state.phase === "failed" && <ErrorNotice message={state.message} onRetry={reload} />}
      {state.phase === "ready" && (
        <div className="flex flex-col gap-10">
          {state.value.claims.length > 0 && <ClaimTickets claims={state.value.claims} />}
          {state.value.earnedRewards.length > 0 && <EarnedRewards rewards={state.value.earnedRewards} />}
          <section aria-labelledby="my-reports-title" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="my-reports-title" className="font-display text-2xl text-on-felt">{text.reportsTitle}</h2>
              <ButtonLink to="/report-lost" size="sm" icon={<Plus className="size-4" aria-hidden />}>{text.newReport}</ButtonLink>
            </div>
            {state.value.reports.length === 0 ? (
              <EmptyState icon={<Megaphone className="size-7" />} title={text.emptyTitle} description={text.emptyDescription} />
            ) : (
              state.value.reports.map((report) => <MyReportCard key={report.id} report={report} onClosed={reload} />)
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export function MyReportsLinkCard() {
  const { t } = useI18n();
  return (
    <Card className="flex flex-wrap items-center gap-4 p-5 sm:p-7">
      <span className="grid size-11 shrink-0 place-items-center rounded-sm bg-stock-pink text-stock-ink" aria-hidden>
        <Megaphone className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold">{t.account.myReportsTitle}</h2>
        <p className="text-sm text-ink-2">{t.account.myReportsDescription}</p>
      </div>
      <ButtonLink to="/my-reports" variant="secondary" size="sm">{t.account.myReportsOpen}</ButtonLink>
    </Card>
  );
}
