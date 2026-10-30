import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { CategoryId } from "../../api/contract";
import { useI18n } from "../../i18n/useI18n";
import { ItemVisual } from "./ItemVisual";

interface PhotoGalleryProps {
  title: string;
  category: CategoryId;
  imageUrls: string[];
  cardNumberMasked?: boolean;
  className?: string;
  iconSize?: string;
}

/** Large photo with a thumbnail strip; falls back to the category placeholder when there are no photos. */
export function PhotoGallery({ title, category, imageUrls, cardNumberMasked = false, className = "", iconSize }: PhotoGalleryProps) {
  const { t } = useI18n();
  const [shownIndex, setShownIndex] = useState(0);
  const shownUrl = imageUrls[Math.min(shownIndex, imageUrls.length - 1)] ?? null;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <ItemVisual foundItem={{ category, title, imageUrl: shownUrl }} iconSize={iconSize} className={`w-full rounded-sm ${className}`} />
        {cardNumberMasked && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-sm bg-ink/85 px-2 py-1 text-xs font-semibold text-surface">
            <ShieldCheck className="size-3.5" aria-hidden /> {t.item.cardMasked}
          </span>
        )}
      </div>
      {imageUrls.length > 1 && (
        <ul className="grid grid-cols-4 gap-2" aria-label={t.item.photosLabel}>
          {imageUrls.map((imageUrl, photoIndex) => {
            const selected = imageUrl === shownUrl;
            return (
              <li key={imageUrl}>
                <button type="button" onClick={() => setShownIndex(photoIndex)} aria-pressed={selected} aria-label={t.photo.previewAlt(photoIndex + 1)}
                  className={`block w-full cursor-pointer overflow-hidden rounded-sm border-2 transition-[border-color,opacity] duration-150 ${selected ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}>
                  <img src={imageUrl} alt="" loading="lazy" className="aspect-square w-full bg-surface-2 object-cover" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
