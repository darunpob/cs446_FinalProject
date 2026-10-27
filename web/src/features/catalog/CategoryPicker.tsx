import type { CSSProperties } from "react";
import type { CategoryId } from "../../api/contract";
import { CATEGORIES } from "./categories";

interface CategoryPickerProps {
  value: CategoryId | null;
  onChange: (category: CategoryId) => void;
  invalid?: boolean;
  labelledBy?: string;
}

export function CategoryPicker({ value, onChange, invalid = false, labelledBy }: CategoryPickerProps) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} aria-invalid={invalid} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CATEGORIES.map(({ id, label, icon: Icon, hue }) => {
        const selected = value === id;
        const ring = selected ? "border-brand ring-4 ring-brand/15 bg-brand-soft/60" : invalid ? "border-danger/60" : "border-line hover:border-line-strong";
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(id)}
            className={`flex cursor-pointer flex-col items-start gap-2 rounded-2xl border bg-surface p-3 text-left text-sm font-medium transition-[border-color,box-shadow,background-color] duration-150 ${ring}`}
          >
            <span className="tint grid size-9 place-items-center rounded-xl" style={{ "--h": hue } as CSSProperties}>
              <Icon className="size-[18px]" />
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
