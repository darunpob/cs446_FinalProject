import type { CategoryId } from "../../api/contract";
import { useI18n } from "../../i18n/useI18n";
import { CATEGORIES } from "./categories";

interface CategoryPickerProps {
  value: CategoryId | null;
  onChange: (category: CategoryId) => void;
  invalid?: boolean;
  labelledBy?: string;
}

export function CategoryPicker({ value, onChange, invalid = false, labelledBy }: CategoryPickerProps) {
  const { t } = useI18n();
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} aria-invalid={invalid} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CATEGORIES.map(({ id, icon: Icon, stock }) => {
        const selected = value === id;
        const state = selected
          ? `${stock} border-ink text-stock-ink`
          : `bg-field text-ink ${invalid ? "border-danger" : "border-line-strong hover:border-ink-3"}`;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(id)}
            className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-md border-2 px-3 py-2 text-left text-sm font-semibold transition-[border-color,background-color,box-shadow] duration-150 ${state}`}
          >
            <span className={`grid size-7 shrink-0 place-items-center rounded-sm ${selected ? "bg-surface/50" : stock}`}>
              <Icon className="size-4 text-stock-ink" aria-hidden />
            </span>
            {t.categories[id]}
          </button>
        );
      })}
    </div>
  );
}
