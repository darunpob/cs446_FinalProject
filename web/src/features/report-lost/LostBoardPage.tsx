import { useState } from "react";
import { CalendarClock, Expand, Gift, HandHelping, MapPin, SearchX, ShieldCheck } from "lucide-react";
import { api } from "../../api/client";
import { LOST_REPORT_EXPIRY_DAYS } from "../../api/contract";
import type { LostNoticeProgress, PublicLostReport } from "../../api/contract";
import { useApiQuery } from "../../api/useApiQuery";
import { ButtonLink } from "../../design-system/Button";
import { PageHeading } from "../../design-system/FormSection";
import { Badge, EmptyState, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { categoryMeta } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatDate } from "../catalog/thaiTime";
import { BoardSearch, FilterBar, ResultSummary, Tally } from "../items/BoardFilters";
import { ItemCardSkeleton } from "../items/ItemCard";
import { ItemVisual } from "../items/ItemVisual";
import { PhotoLightbox } from "../items/PhotoLightbox";
import { toQuery, useItemFilters, useSearchDraft } from "../items/useItemFilters";

const BOARD_GRID = "grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3";

const PROGRESS_TONE: Record<LostNoticeProgress, "stamp" | "success" | "verify"> = {
  searching: "stamp",
  found: "success",
  awaiting_pickup: "verify",
};

/**
 * Only what the board itself shows is handed to the found form — never anything the owner kept private.
 * The notice id rides along so the server can tie this find to the notice and its reward.
 */
export function foundReportPrefillPath(report: PublicLostReport): string {
  const prefill = new URLSearchParams({ title: report.title, category: report.category, location: report.lastSeenLocationId, answers: report.id });
  return `/report-found?${prefill.toString()}`;
}

function NoticePhoto({ report }: { report: PublicLostReport }) {
  const { t } = useI18n();
  const [viewerOpen, setViewerOpen] = useState(false);
  const photoCount = report.imageUrls.length;
  if (photoCount === 0) {
    return <ItemVisual foundItem={{ category: report.category, title: report.title, imageUrl: null }} className="aspect-[4/3] w-full" />;
  }
  return (
    <>
      <button type="button" onClick={() => setViewerOpen(true)} aria-label={t.photo.openViewer(photoCount)} className="group relative block w-full cursor-zoom-in overflow-hidden">
        <ItemVisual foundItem={{ category: report.category, title: report.title, imageUrl: report.imageUrls[0] }} className="aspect-[4/3] w-full transition-transform duration-200 group-hover:scale-[1.03]" />
        <span className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-ink/70 text-surface opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden>
          <Expand className="size-4" />
        </span>
        {photoCount > 1 && (
          <span className="absolute right-2 bottom-2 rounded-sm bg-ink/85 px-2 py-0.5 text-xs font-semibold text-surface tabular-nums">
            {t.lostBoard.morePhotos(photoCount - 1)}
          </span>
        )}
      </button>
      {viewerOpen && <PhotoLightbox title={report.title} imageUrls={report.imageUrls} startIndex={0} onClose={() => setViewerOpen(false)} />}
    </>
  );
}

