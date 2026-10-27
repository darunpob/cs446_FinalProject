import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "../i18n/useI18n";

const CONTROL =
  "w-full rounded-lg border bg-field px-3.5 text-[15px] text-ink placeholder:text-ink-3 " +
  "transition-[border-color,box-shadow] duration-150 outline-none " +
  "focus:border-ink focus:ring-4 focus:ring-stock-yellow/60";

function controlClass(hasError: boolean, extra = ""): string {
  return `${CONTROL} ${hasError ? "border-danger" : "border-line-strong hover:border-ink-3"} ${extra}`;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (controlId: string, describedBy: string | undefined) => ReactNode;
}

export function Field({ label, hint, error, optional, children }: FieldProps) {
  const { t } = useI18n();
  const controlId = useId();
  const messageId = `${controlId}-message`;
  const message = error ?? hint;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={controlId} className="flex items-baseline gap-2 text-sm font-semibold text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-ink-3">{t.common.optional}</span>}
      </label>
      {children(controlId, message ? messageId : undefined)}
      {message && (
        <p id={messageId} className={`text-[13px] ${error ? "text-danger" : "text-ink-3"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leading?: ReactNode;
}

export function TextInput({ invalid = false, leading, className = "", ...rest }: TextInputProps) {
  if (!leading) return <input className={controlClass(invalid, `h-11 ${className}`)} aria-invalid={invalid} {...rest} />;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-3">{leading}</span>
      <input className={controlClass(invalid, `h-11 pl-10 ${className}`)} aria-invalid={invalid} {...rest} />
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function TextArea({ invalid = false, className = "", ...rest }: TextAreaProps) {
  return <textarea className={controlClass(invalid, `min-h-24 py-3 leading-relaxed ${className}`)} aria-invalid={invalid} {...rest} />;
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function SelectInput({ invalid = false, className = "", children, ...rest }: SelectInputProps) {
  return (
    <div className="relative">
      <select className={controlClass(invalid, `h-11 cursor-pointer appearance-none pr-10 ${className}`)} aria-invalid={invalid} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
    </div>
  );
}
