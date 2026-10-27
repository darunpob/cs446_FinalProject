import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CalendarClock, Clock3, Hand, MapPin, PackageOpen, Phone, Store } from "lucide-react";
import { api } from "../../api/client";
import type { FoundItem } from "../../api/contract";
import { useApiQuery } from "../../api/useApiQuery";
import { Button, ButtonLink } from "../../design-system/Button";
import { Badge, Card, EmptyState, Spinner } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { STATUS_TONES, categoryMeta } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatDateTime, formatRelative } from "../catalog/thaiTime";
import { ClaimDialog } from "./ClaimDialog";
import { ItemVisual } from "./ItemVisual";

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-ink-3">{label}</dt>
        <dd className="mt-0.5 text-[15px] font-medium">{children}</dd>
      </div>
    </div>
  );
}

function ClaimPanel({ foundItem, onClaim }: { foundItem: FoundItem; onClaim: () => void }) {
  const { t } = useI18n();
  if (foundItem.status !== "available") {
    const message = foundItem.status === "claimed" ? t.item.claimedMessage : t.item.returnedMessage;
    return <div className="rounded-2xl bg-surface-2 p-4 text-sm text-ink-2">{message}</div>;
  }
  return (
    <Card className="p-5">
      <h2 className="font-display text-base font-semibold">{t.item.stepsTitle}</h2>
      <ol className="mt-3 flex flex-col gap-2.5">
        {t.item.claimSteps.map((step, stepIndex) => (
          <li key={step} className="flex items-start gap-3 text-sm text-ink-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-ink">{stepIndex + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <Button size="lg" onClick={onClaim} icon={<Hand className="size-5" />} className="mt-5 w-full">{t.item.claimButton}</Button>
    </Card>
  );
}

function ItemDetail({ foundItem, onChanged }: { foundItem: FoundItem; onChanged: () => void }) {
  const { placeName, dropOffPoint } = useDirectory();
  const { t } = useI18n();
  const [claiming, setClaiming] = useState(false);
  const category = categoryMeta(foundItem.category);
  const point = dropOffPoint(foundItem.dropOffPointId);
  return (
    <div className="grid animate-rise gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <ItemVisual foundItem={foundItem} iconSize="size-24" className="aspect-[4/3] w-full rounded-3xl border border-line shadow-card" />
      </div>
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand" icon={<category.icon className="size-3.5" />}>{t.categories[category.id]}</Badge>
            <Badge tone={STATUS_TONES[foundItem.status]}>{t.status[foundItem.status]}</Badge>
          </div>
          <h1 className="mt-3 font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{foundItem.title}</h1>
          {foundItem.description && <p className="mt-3 leading-relaxed text-ink-2">{foundItem.description}</p>}
        </div>
        <dl className="divide-y divide-line rounded-2xl border border-line bg-surface px-4">
          <InfoRow icon={<MapPin className="size-4" />} label={t.item.foundPlace}>{placeName(foundItem.foundLocationId)}</InfoRow>
          <InfoRow icon={<CalendarClock className="size-4" />} label={t.item.foundTime}>
            {formatDateTime(foundItem.foundAt)} <span className="font-normal text-ink-3">· {formatRelative(foundItem.foundAt)}</span>
          </InfoRow>
          <InfoRow icon={<Store className="size-4" />} label={t.item.droppedAt}>
            {point?.name ?? t.item.unspecified}
            {point && (
              <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-normal text-ink-2">
                <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {point.hours}</span>
                <span className="inline-flex items-center gap-1"><Phone className="size-3.5" /> {point.phone}</span>
              </span>
            )}
          </InfoRow>
        </dl>
        <ClaimPanel foundItem={foundItem} onClaim={() => setClaiming(true)} />
      </div>
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
      <Link to="/" className="mb-6 inline-flex items-center gap-2 rounded-lg py-1 text-sm font-medium text-ink-2 transition-colors duration-150 hover:text-ink">
        <ArrowLeft className="size-4" /> {t.item.back}
      </Link>
      {state.phase === "loading" && <Spinner />}
      {state.phase === "failed" && (
        <EmptyState icon={<PackageOpen className="size-7" />} title={t.item.notFoundTitle} description={state.message} action={<ButtonLink to="/" variant="soft" className="mt-2">{t.item.viewAll}</ButtonLink>} />
      )}
      {state.phase === "ready" && <ItemDetail foundItem={state.value} onChanged={reload} />}
    </>
  );
}