function LostNotice({ report }: { report: PublicLostReport }) {
  const { placeName } = useDirectory();
  const { t } = useI18n();
  const category = categoryMeta(report.category);
  return (
    <li className="paper relative flex min-w-0 flex-col rounded-sm shadow-paper">
      <span className="pin" aria-hidden />
      <div className={`flex h-9 items-center gap-2 rounded-t-sm px-3 text-sm font-bold text-stock-ink ${category.stock}`}>
        <category.icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{t.categories[category.id]}</span>
        {report.hasReward && (
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-sm bg-ink px-2 py-0.5 text-xs text-surface">
            <Gift className="size-3.5" aria-hidden /> {t.reward.boardBadge}
          </span>
        )}
      </div>
      <div className="relative">
        <NoticePhoto report={report} />
        <Badge tone={PROGRESS_TONE[report.progress]} className="pointer-events-none absolute bottom-2 left-2 shadow-paper">{t.lostBoard.progress[report.progress]}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base leading-snug font-semibold wrap-anywhere">{report.title}</h3>
        {report.description && <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-line text-ink-2 wrap-anywhere">{report.description}</p>}
        <p className="flex items-center gap-1.5 text-sm text-ink-2">
          <MapPin className="size-3.5 shrink-0 text-ink-3" aria-hidden />
          <span className="truncate">{t.lostBoard.lostNear(placeName(report.lastSeenLocationId))}</span>
        </p>
        <p className="text-xs text-ink-3 tabular-nums">{formatDate(report.lostAt)}</p>
        {report.progress !== "awaiting_pickup" && (
          <ButtonLink to={foundReportPrefillPath(report)} variant="mint" size="sm" icon={<HandHelping className="size-4" aria-hidden />} className="mt-auto self-start">
            {t.lostBoard.iFoundIt}
          </ButtonLink>
        )}
      </div>
    </li>
  );
}

function BoardBody({ reports }: { reports: PublicLostReport[] }) {
  const { isFiltered } = useItemFilters();
  const { t } = useI18n();
  if (reports.length === 0) {
    const title = isFiltered ? t.lostBoard.noMatchTitle : t.lostBoard.emptyTitle;
    const description = isFiltered ? t.lostBoard.noMatchDescription : t.lostBoard.emptyDescription;
    return <EmptyState icon={<SearchX className="size-7" />} title={title} description={description} />;
  }
  return (
    <ul className={BOARD_GRID} aria-label={t.lostBoard.listLabel}>
      {reports.map((report) => <LostNotice key={report.id} report={report} />)}
    </ul>
  );
}

function BoardResults() {
  const { filters } = useItemFilters();
  const { category, location, q } = toQuery(filters);
  const { state, reload } = useApiQuery(() => api.listOpenLostReports({ q, category, location }), [q, category, location]);
  if (state.phase === "failed") return <ErrorNotice message={state.message} onRetry={reload} />;
  if (state.phase === "loading") return <div className={BOARD_GRID}>{[0, 1, 2].map((slot) => <ItemCardSkeleton key={slot} />)}</div>;
  return (
    <>
      <ResultSummary count={state.value.length} />
      <BoardBody reports={state.value} />
    </>
  );
}

function BoardHeader() {
  const { t } = useI18n();
  const { draftSearch, setDraftSearch } = useSearchDraft();
  const { state } = useApiQuery(() => api.getStats(), []);
  const stats = state.phase === "ready" ? state.value : null;
  return (
    <section className="pb-5 sm:pb-6">
      <PageHeading stock="lost" title={t.lostBoard.title} description={t.lostBoard.subtitle} />
      <div className="mb-5 flex max-w-2xl flex-col gap-1.5 text-sm leading-relaxed text-on-felt-2">
        <p className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-stock-mint" aria-hidden /> {t.lostBoard.privacyNote}</p>
        <p className="flex gap-2"><CalendarClock className="mt-0.5 size-4 shrink-0 text-stock-yellow" aria-hidden /> {t.lostBoard.expiryNote(LOST_REPORT_EXPIRY_DAYS)}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-12">
        <BoardSearch value={draftSearch} onChange={setDraftSearch} label={t.lostBoard.searchLabel} placeholder={t.lostBoard.searchPlaceholder} />
        <div className="grid grid-cols-3 gap-3">
          <Tally value={stats?.lostSearching ?? null} label={t.lostBoard.statSearching} />
          <Tally value={stats?.lostAwaitingPickup ?? null} label={t.lostBoard.statAwaiting} />
          <Tally value={stats?.lostFoundThisMonth ?? null} label={t.lostBoard.statFound} />
        </div>
      </div>
    </section>
  );
}

export function LostBoardPage() {
  const { t } = useI18n();
  return (
    <div>
      <BoardHeader />
      <FilterBar locationLabel={t.lostBoard.locationLabel} allLocationsLabel={t.lostBoard.allLocations} />
      <section className="pt-6" aria-label={t.lostBoard.listLabel}>
        <BoardResults />
      </section>
    </div>
  );
}
