import { Link } from "react-router";
import { Clock3, MapPin } from "lucide-react";
import type { FoundItem } from "../../api/contract";
import { Badge } from "../../design-system/Surface";
import { STATUS_LABELS, categoryMeta } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatRelative } from "../catalog/thaiTime";
import { ItemVisual } from "./ItemVisual";

export function ItemCard({ foundItem, index = 0 }: { foundItem: FoundItem; index?: number }) {
  const { placeName } = useDirectory();
  const status = STATUS_LABELS[foundItem.status];
  const dimmed = foundItem.status === "returned" ? "opacity-70 saturate-50" : "";
  return (
    <Link
      to={`/items/${foundItem.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className={`group flex animate-rise flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift ${dimmed}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ItemVisual foundItem={foundItem} className="size-full transition-transform duration-500 group-hover:scale-[1.04]" />
        <Badge tone={status.tone} className="absolute top-3 left-3 shadow-card backdrop-blur">
          {status.label}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium text-ink-3">{categoryMeta(foundItem.category).label}</span>
        <h3 className="line-clamp-2 font-display text-[17px] leading-snug font-semibold transition-colors duration-150 group-hover:text-brand-ink">
          {foundItem.title}
        </h3>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[13px] text-ink-2">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-ink-3" /> {placeName(foundItem.foundLocationId)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock3 className="size-3.5 text-ink-3" /> {formatRelative(foundItem.foundAt)}
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
      <div className="flex flex-col gap-3 p-4">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-5 w-4/5 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}
