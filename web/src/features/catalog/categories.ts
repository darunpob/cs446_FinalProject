import { Backpack, CreditCard, GlassWater, KeyRound, Package, Shirt, Smartphone, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CategoryId } from "../../api/contract";

export interface CategoryMeta {
  id: CategoryId;
  icon: LucideIcon;
  /** Card-stock colour of the notice header and chip for this category. */
  stock: string;
  /** Same card-stock colour, washed, for photo-less placeholders (plain field in dark theme). */
  stockWash: string;
  /** Deeper shade of the same colour for small marks on white (swatches, icons). */
  stockStrong: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "electronics", icon: Smartphone, stock: "bg-stock-sky", stockWash: "bg-stock-sky/60", stockStrong: "bg-stock-sky-strong" },
  { id: "wallet", icon: Wallet, stock: "bg-stock-orange", stockWash: "bg-stock-orange/60", stockStrong: "bg-stock-orange-strong" },
  { id: "card", icon: CreditCard, stock: "bg-stock-pink", stockWash: "bg-stock-pink/60", stockStrong: "bg-stock-pink-strong" },
  { id: "keys", icon: KeyRound, stock: "bg-stock-yellow", stockWash: "bg-stock-yellow/60", stockStrong: "bg-stock-yellow-strong" },
  { id: "bag", icon: Backpack, stock: "bg-stock-lilac", stockWash: "bg-stock-lilac/60", stockStrong: "bg-stock-lilac-strong" },
  { id: "bottle", icon: GlassWater, stock: "bg-stock-mint", stockWash: "bg-stock-mint/60", stockStrong: "bg-stock-mint-strong" },
  { id: "clothing", icon: Shirt, stock: "bg-stock-lime", stockWash: "bg-stock-lime/60", stockStrong: "bg-stock-lime-strong" },
  { id: "other", icon: Package, stock: "bg-stock-sand", stockWash: "bg-stock-sand/70", stockStrong: "bg-stock-sand-strong" },
];

/** Categories whose photos usually show a card number: the backend masks it, and lost reports may carry a student ID. */
export const CARD_HOLDING_CATEGORIES: CategoryId[] = ["card", "wallet"];

const CATEGORY_BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

export function categoryMeta(categoryId: CategoryId): CategoryMeta {
  return CATEGORY_BY_ID.get(categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function isCategoryId(candidate: string | null): candidate is CategoryId {
  return candidate !== null && CATEGORY_BY_ID.has(candidate as CategoryId);
}

const PLAIN_BUILDING_CODE = /^[a-z]\d{1,3}$/i;

/** Short sign code for a campus place, e.g. "loc-a5" → "A5", "loc-library" → "LIB". */
export function placeCode(placeId: string): string {
  const bareId = placeId.replace(/^loc-/, "");
  if (PLAIN_BUILDING_CODE.test(bareId)) return bareId.toUpperCase();
  return bareId.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase();
}

export const STALE_AFTER_DAYS = 30;
