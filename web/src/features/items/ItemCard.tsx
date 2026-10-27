import { Link } from "react-router";
import { Clock3, MapPin } from "lucide-react";
import type { FoundItem } from "../../api/contract";
import { Badge } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { STATUS_TONES } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatRelative } from "../catalog/thaiTime";
import { ItemVisual } from "./ItemVisual";

export function ItemCard({ foundItem, index = 0 }: { foundItem: FoundItem; index?: number }) {
  const { placeName } = useDirectory();
  const { t } = useI18n();
  const dimmed = foundItem.status === "returned" ? "opacity-70 saturate-50" : "";
  return (
    <Link
      to={`/items/${foundItem.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className={`group flex animate-rise flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift ${dimmed}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ItemVisual foundItem={foundItem} className="size-full transition-transform duration-500 group-hover:scale-[1.04]" />
        <Badge tone={STATUS_TONES[foundItem.status]} className="absolute top-2 left-2 px-2 py-0.5 text-[11px] shadow-card backdrop-blur sm:top-3 sm:left-3 sm:px-2.5 sm:py-1 sm:text-xs">
          {t.status[foundItem.status]}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        <span className="truncate text-[11px] font-medium text-ink-3 sm:text-xs">{t.categories[foundItem.category]}</span>
        <h3 className="line-clamp-2 font-display text-[15px] leading-snug font-semibold transition-colors duration-150 group-hover:text-brand-ink sm:text-[17px]">
          {foundItem.title}
        </h3>
        <div className="mt-auto flex flex-col gap-1 pt-1.5 text-xs text-ink-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:pt-2 sm:text-[13px]">
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-ink-3" /> <span className="truncate">{placeName(foundItem.foundLocationId)}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <Clock3 className="size-3.5 shrink-0 text-ink-3" /> <span className="truncate">{formatRelative(foundItem.foundAt)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="skeleton aspect-[4/3]" />
      <div className="flex flex-col gap-3 p-3 sm:p-4">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-5 w-4/5 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}
