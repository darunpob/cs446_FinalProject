import { Backpack, CreditCard, GlassWater, KeyRound, Package, Shirt, Smartphone, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CategoryId, FoundItemStatus } from "../../api/contract";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  hue: number;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "electronics", label: "อิเล็กทรอนิกส์", icon: Smartphone, hue: 254 },
  { id: "wallet", label: "กระเป๋าสตางค์", icon: Wallet, hue: 24 },
  { id: "card", label: "บัตร / เอกสาร", icon: CreditCard, hue: 205 },
  { id: "keys", label: "กุญแจ", icon: KeyRound, hue: 42 },
  { id: "bag", label: "กระเป๋า", icon: Backpack, hue: 330 },
  { id: "bottle", label: "ขวดน้ำ / แก้ว", icon: GlassWater, hue: 172 },
  { id: "clothing", label: "เสื้อผ้า", icon: Shirt, hue: 280 },
  { id: "other", label: "อื่น ๆ", icon: Package, hue: 220 },
];

const CATEGORY_BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

export function categoryMeta(categoryId: CategoryId): CategoryMeta {
  return CATEGORY_BY_ID.get(categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function isCategoryId(candidate: string | null): candidate is CategoryId {
  return candidate !== null && CATEGORY_BY_ID.has(candidate as CategoryId);
}

export const STATUS_LABELS: Record<FoundItemStatus, { label: string; tone: "success" | "warn" | "neutral" }> = {
  available: { label: "รอเจ้าของ", tone: "success" },
  claimed: { label: "ยืนยันแล้ว รอรับ", tone: "warn" },
  returned: { label: "คืนแล้ว", tone: "neutral" },
};

export const STALE_AFTER_DAYS = 30;
