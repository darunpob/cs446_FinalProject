import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Camera, ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { messages } from "../../i18n/locale";
import { useI18n } from "../../i18n/useI18n";
import { Button } from "../../design-system/Button";
import { MAX_SOURCE_BYTES } from "./photoCompression";

interface PhotoPickerProps {
  photo: File | null;
  onChange: (photo: File | null) => void;
  onReject: (reason: string) => void;
}

function acceptFile(file: File | undefined, onChange: (photo: File) => void, onReject: (reason: string) => void) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return onReject(messages().photo.onlyImages);
  if (file.size > MAX_SOURCE_BYTES) return onReject(messages().photo.tooLarge);
  onChange(file);
}

export function PhotoPicker({ photo, onChange, onReject }: PhotoPickerProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!photo) return setPreviewUrl(null);
    const objectUrl = URL.createObjectURL(photo);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    acceptFile(event.target.files?.[0], onChange, onReject);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files[0], onChange, onReject);
  };

  const picker = <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleInput} aria-label={t.photo.pickLabel} />;

  if (previewUrl) {
    return (
      <div className="overflow-hidden rounded-md border-2 border-dashed border-line-strong">
        {picker}
        <img src={previewUrl} alt={t.photo.previewAlt} className="aspect-[4/3] w-full object-cover" />
        <div className="flex justify-end gap-2 border-t border-line-strong p-2.5">
          <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} icon={<RefreshCw className="size-4" aria-hidden />}>
            {t.photo.change}
          </Button>
          <Button size="sm" variant="danger" onClick={() => onChange(null)} aria-label={t.photo.remove} className="w-9 px-0">
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center gap-3 rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 ${dragging ? "border-ink bg-stock-mint/40" : "border-line-strong"}`}
    >
      {picker}
      <span className="grid size-14 place-items-center rounded-sm bg-stock-mint text-stock-ink">
        <ImagePlus className="size-7" aria-hidden />
      </span>
      <div>
        <p className="font-semibold">{t.photo.dropHere}</p>
        <p className="mt-1 text-sm text-ink-3">{t.photo.formats}</p>
      </div>
      <Button variant="secondary" onClick={() => inputRef.current?.click()} icon={<Camera className="size-4" aria-hidden />} className="mt-1">
        {t.photo.choose}
      </Button>
    </div>
  );
}
