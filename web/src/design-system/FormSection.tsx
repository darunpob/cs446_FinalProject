import type { ReactNode } from "react";
import { Card } from "./Surface";

/** Card-stock colour each top-level route owns; page titles are cut from it. */
export const ROUTE_STOCK = {
  found: "bg-stock-yellow",
  lost: "bg-stock-pink",
  reportFound: "bg-stock-mint",
  guard: "bg-stock-sky",
  account: "bg-stock-sand",
} as const;

export type RouteStock = keyof typeof ROUTE_STOCK;

interface FormSectionProps {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ step, title, description, children }: FormSectionProps) {
  return (
    <Card className="p-5 sm:p-7">
      <header className="mb-5 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-ink text-sm font-bold text-surface tabular-nums">{step}</span>
        <div>
          <h2 className="text-lg leading-8 font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
        </div>
      </header>
      <div className="flex flex-col gap-5">{children}</div>
    </Card>
  );
}

export function PageHeading({ stock, title, description }: { stock: RouteStock; title: string; description?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <h1 className={`inline-block -rotate-1 rounded-sm px-5 py-2 font-display text-3xl leading-snug text-stock-ink shadow-paper sm:text-4xl ${ROUTE_STOCK[stock]}`}>
        {title}
      </h1>
      {description && <p className="mt-4 leading-relaxed text-on-felt-2">{description}</p>}
    </div>
  );
}
