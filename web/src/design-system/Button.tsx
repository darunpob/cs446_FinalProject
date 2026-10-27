import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import type { LinkProps } from "react-router";
import { LoaderCircle } from "lucide-react";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger" | "success" | "mint";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap rounded-lg select-none " +
  "transition-[background-color,color,box-shadow,border-color,translate] duration-150 ease-out " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-action text-action-ink shadow-paper hover:bg-action-hover",
  secondary: "bg-field text-ink border border-line-strong hover:border-ink-3 hover:bg-surface-2",
  soft: "bg-surface-2 text-ink hover:bg-surface-3",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "bg-danger-soft text-danger hover:bg-danger hover:text-surface",
  success: "bg-success text-surface hover:brightness-110",
  mint: "bg-stock-mint text-stock-ink shadow-paper hover:brightness-105",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-13 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant, size, loading, icon, className = "", children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export function ButtonLink({ variant, size, icon, className = "", children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
