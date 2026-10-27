import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Clock3, Hand, PackageOpen, Phone, Sparkles } from "lucide-react";
import { api } from "../../api/client";
import type { FoundItem } from "../../api/contract";
import { useApiQuery } from "../../api/useApiQuery";
import { Button, ButtonLink } from "../../design-system/Button";
import { Card, EmptyState, Spinner, StatusStamp } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { categoryMeta, placeCode } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatDateTime, formatRelative } from "../catalog/thaiTime";
import { ClaimDialog } from "./ClaimDialog";
import { ItemVisual } from "./ItemVisual";

function AiLabels({ labels }: { labels: string[] }) {
  const { t } = useI18n();
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" title={t.item.aiLabelsHint}>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-3">
        <Sparkles className="size-3.5" aria-hidden /> {t.item.aiLabelsTitle}
      </span>
      {labels.map((label) => (
        <span key={label} className="rounded-sm border border-line-strong bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-2">{label}</span>
      ))}
    </div>
  );
}

const PERFORATION = "border-dashed border-line-strong";

function Segment({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 px-5 py-3 sm:px-7 sm:py-4 ${PERFORATION} ${className}`}>
      <dt className="text-xs font-semibold text-ink-3">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold">{children}</dd>
    </div>
  );
}

function ItemSegments({ foundItem }: { foundItem: FoundItem }) {
  const { placeName, dropOffPoint } = useDirectory();
  const { t } = useI18n();
  const point = dropOffPoint(foundItem.dropOffPointId);
  return (
    <dl className={`-mx-5 grid border-y-2 sm:-mx-7 sm:grid-cols-2 ${PERFORATION}`}>
      <Segment label={t.item.foundPlace}>
        <Link to={`/?location=${foundItem.foundLocationId}&scope=all`} className="inline-flex items-center gap-2 rounded-sm underline decoration-line-strong hover:decoration-ink">
          <span className="inline-block rounded-sm bg-ink px-1.5 text-sm text-surface tabular-nums">{placeCode(foundItem.foundLocationId)}</span>
          {placeName(foundItem.foundLocationId)}
        </Link>
      </Segment>
      <Segment label={t.item.foundTime} className="border-t-2 sm:border-t-0 sm:border-l-2">
        <span className="tabular-nums">{formatDateTime(foundItem.foundAt)}</span>
        <span className="block text-[13px] font-normal text-ink-3">{formatRelative(foundItem.foundAt)}</span>
      </Segment>
      <Segment label={t.item.droppedAt} className="border-t-2 sm:col-span-2">
        {point?.name ?? t.item.unspecified}
        {point && (
          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-normal text-ink-2">
            <span className="inline-flex items-center gap-1 tabular-nums"><Clock3 className="size-3.5" aria-hidden /> {point.hours}</span>
            <a href={`tel:${point.phone}`} className="inline-flex items-center gap-1 tabular-nums underline decoration-line-strong hover:decoration-ink"><Phone className="size-3.5" aria-hidden /> {point.phone}</a>
          </span>
        )}
      </Segment>
    </dl>
  );
}

function ClaimPanel({ foundItem, onClaim }: { foundItem: FoundItem; onClaim: () => void }) {
  const { t } = useI18n();
  if (foundItem.status !== "available") {
    const message = foundItem.status === "claimed" ? t.item.claimedMessage : t.item.returnedMessage;
    return <p className="text-sm leading-relaxed text-ink-2">{message}</p>;
  }
  return (
    <div>
      <h2 className="font-semibold">{t.item.stepsTitle}</h2>
      <ol className="mt-3 flex flex-col gap-2.5">
        {t.item.claimSteps.map((step, stepIndex) => (
          <li key={step} className="flex items-start gap-3 text-sm text-ink-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-sm bg-ink text-xs font-bold text-surface tabular-nums">{stepIndex + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <Button size="lg" onClick={onClaim} icon={<Hand className="size-5" aria-hidden />} className="mt-5 w-full">{t.item.claimButton}</Button>
    </div>
  );
}

function ItemDetail({ foundItem, onChanged }: { foundItem: FoundItem; onChanged: () => void }) {
  const { t } = useI18n();
  const [claiming, setClaiming] = useState(false);
  const category = categoryMeta(foundItem.category);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <Card pinned className="p-3">
          <ItemVisual foundItem={foundItem} iconSize="size-24" className="aspect-[16/10] w-full rounded-sm sm:aspect-[4/3]" />
        </Card>
      </div>
      <Card pinned className="overflow-hidden">
        <div className={`flex h-11 items-center gap-2 px-5 text-sm font-bold text-stock-ink ${category.stock}`}>
          <category.icon className="size-4" aria-hidden /> {t.categories[category.id]}
        </div>
        <div className="flex flex-col gap-6 p-5 sm:p-7">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-3xl leading-tight sm:text-4xl">{foundItem.title}</h1>
              <StatusStamp key={foundItem.status} status={foundItem.status} size="lg" pressed className="mt-1 shrink-0" />
            </div>
            {foundItem.description && <p className="mt-3 max-w-prose leading-relaxed text-ink-2">{foundItem.description}</p>}
            {foundItem.aiLabels.length > 0 && <AiLabels labels={foundItem.aiLabels} />}
          </div>
          <ItemSegments foundItem={foundItem} />
          <ClaimPanel foundItem={foundItem} onClaim={() => setClaiming(true)} />
        </div>
      </Card>
      <ClaimDialog key={foundItem.id} foundItem={foundItem} open={claiming} onClose={() => setClaiming(false)} onVerified={onChanged} />
    </div>
  );
}

export function ItemDetailPage() {
  const { itemId = "" } = useParams();
  const { state, reload } = useApiQuery(() => api.getFoundItem(itemId), [itemId]);
  const { t } = useI18n();
  return (
    <>
      <Link to="/" className="mb-6 inline-flex h-10 items-center gap-2 rounded-md text-sm font-semibold text-on-felt-2 transition-colors duration-150 hover:text-on-felt">
        <ArrowLeft className="size-4" aria-hidden /> {t.item.back}
      </Link>
      {state.phase === "loading" && <Spinner />}
      {state.phase === "failed" && (
        <EmptyState icon={<PackageOpen className="size-7" />} title={t.item.notFoundTitle} description={state.message} action={<ButtonLink to="/" className="mt-2">{t.item.viewAll}</ButtonLink>} />
      )}
      {state.phase === "ready" && <ItemDetail foundItem={state.value} onChanged={reload} />}
    </>
  );
}
