import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { useI18n } from "../../i18n/useI18n";

const ZOOM_SCALE = 2.5;
const SWIPE_THRESHOLD_PX = 48;

interface PhotoLightboxProps {
  title: string;
  imageUrls: string[];
  startIndex: number;
  onClose: () => void;
}

interface PanOrigin {
  x: number;
  y: number;
}

const CENTER: PanOrigin = { x: 50, y: 50 };

function useLightboxKeys(onClose: () => void, step: (delta: number) => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, step]);
}

function originFromPointer(event: MouseEvent<HTMLElement>): PanOrigin {
  const bounds = event.currentTarget.getBoundingClientRect();
  const clamp = (percent: number) => Math.min(100, Math.max(0, percent));
  return {
    x: clamp(((event.clientX - bounds.left) / bounds.width) * 100),
    y: clamp(((event.clientY - bounds.top) / bounds.height) * 100),
  };
}

/** Click or tap toggles zoom; while zoomed the pointer pans, otherwise a horizontal swipe reports a step of ±1. */
function useZoomPan() {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState<PanOrigin>(CENTER);
  const swipeStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  const reset = useCallback(() => {
    setZoomed(false);
    setOrigin(CENTER);
  }, []);
  const toggle = (event: MouseEvent<HTMLElement> | null) => {
    if (swiped.current) return;
    if (!zoomed && event) setOrigin(originFromPointer(event));
    if (zoomed) setOrigin(CENTER);
    setZoomed(!zoomed);
  };
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    swipeStartX.current = event.clientX;
    swiped.current = false;
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (zoomed) setOrigin(originFromPointer(event));
  };
  const swipeStep = (event: PointerEvent<HTMLElement>): number => {
    const startX = swipeStartX.current;
    swipeStartX.current = null;
    if (zoomed || startX === null) return 0;
    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return 0;
    swiped.current = true;
    return deltaX < 0 ? 1 : -1;
  };
  return { zoomed, origin, reset, toggle, onPointerDown, onPointerMove, swipeStep };
}

const ROUND_BUTTON =
  "grid size-11 cursor-pointer place-items-center rounded-full bg-ink/70 text-surface backdrop-blur-sm transition-[background-color,opacity] duration-150 hover:bg-ink disabled:cursor-default disabled:opacity-30";

export function PhotoLightbox({ title, imageUrls, startIndex, onClose }: PhotoLightboxProps) {
  const { t } = useI18n();
  const [shownIndex, setShownIndex] = useState(startIndex);
  const total = imageUrls.length;
  const zoom = useZoomPan();
  const { reset } = zoom;
  const showPhoto = useCallback((index: number) => {
    reset();
    setShownIndex((index + total) % total);
  }, [reset, total]);
  const step = useCallback((delta: number) => showPhoto(shownIndex + delta), [showPhoto, shownIndex]);
  useLightboxKeys(onClose, step);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${t.photo.viewerLabel}: ${title}`} className="fixed inset-0 z-50 flex animate-fade flex-col bg-board/95 text-surface">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <p className="min-w-0 truncate text-sm font-semibold">
          <span className="tabular-nums">{t.photo.counter(shownIndex + 1, total)}</span> · {title}
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => zoom.toggle(null)} aria-label={zoom.zoomed ? t.photo.zoomOut : t.photo.zoomIn} className={ROUND_BUTTON}>
            {zoom.zoomed ? <ZoomOut className="size-5" aria-hidden /> : <ZoomIn className="size-5" aria-hidden />}
          </button>
          <button type="button" onClick={onClose} aria-label={t.common.close} className={ROUND_BUTTON} autoFocus>
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <img
          src={imageUrls[shownIndex]}
          alt={t.photo.previewAlt(shownIndex + 1)}
          draggable={false}
          onClick={zoom.toggle}
          onPointerDown={zoom.onPointerDown}
          onPointerMove={zoom.onPointerMove}
          onPointerUp={(event) => { const delta = zoom.swipeStep(event); if (delta !== 0) step(delta); }}
          style={{ transform: `scale(${zoom.zoomed ? ZOOM_SCALE : 1})`, transformOrigin: `${zoom.origin.x}% ${zoom.origin.y}%` }}
          className={`size-full touch-none object-contain transition-transform duration-200 select-none ${zoom.zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        />
        {total > 1 && (
          <>
            <button type="button" onClick={() => step(-1)} aria-label={t.photo.previous} className={`${ROUND_BUTTON} absolute top-1/2 left-3 -translate-y-1/2`}>
              <ChevronLeft className="size-6" aria-hidden />
            </button>
            <button type="button" onClick={() => step(1)} aria-label={t.photo.next} className={`${ROUND_BUTTON} absolute top-1/2 right-3 -translate-y-1/2`}>
              <ChevronRight className="size-6" aria-hidden />
            </button>
          </>
        )}
      </div>
      {total > 1 && (
        <ul className="flex justify-center gap-2 overflow-x-auto px-4 py-3" aria-label={t.item.photosLabel}>
          {imageUrls.map((imageUrl, photoIndex) => (
            <li key={imageUrl} className="shrink-0">
              <button type="button" onClick={() => showPhoto(photoIndex)} aria-pressed={photoIndex === shownIndex} aria-label={t.photo.previewAlt(photoIndex + 1)}
                className={`block size-14 cursor-pointer overflow-hidden rounded-sm border-2 transition-[border-color,opacity] duration-150 ${photoIndex === shownIndex ? "border-stock-yellow" : "border-transparent opacity-60 hover:opacity-100"}`}>
                <img src={imageUrl} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body,
  );
}
