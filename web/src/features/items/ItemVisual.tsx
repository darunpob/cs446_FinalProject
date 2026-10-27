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
    return <img src={foundItem.imageUrl} alt={foundItem.title} loading="lazy" className={`bg-surface-2 object-cover ${className}`} />;
  }
  const Icon = category.icon;
  return (
    <div className={`grid place-items-center bg-surface-2 text-ink-2 ${className}`} role="img" aria-label={`${t.categories[category.id]} (${t.item.noImage})`}>
      <span className={`grid size-full place-items-center ${category.stockWash}`}>
        <Icon className={iconSize} strokeWidth={1.5} aria-hidden />
      </span>
    </div>
  );
}
