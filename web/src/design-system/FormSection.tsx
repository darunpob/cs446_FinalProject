import type { ReactNode } from "react";

interface FormSectionProps {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ step, title, description, children }: FormSectionProps) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-7">
      <header className="mb-5 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-ink font-display text-sm font-bold text-bg">{step}</span>
        <div>
          <h2 className="font-display text-lg leading-8 font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
        </div>
      </header>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-8 max-w-2xl animate-rise">
      <p className="text-sm font-semibold text-brand">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 leading-relaxed text-ink-2">{description}</p>
    </div>
  );
}
