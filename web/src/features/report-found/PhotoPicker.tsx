import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Camera, ImagePlus, Plus, TriangleAlert, X } from "lucide-react";
import { MAX_PHOTOS } from "../../api/contract";
import { messages } from "../../i18n/locale";
import { useI18n } from "../../i18n/useI18n";
import { Button } from "../../design-system/Button";
import { MAX_SOURCE_BYTES } from "./photoCompression";

interface PhotoPickerProps {
  photos: File[];
  onChange: (photos: File[]) => void;
  onReject: (reason: string) => void;
}

/** Keeps every acceptable file up to the photo limit and reports the first reason anything was left out. */
function acceptFiles(current: File[], incoming: File[], onChange: (photos: File[]) => void, onReject: (reason: string) => void) {
  const text = messages().photo;
  const images = incoming.filter((file) => file.type.startsWith("image/"));
  const sized = images.filter((file) => file.size <= MAX_SOURCE_BYTES);
  const room = MAX_PHOTOS - current.length;
  const accepted = sized.slice(0, Math.max(room, 0));
  if (accepted.length > 0) onChange([...current, ...accepted]);
  if (images.length < incoming.length) onReject(text.onlyImages);
  else if (sized.length < images.length) onReject(text.tooLarge);
  else if (accepted.length < sized.length) onReject(text.limit(MAX_PHOTOS));
}

function usePreviewUrls(photos: File[]): string[] {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  useEffect(() => {
    const objectUrls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviewUrls(objectUrls);
    return () => objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
  }, [photos]);
  return previewUrls;
}

/** Shows why files were left out right under the photo field's label, where the person is looking. */
export function PhotoPicker({ photos, onChange }: Omit<PhotoPickerProps, "onReject">) {
  const [rejection, setRejection] = useState<string | null>(null);
  const handleChange = (next: File[]) => {
    setRejection(null);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      {rejection && (
        <p role="alert" className="flex items-start gap-2 rounded-sm bg-danger-soft px-3 py-2 text-[13px] leading-relaxed font-semibold text-danger">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {rejection}
        </p>
      )}
      <PhotoDropZone photos={photos} onChange={handleChange} onReject={setRejection} />
    </div>
  );
}

function PhotoDropZone({ photos, onChange, onReject }: PhotoPickerProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = usePreviewUrls(photos);
  const [dragging, setDragging] = useState(false);
  const full = photos.length >= MAX_PHOTOS;

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFiles(photos, Array.from(event.target.files ?? []), onChange, onReject);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    acceptFiles(photos, Array.from(event.dataTransfer.files), onChange, onReject);
  };

  const removeAt = (photoIndex: number) => onChange(photos.filter((_, index) => index !== photoIndex));

  const dropHandlers = {
    onDragOver: (event: DragEvent) => { event.preventDefault(); setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: handleDrop,
  };

  const picker = <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleInput} aria-label={t.photo.pickLabel} />;

  if (photos.length > 0) {
    return (
      <div {...dropHandlers} className={`rounded-md border-2 border-dashed p-2.5 transition-colors duration-150 ${dragging ? "border-ink bg-stock-mint/40" : "border-line-strong"}`}>
        {picker}
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {photos.map((photo, photoIndex) => (
            <li key={`${photo.name}-${photo.lastModified}-${photoIndex}`} className="relative overflow-hidden rounded-sm bg-surface-2">
              {previewUrls[photoIndex] && <img src={previewUrls[photoIndex]} alt={t.photo.previewAlt(photoIndex + 1)} className="aspect-square w-full object-cover" />}
              {photoIndex === 0 && <span className="absolute top-1.5 left-1.5 rounded-sm bg-ink px-1.5 py-0.5 text-[11px] font-bold text-surface">{t.photo.cover}</span>}
              <button type="button" onClick={() => removeAt(photoIndex)} aria-label={t.photo.removeAt(photoIndex + 1)}
                className="absolute top-1.5 right-1.5 grid size-8 cursor-pointer place-items-center rounded-full bg-ink/80 text-surface transition-colors duration-150 hover:bg-danger">
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
          {!full && (
            <li>
              <button type="button" onClick={() => inputRef.current?.click()}
                className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border-2 border-dashed border-line-strong text-sm font-semibold text-ink-2 transition-colors duration-150 hover:border-ink hover:text-ink">
                <Plus className="size-6" aria-hidden /> {t.photo.addMore}
              </button>
            </li>
          )}
        </ul>
        <p className="mt-2 text-right text-xs text-ink-3 tabular-nums">{photos.length}/{MAX_PHOTOS}</p>
      </div>
    );
  }

  return (
    <div {...dropHandlers}
      className={`flex flex-col items-center gap-3 rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 ${dragging ? "border-ink bg-stock-mint/40" : "border-line-strong"}`}
    >
      {picker}
      <span className="grid size-14 place-items-center rounded-sm bg-stock-mint text-stock-ink">
        <ImagePlus className="size-7" aria-hidden />
      </span>
      <div>
        <p className="font-semibold">{t.photo.dropHere}</p>
        <p className="mt-1 text-sm text-ink-3">{t.photo.formats(MAX_PHOTOS)}</p>
      </div>
      <Button variant="secondary" onClick={() => inputRef.current?.click()} icon={<Camera className="size-4" aria-hidden />} className="mt-1">
        {t.photo.choose}
      </Button>
    </div>
  );
}
