import { Link } from "react-router";
import type { FoundItem } from "../../api/contract";
import { StatusStamp } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { categoryMeta, placeCode } from "../catalog/categories";
import { useDirectory } from "../catalog/DirectoryProvider";
import { formatRelative } from "../catalog/thaiTime";
import { ItemVisual } from "./ItemVisual";

/** A found item as a notice pinned to the board: card-stock header, photo, stamp. */
export function ItemCard({ foundItem }: { foundItem: FoundItem }) {
  const { placeName } = useDirectory();
  const { t } = useI18n();
  const category = categoryMeta(foundItem.category);
  const returned = foundItem.status === "returned";
  return (
    <Link
      to={`/items/${foundItem.id}`}
      className="paper group relative flex min-w-0 flex-col rounded-sm shadow-paper transition-[translate,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lifted"
    >
      <span className="pin" aria-hidden />
      <div className={`flex h-7 items-center justify-between gap-1 rounded-t-sm px-2 text-stock-ink sm:h-9 sm:px-3 ${category.stock}`}>
        <category.icon className="size-3.5 shrink-0 sm:size-4" aria-label={t.categories[category.id]} />
        <span className="truncate text-xs font-bold tabular-nums sm:text-sm">{placeCode(foundItem.foundLocationId)}</span>
      </div>
      <div className="relative">
        <ItemVisual foundItem={foundItem} iconSize="size-8 sm:size-12" className={`aspect-square w-full sm:aspect-[4/3] ${returned ? "opacity-60 grayscale" : ""}`} />
        <StatusStamp status={foundItem.status} size="sm" className="absolute right-1 bottom-1.5 sm:right-2 sm:bottom-2" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2 sm:gap-1.5 sm:p-3.5">
        <h3 className="line-clamp-2 text-[13px] leading-snug font-semibold underline-offset-2 group-hover:underline sm:text-base">
          {foundItem.title}
        </h3>
        <p className="mt-auto truncate text-xs text-ink-2 sm:text-sm">
          {placeName(foundItem.foundLocationId)}
          <span className="hidden sm:inline"> · {formatRelative(foundItem.foundAt)}</span>
        </p>
        <p className="truncate text-xs text-ink-3 sm:hidden">{formatRelative(foundItem.foundAt)}</p>
      </div>
    </Link>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="paper flex flex-col rounded-sm shadow-paper" aria-hidden>
      <div className="h-7 rounded-t-sm bg-surface-3 sm:h-9" />
      <div className="skeleton aspect-square sm:aspect-[4/3]" />
      <div className="flex flex-col gap-2 p-2 sm:p-3.5">
        <div className="skeleton h-4 w-4/5 rounded-sm" />
        <div className="skeleton h-3 w-2/3 rounded-sm" />
      </div>
    </div>
  );
}

export const NOTICE_GRID = "grid grid-cols-3 gap-x-2 gap-y-4 sm:gap-x-4 sm:gap-y-6 lg:gap-x-6 lg:gap-y-8";
