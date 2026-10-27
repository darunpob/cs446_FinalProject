import { LayoutGrid, MapPin, PackageSearch, Search, X } from "lucide-react";
import { api } from "../../api/client";
import { useApiQuery } from "../../api/useApiQuery";
import { ButtonLink } from "../../design-system/Button";
import { SelectInput } from "../../design-system/Field";
import { EmptyState, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { CATEGORIES } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { ItemCard, ItemCardSkeleton, NOTICE_GRID } from "./ItemCard";
import { toQuery, useItemFilters, useSearchDraft } from "./useItemFilters";
import type { StatusScope } from "./useItemFilters";

function Tally({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="min-w-0 border-l-2 border-felt-line pl-3">
      <div className="text-xl leading-none font-bold tabular-nums sm:text-3xl">{value ?? "–"}</div>
      <div className="mt-1 text-xs leading-snug text-on-felt-2 sm:text-sm">{label}</div>
    </div>
  );
}

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
        <label className="relative mt-4 block max-w-xl sm:mt-5">
          <span className="sr-only">{t.home.searchLabel}</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            type="search"
            value={draftSearch}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={t.home.searchPlaceholder}
            className="paper h-13 w-full sm:h-14 rounded-lg pr-4 pl-12 text-base shadow-paper outline-none transition-shadow duration-150 placeholder:text-ink-3 focus:ring-4 focus:ring-stock-yellow"
          />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Tally value={stats?.waiting ?? null} label={t.home.statWaiting} />
        <Tally value={stats?.awaitingPickup ?? null} label={t.home.statAwaiting} />
        <Tally value={stats?.returnedThisMonth ?? null} label={t.home.statReturned} />
      </div>
    </section>
  );
}

function chipClass(active: boolean, stock: string): string {
  const state = active
    ? `${stock} text-stock-ink border-transparent shadow-paper`
    : "border-felt-line text-on-felt hover:border-on-felt-2";
  return `inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3.5 text-sm font-semibold transition-colors duration-150 ${state}`;
}

function CategoryChips() {
  const { filters, update } = useItemFilters();
  const { t } = useI18n();
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] lg:mx-0 lg:min-w-0 lg:flex-1 lg:flex-wrap lg:px-0" role="group" aria-label={t.home.categoryGroup}>
      <button type="button" className={chipClass(filters.category === null, "bg-stock-yellow")} aria-pressed={filters.category === null} onClick={() => update({ category: null })}>
        <LayoutGrid className="size-4" aria-hidden /> {t.home.all}
      </button>
      {CATEGORIES.map(({ id, icon: Icon, stock }) => {
        const active = filters.category === id;
        return (
          <button key={id} type="button" className={chipClass(active, stock)} aria-pressed={active} onClick={() => update({ category: active ? null : id })}>
            {active ? <Icon className="size-4" aria-hidden /> : <span className={`size-3 rounded-[2px] ${stock}`} aria-hidden />}
            {t.categories[id]}
          </button>
        );
      })}
    </div>
  );
}

function FilterBar() {
  const { filters, update } = useItemFilters();
  const { placesByZone } = useDirectory();
  const { t } = useI18n();
  return (
    <div className="sticky top-[74px] z-30 -mx-4 border-y border-felt-line bg-board px-4 py-3 sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <CategoryChips />
        <div className="flex gap-2">
          <div className="min-w-0 flex-1 lg:w-52 lg:flex-none">
            <SelectInput value={filters.locationId} onChange={(event) => update({ locationId: event.target.value })} aria-label={t.home.locationLabel}>
              <option value="">{t.home.allLocations}</option>
              {placesByZone.map(([zone, places]) => (
                <optgroup key={zone} label={zone}>
                  {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
                </optgroup>
              ))}
            </SelectInput>
          </div>
          <ScopeToggle scope={filters.scope} onChange={(scope) => update({ scope })} />
        </div>
      </div>
    </div>
  );
}

function ScopeToggle({ scope, onChange }: { scope: StatusScope; onChange: (scope: StatusScope) => void }) {
  const { t } = useI18n();
  const options: Array<[StatusScope, string]> = [["open", t.home.scopeOpen], ["all", t.home.all]];
  return (
    <div className="flex h-11 shrink-0 rounded-lg border border-felt-line p-1" role="radiogroup" aria-label={t.home.statusGroup}>
      {options.map(([value, label]) => (
        <button key={value} type="button" role="radio" aria-checked={scope === value} onClick={() => onChange(value)}
          className={`cursor-pointer rounded-md px-3 text-sm font-semibold transition-[background-color,color] duration-150 ${scope === value ? "paper shadow-paper" : "text-on-felt-2 hover:text-on-felt"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Results() {
  const { filters, clear, isFiltered } = useItemFilters();
  const { placeName } = useDirectory();
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm text-on-felt-2">
          {t.home.resultCount.before} <strong className="font-bold text-on-felt tabular-nums">{foundItems.length}</strong> {t.home.resultCount.after}
          {filters.locationId && <span className="ml-1 inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden /> {placeName(filters.locationId)}</span>}
        </h2>
        {isFiltered && (
          <button type="button" onClick={clear} className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-semibold text-on-felt-2 transition-colors duration-150 hover:bg-felt hover:text-on-felt">
            <X className="size-4" aria-hidden /> {t.home.clearFilters}
          </button>
        )}
      </div>
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
      <FilterBar />
      <section className="pt-6" aria-label={t.home.listLabel}>
        <Results />
      </section>
    </>
  );
}
