import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, X } from "lucide-react";
import type { FoundItemStatus } from "../api/contract";
import { useI18n } from "../i18n/useI18n";

/** A sheet of paper on the board; `pinned` adds the red push-pin at its top edge. */
export function Card({ className = "", pinned = false, children }: { className?: string; pinned?: boolean; children: ReactNode }) {
  return (
    <div className={`paper relative rounded-md shadow-paper ${className}`}>
      {pinned && <span className="pin" aria-hidden />}
      {children}
    </div>
  );
}

type Tone = "stamp" | "verify" | "success" | "warn" | "danger" | "neutral";

const TONES: Record<Tone, string> = {
  stamp: "bg-stamp-soft text-stamp",
  verify: "bg-verify-soft text-verify",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-2 text-ink-2",
};

export function Badge({ tone = "neutral", icon, children, className = "" }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}

const STAMP_SHAPES: Record<FoundItemStatus, string> = {
  available: "rounded-full text-stamp",
  claimed: "rounded-sm text-verify",
  returned: "rounded-sm text-ink-3 line-through decoration-2",
};

const STAMP_SIZES = {
  sm: "px-1.5 py-px text-[11px] sm:px-2 sm:text-xs",
  md: "px-2.5 py-0.5 text-sm",
  lg: "px-3.5 py-1 text-lg",
};

/** Status as an ink stamp: round = waiting for owner, square = verified, struck = returned. */
export function StatusStamp({ status, size = "md", pressed = false, className = "" }: { status: FoundItemStatus; size?: keyof typeof STAMP_SIZES; pressed?: boolean; className?: string }) {
  const { t } = useI18n();
  return (
    <span className={`stamp ${STAMP_SHAPES[status]} ${STAMP_SIZES[size]} ${pressed ? "animate-stamp" : ""} ${className}`}>
      {t.status[status]}
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-on-felt-2">
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label ?? t.common.loading}…</span>
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card pinned className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 pt-10 pb-8 text-center">
      <div className="grid size-14 place-items-center rounded-md bg-stock-sand/50 text-ink-2">{icon}</div>
      <h2 className="font-display text-xl">{title}</h2>
      {description && <p className="max-w-sm text-sm leading-relaxed text-ink-2">{description}</p>}
      {action}
    </Card>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="paper flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-danger px-4 py-3 text-sm font-medium text-danger shadow-paper">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="cursor-pointer rounded px-2 py-1 font-semibold underline transition-colors duration-150 hover:bg-danger-soft">
          {t.common.retry}
        </button>
      )}
    </div>
  );
}

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Dialog({ open, title, onClose, children }: DialogProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    panelRef.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade bg-board/75" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="paper relative max-h-[92dvh] w-full animate-sheet overflow-y-auto rounded-t-xl p-6 pt-8 shadow-sheet sm:max-w-lg sm:rounded-lg"
      >
        <div className="absolute inset-x-0 top-0 h-2 bg-stock-yellow" aria-hidden />
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl leading-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label={t.common.close} className="-m-1 grid size-10 shrink-0 cursor-pointer place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
