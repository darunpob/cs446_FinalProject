import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Camera, ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { MAX_SOURCE_BYTES } from "./photoCompression";

interface PhotoPickerProps {
  photo: File | null;
  onChange: (photo: File | null) => void;
  onReject: (reason: string) => void;
}

function acceptFile(file: File | undefined, onChange: (photo: File) => void, onReject: (reason: string) => void) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return onReject("รองรับเฉพาะไฟล์รูปภาพ");
  if (file.size > MAX_SOURCE_BYTES) return onReject("ไฟล์ใหญ่เกิน 15 MB");
  onChange(file);
}

export function PhotoPicker({ photo, onChange, onReject }: PhotoPickerProps) {
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

  const picker = <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleInput} aria-label="เลือกรูปถ่าย" />;

  if (previewUrl) {
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-line">
        {picker}
        <img src={previewUrl} alt="ตัวอย่างรูปที่เลือก" className="aspect-[4/3] w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10">
          <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-white/90 px-3 text-sm font-medium text-gray-900 backdrop-blur transition-colors duration-150 hover:bg-white">
            <RefreshCw className="size-4" /> เปลี่ยนรูป
          </button>
          <button type="button" onClick={() => onChange(null)} aria-label="ลบรูป" className="grid size-9 cursor-pointer place-items-center rounded-xl bg-white/90 text-gray-900 backdrop-blur transition-colors duration-150 hover:bg-white hover:text-red-600">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 ${dragging ? "border-brand bg-brand-soft" : "border-line-strong bg-surface-2/50"}`}
    >
      {picker}
      <span className="grid size-14 place-items-center rounded-2xl bg-surface text-brand shadow-card">
        <ImagePlus className="size-7" />
      </span>
      <div>
        <p className="font-medium">ถ่ายรูปหรือลากรูปมาวางที่นี่</p>
        <p className="mt-1 text-sm text-ink-3">JPG, PNG หรือ HEIC ไม่เกิน 15 MB · ระบบจะย่อขนาดให้อัตโนมัติ</p>
      </div>
      <button type="button" onClick={() => inputRef.current?.click()} className="mt-1 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-surface px-4 text-sm font-medium shadow-card ring-1 ring-line-strong transition-[box-shadow,color] duration-150 hover:text-brand-ink hover:ring-brand/50">
        <Camera className="size-4" /> เลือกรูป
      </button>
    </div>
  );
}
