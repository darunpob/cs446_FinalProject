import { LayoutGrid, MapPin, Search, X } from "lucide-react";
import { SelectInput } from "../../design-system/Field";
import { useI18n } from "../../i18n/useI18n";
import { CATEGORIES } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { useItemFilters } from "./useItemFilters";
import type { StatusScope } from "./useItemFilters";

export function Tally({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="min-w-0 border-l-2 border-felt-line pl-3">
      <div className="text-xl leading-none font-bold tabular-nums sm:text-3xl">{value ?? "–"}</div>
      <div className="mt-1 text-xs leading-snug text-on-felt-2 sm:text-sm">{label}</div>
    </div>
  );
}

interface BoardSearchProps {
  value: string;
  onChange: (text: string) => void;
  label: string;
  placeholder: string;
  className?: string;
}

export function BoardSearch({ value, onChange, label, placeholder, className = "" }: BoardSearchProps) {
  return (
    <label className={`relative block max-w-xl ${className}`}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-3" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="paper h-13 w-full sm:h-14 rounded-lg pr-4 pl-12 text-base shadow-paper outline-none transition-shadow duration-150 placeholder:text-ink-3 focus:ring-4 focus:ring-stock-yellow"
      />
    </label>
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

interface FilterBarProps {
  locationLabel: string;
  allLocationsLabel: string;
  withScope?: boolean;
}

/** Category chips, a place picker and (on the found board) the open/all toggle, all kept in the URL. */
export function FilterBar({ locationLabel, allLocationsLabel, withScope = false }: FilterBarProps) {
  const { filters, update } = useItemFilters();
  const { placesByZone } = useDirectory();
  return (
    <div className="sticky top-[74px] z-30 -mx-4 border-y border-felt-line bg-board px-4 py-3 sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <CategoryChips />
        <div className="flex gap-2">
          <div className="min-w-0 flex-1 lg:w-52 lg:flex-none">
            <SelectInput value={filters.locationId} onChange={(event) => update({ locationId: event.target.value })} aria-label={locationLabel}>
              <option value="">{allLocationsLabel}</option>
              {placesByZone.map(([zone, places]) => (
                <optgroup key={zone} label={zone}>
                  {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
                </optgroup>
              ))}
            </SelectInput>
          </div>
          {withScope && <ScopeToggle scope={filters.scope} onChange={(scope) => update({ scope })} />}
        </div>
      </div>
    </div>
  );
}

export function ResultSummary({ count }: { count: number }) {
  const { filters, clear, isFiltered } = useItemFilters();
  const { placeName } = useDirectory();
  const { t } = useI18n();
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm text-on-felt-2">
        {t.home.resultCount.before} <strong className="font-bold text-on-felt tabular-nums">{count}</strong> {t.home.resultCount.after}
        {filters.locationId && <span className="ml-1 inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden /> {placeName(filters.locationId)}</span>}
      </h2>
      {isFiltered && (
        <button type="button" onClick={clear} className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-semibold text-on-felt-2 transition-colors duration-150 hover:bg-felt hover:text-on-felt">
          <X className="size-4" aria-hidden /> {t.home.clearFilters}
        </button>
      )}
    </div>
  );
}
