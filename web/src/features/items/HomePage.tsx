import type { CSSProperties } from "react";
import { Hourglass, LayoutGrid, MapPin, PackageCheck, PackageSearch, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "../../api/client";
import { useApiQuery } from "../../api/useApiQuery";
import { ButtonLink } from "../../design-system/Button";
import { SelectInput } from "../../design-system/Field";
import { EmptyState, ErrorNotice } from "../../design-system/Surface";
import { CATEGORIES } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { ItemCard, ItemCardSkeleton } from "./ItemCard";
import { toQuery, useItemFilters, useSearchDraft } from "./useItemFilters";
import type { StatusScope } from "./useItemFilters";

function StatTile({ icon: Icon, value, label, hue }: { icon: LucideIcon; value: number | null; label: string; hue: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface/80 p-4 shadow-card backdrop-blur">
      <span className="tint grid size-11 shrink-0 place-items-center rounded-xl" style={{ "--h": hue } as CSSProperties}>
        <Icon className="size-5" />
      </span>
      <div>
        <div className="font-display text-2xl leading-none font-bold tabular-nums">{value ?? "–"}</div>
        <div className="mt-1 text-[13px] text-ink-2">{label}</div>
      </div>
    </div>
  );
}

function Hero({ draftSearch, onSearch }: { draftSearch: string; onSearch: (text: string) => void }) {
  const { state } = useApiQuery(() => api.getStats(), []);
  const stats = state.phase === "ready" ? state.value : null;
  return (
    <section className="grid items-end gap-8 pb-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="animate-rise">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-medium text-ink-2 backdrop-blur">
          <span className="size-1.5 animate-pulse rounded-full bg-success" /> อัปเดตแบบเรียลไทม์จากจุดรับฝากทั่วแคมปัส
        </span>
        <h1 className="mt-4 font-display text-4xl leading-[1.15] font-bold tracking-tight text-balance sm:text-5xl">
          ของหาย? <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">เช็กตรงนี้ก่อน</span>
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-2 sm:text-base">
          รวมของที่มีคนเก็บได้ในมหาวิทยาลัยไว้ที่เดียว ค้นหา ยืนยันความเป็นเจ้าของ แล้วไปรับคืนที่จุดรับฝากได้เลย
        </p>
        <label className="group relative mt-6 block max-w-xl">
          <span className="sr-only">ค้นหาของที่เจอ</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-3 transition-colors duration-150 group-focus-within:text-brand" />
          <input
            type="search"
            value={draftSearch}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="ลองพิมพ์ เช่น iPhone, กุญแจ, กระเป๋าสตางค์"
            className="h-14 w-full rounded-2xl border border-line-strong bg-surface pr-4 pl-12 text-base shadow-card outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
        </label>
      </div>
      <div className="grid animate-rise gap-3 [animation-delay:80ms] sm:grid-cols-3 lg:grid-cols-1">
        <StatTile icon={PackageSearch} value={stats?.waiting ?? null} label="ชิ้นที่รอเจ้าของ" hue={254} />
        <StatTile icon={Hourglass} value={stats?.awaitingPickup ?? null} label="ยืนยันแล้ว รอมารับ" hue={38} />
        <StatTile icon={PackageCheck} value={stats?.returnedThisMonth ?? null} label="คืนเจ้าของแล้วเดือนนี้" hue={160} />
      </div>
    </section>
  );
}

function chipClass(active: boolean): string {
  const state = active
    ? "border-transparent bg-ink text-bg shadow-card"
    : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink";
  return `inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-150 ${state}`;
}

function FilterBar() {
  const { filters, update } = useItemFilters();
  const { placesByZone } = useDirectory();
  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-line/60 bg-[var(--glass)] px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] lg:mx-0 lg:min-w-0 lg:flex-1 lg:px-0 lg:pr-8 lg:[mask-image:linear-gradient(to_right,black_88%,transparent)]" role="group" aria-label="หมวดหมู่">
          <button type="button" className={chipClass(filters.category === null)} onClick={() => update({ category: null })}>
            <LayoutGrid className="size-4" /> ทั้งหมด
          </button>
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={chipClass(filters.category === id)} aria-pressed={filters.category === id} onClick={() => update({ category: filters.category === id ? null : id })}>
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1 lg:w-52 lg:flex-none">
            <SelectInput value={filters.locationId} onChange={(event) => update({ locationId: event.target.value })} aria-label="จุดที่เจอ">
              <option value="">ทุกจุดที่เจอ</option>
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
  const options: Array<[StatusScope, string]> = [["open", "รอเจ้าของ"], ["all", "ทั้งหมด"]];
  return (
    <div className="flex h-11 shrink-0 rounded-xl border border-line-strong bg-surface-2 p-1" role="radiogroup" aria-label="สถานะ">
      {options.map(([value, label]) => (
        <button key={value} type="button" role="radio" aria-checked={scope === value} onClick={() => onChange(value)}
          className={`cursor-pointer rounded-lg px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ${scope === value ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Results() {
  const { filters, clear, isFiltered } = useItemFilters();
  const { placeName } = useDirectory();
  const query = toQuery(filters);
  const { state, reload } = useApiQuery(() => api.listFoundItems(query), [query.q, query.category, query.location, query.status]);

  if (state.phase === "failed") return <ErrorNotice message={state.message} onRetry={reload} />;
  if (state.phase === "loading") {
    return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, slot) => <ItemCardSkeleton key={slot} />)}</div>;
  }
  const foundItems = state.value;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-2">
          พบ <strong className="font-semibold text-ink">{foundItems.length}</strong> รายการ
          {filters.locationId && <span className="ml-1 inline-flex items-center gap-1"><MapPin className="size-3.5" /> {placeName(filters.locationId)}</span>}
        </p>
        {isFiltered && (
          <button type="button" onClick={clear} className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
            <X className="size-3.5" /> ล้างตัวกรอง
          </button>
        )}
      </div>
      {foundItems.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-7" />}
          title="ยังไม่พบของที่ตรงกับที่ค้นหา"
          description="ลองเปลี่ยนคำค้นหรือตัวกรอง หรือฝากแจ้งของหายไว้ เมื่อมีคนเจอของที่ตรงกันเราจะแจ้งเตือนผ่าน LINE"
          action={<ButtonLink to="/report-lost" variant="soft" className="mt-2">แจ้งของหาย</ButtonLink>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {foundItems.map((foundItem, index) => <ItemCard key={foundItem.id} foundItem={foundItem} index={index} />)}
        </div>
      )}
    </>
  );
}

export function HomePage() {
  const { draftSearch, setDraftSearch } = useSearchDraft();
  return (
    <>
      <Hero draftSearch={draftSearch} onSearch={setDraftSearch} />
      <FilterBar />
      <section className="pt-6" aria-label="รายการของที่เจอ">
        <Results />
      </section>
    </>
  );
}
