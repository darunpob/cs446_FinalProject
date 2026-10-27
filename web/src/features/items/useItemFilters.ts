import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { CategoryId, FoundItemQuery } from "../../api/contract";
import { isCategoryId } from "../catalog/categories";

export type StatusScope = "open" | "all";

export interface ItemFilters {
  searchText: string;
  category: CategoryId | null;
  locationId: string;
  scope: StatusScope;
}

const SEARCH_DEBOUNCE_MS = 250;

function readFilters(params: URLSearchParams): ItemFilters {
  const category = params.get("category");
  return {
    searchText: params.get("q") ?? "",
    category: isCategoryId(category) ? category : null,
    locationId: params.get("location") ?? "",
    scope: params.get("scope") === "all" ? "all" : "open",
  };
}

export function toQuery(filters: ItemFilters): FoundItemQuery {
  return {
    q: filters.searchText.trim() || undefined,
    category: filters.category ?? undefined,
    locationId: filters.locationId || undefined,
    status: filters.scope === "open" ? "available" : undefined,
  };
}

export function useItemFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);

  const update = useCallback(
    (patch: Partial<ItemFilters>) => {
      setParams((current) => {
        const next = { ...readFilters(current), ...patch };
        const entries: Array<[string, string]> = [
          ["q", next.searchText.trim()],
          ["category", next.category ?? ""],
          ["location", next.locationId],
          ["scope", next.scope === "all" ? "all" : ""],
        ];
        return new URLSearchParams(entries.filter(([, value]) => value));
      }, { replace: true });
    },
    [setParams],
  );

  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  const isFiltered = Boolean(filters.searchText || filters.category || filters.locationId || filters.scope === "all");
  return { filters, update, clear, isFiltered };
}

export function useSearchDraft() {
  const { filters, update } = useItemFilters();
  const [draftSearch, setDraftSearch] = useState(filters.searchText);
  const [syncedText, setSyncedText] = useState(filters.searchText);

  if (filters.searchText !== syncedText) {
    setSyncedText(filters.searchText);
    if (draftSearch.trim() !== filters.searchText) setDraftSearch(filters.searchText);
  }

  useEffect(() => {
    if (draftSearch.trim() === filters.searchText) return;
    const timer = window.setTimeout(() => update({ searchText: draftSearch }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draftSearch, filters.searchText, update]);

  return { draftSearch, setDraftSearch };
}
