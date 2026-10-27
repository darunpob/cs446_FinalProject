import type { CSSProperties } from "react";
import type { FoundItem } from "../../api/contract";
import { useI18n } from "../../i18n/useI18n";
import { categoryMeta } from "../catalog/categories";

interface ItemVisualProps {
  foundItem: Pick<FoundItem, "category" | "imageUrl" | "title">;
  className?: string;
  iconSize?: string;
}

export function ItemVisual({ foundItem, className = "", iconSize = "size-12" }: ItemVisualProps) {
  const { t } = useI18n();
  const category = categoryMeta(foundItem.category);
  if (foundItem.imageUrl) {
    return <img src={foundItem.imageUrl} alt={foundItem.title} loading="lazy" className={`object-cover ${className}`} />;
  }
  const Icon = category.icon;
  return (
    <div className={`tint relative grid place-items-center overflow-hidden ${className}`} style={{ "--h": category.hue } as CSSProperties} role="img" aria-label={`${t.categories[category.id]} (${t.item.noImage})`}>
      <div className="dot-grid absolute inset-0 opacity-[0.12]" aria-hidden />
      <div className="absolute -right-6 -bottom-8 size-32 rounded-full bg-current opacity-[0.07]" aria-hidden />
      <Icon className={`relative ${iconSize} drop-shadow-sm`} strokeWidth={1.6} />
    </div>
  );
}
