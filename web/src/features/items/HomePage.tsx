import { PackageSearch } from "lucide-react";
import { api } from "../../api/client";
import { useApiQuery } from "../../api/useApiQuery";
import { ButtonLink } from "../../design-system/Button";
import { EmptyState, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { BoardSearch, FilterBar, ResultSummary, Tally } from "./BoardFilters";
import { ItemCard, ItemCardSkeleton, NOTICE_GRID } from "./ItemCard";
import { toQuery, useItemFilters, useSearchDraft } from "./useItemFilters";

function Hero({ draftSearch, onSearch }: { draftSearch: string; onSearch: (text: string) => void }) {
  const { state } = useApiQuery(() => api.getStats(), []);
  const stats = state.phase === "ready" ? state.value : null;
  const { t } = useI18n();
  return (
    <section className="grid gap-4 pb-5 sm:gap-6 sm:pb-6 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-12">
      <div>
        <h1 className="font-display text-[2rem] leading-tight sm:text-5xl">
          {t.home.heroTitle} <span className="text-stock-yellow">{t.home.heroHighlight}</span>
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-on-felt-2 sm:text-base">{t.home.heroLead}</p>
        <BoardSearch value={draftSearch} onChange={onSearch} label={t.home.searchLabel} placeholder={t.home.searchPlaceholder} className="mt-4 sm:mt-5" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Tally value={stats?.waiting ?? null} label={t.home.statWaiting} />
        <Tally value={stats?.awaitingPickup ?? null} label={t.home.statAwaiting} />
        <Tally value={stats?.returnedThisMonth ?? null} label={t.home.statReturned} />
      </div>
    </section>
  );
}

function Results() {
  const { filters } = useItemFilters();
  const { t } = useI18n();
  const query = toQuery(filters);
  const { state, reload } = useApiQuery(() => api.listFoundItems(query), [query.q, query.category, query.location, query.status]);

  if (state.phase === "failed") return <ErrorNotice message={state.message} onRetry={reload} />;
  if (state.phase === "loading") {
    return <div className={NOTICE_GRID}>{Array.from({ length: 6 }, (_, slot) => <ItemCardSkeleton key={slot} />)}</div>;
  }
  const foundItems = state.value;
  return (
    <>
      <ResultSummary count={foundItems.length} />
      {foundItems.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-7" />}
          title={t.home.emptyTitle}
          description={t.home.emptyDescription}
          action={<ButtonLink to="/report-lost" className="mt-2">{t.nav.reportLost}</ButtonLink>}
        />
      ) : (
        <div className={NOTICE_GRID}>
          {foundItems.map((foundItem) => <ItemCard key={foundItem.id} foundItem={foundItem} />)}
        </div>
      )}
    </>
  );
}

export function HomePage() {
  const { draftSearch, setDraftSearch } = useSearchDraft();
  const { t } = useI18n();
  return (
    <>
      <Hero draftSearch={draftSearch} onSearch={setDraftSearch} />
      <FilterBar locationLabel={t.home.locationLabel} allLocationsLabel={t.home.allLocations} withScope />
      <section className="pt-6" aria-label={t.home.listLabel}>
        <Results />
      </section>
    </>
  );
}
