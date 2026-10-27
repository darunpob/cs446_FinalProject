import { Backpack, CreditCard, GlassWater, KeyRound, Package, Shirt, Smartphone, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CategoryId, FoundItemStatus } from "../../api/contract";

export interface CategoryMeta {
  id: CategoryId;
  icon: LucideIcon;
  hue: number;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "electronics", icon: Smartphone, hue: 254 },
  { id: "wallet", icon: Wallet, hue: 24 },
  { id: "card", icon: CreditCard, hue: 205 },
  { id: "keys", icon: KeyRound, hue: 42 },
  { id: "bag", icon: Backpack, hue: 330 },
  { id: "bottle", icon: GlassWater, hue: 172 },
  { id: "clothing", icon: Shirt, hue: 280 },
  { id: "other", icon: Package, hue: 220 },
];

const CATEGORY_BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

export function categoryMeta(categoryId: CategoryId): CategoryMeta {
  return CATEGORY_BY_ID.get(categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function isCategoryId(candidate: string | null): candidate is CategoryId {
  return candidate !== null && CATEGORY_BY_ID.has(candidate as CategoryId);
}

export const STATUS_TONES: Record<FoundItemStatus, "success" | "warn" | "neutral"> = {
  available: "success",
  claimed: "warn",
  returned: "neutral",
};

export const STALE_AFTER_DAYS = 30;
