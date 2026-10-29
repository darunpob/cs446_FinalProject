import { Gift, HandHelping, MapPin, SearchX, ShieldCheck } from "lucide-react";
import { api } from "../../api/client";
import type { PublicLostReport } from "../../api/contract";
import { useApiQuery } from "../../api/useApiQuery";
import { ButtonLink } from "../../design-system/Button";
import { PageHeading } from "../../design-system/FormSection";
import { EmptyState, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { categoryMeta } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatDate } from "../catalog/thaiTime";
import { ItemCardSkeleton } from "../items/ItemCard";

const BOARD_GRID = "grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3";

/** Only what the board itself shows is handed to the found form — never anything the owner kept private. */
export function foundReportPrefillPath(report: PublicLostReport): string {
  const prefill = new URLSearchParams({ title: report.title, category: report.category, location: report.lastSeenLocationId });
  return `/report-found?${prefill.toString()}`;
}

function LostNotice({ report }: { report: PublicLostReport }) {
  const { placeName } = useDirectory();
  const { t } = useI18n();
  const category = categoryMeta(report.category);
  return (
    <li className="paper relative flex flex-col rounded-sm shadow-paper">
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
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base leading-snug font-semibold">{report.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-ink-2">
          <MapPin className="size-3.5 shrink-0 text-ink-3" aria-hidden />
          <span className="truncate">{t.lostBoard.lostNear(placeName(report.lastSeenLocationId))}</span>
        </p>
        <p className="text-xs text-ink-3 tabular-nums">{formatDate(report.lostAt)}</p>
        <ButtonLink to={foundReportPrefillPath(report)} variant="mint" size="sm" icon={<HandHelping className="size-4" aria-hidden />} className="mt-auto self-start">
          {t.lostBoard.iFoundIt}
        </ButtonLink>
      </div>
    </li>
  );
}

function BoardBody({ reports }: { reports: PublicLostReport[] }) {
  const { t } = useI18n();
  if (reports.length === 0) return <EmptyState icon={<SearchX className="size-7" />} title={t.lostBoard.emptyTitle} description={t.lostBoard.emptyDescription} />;
  return (
    <ul className={BOARD_GRID} aria-label={t.lostBoard.listLabel}>
      {reports.map((report) => <LostNotice key={report.id} report={report} />)}
    </ul>
  );
}

export function LostBoardPage() {
  const { t } = useI18n();
  const { state, reload } = useApiQuery(() => api.listOpenLostReports(), []);
  return (
    <div>
      <PageHeading stock="lost" title={t.lostBoard.title} description={t.lostBoard.subtitle} />
      <p className="mb-8 flex max-w-2xl gap-2 text-sm leading-relaxed text-on-felt-2">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-stock-mint" aria-hidden /> {t.lostBoard.privacyNote}
      </p>
      {state.phase === "loading" && (
        <div className={BOARD_GRID}>{[0, 1, 2].map((slot) => <ItemCardSkeleton key={slot} />)}</div>
      )}
      {state.phase === "failed" && <ErrorNotice message={state.message} onRetry={reload} />}
      {state.phase === "ready" && <BoardBody reports={state.value} />}
    </div>
  );
}
