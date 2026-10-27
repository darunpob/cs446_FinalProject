import type { FormEvent } from "react";
import { CircleCheckBig, Clock3, EyeOff, Lightbulb, Lock, ShieldCheck, Store } from "lucide-react";
import type { FoundItem } from "../../api/contract";
import { Button, ButtonLink } from "../../design-system/Button";
import { Field, TextArea, TextInput } from "../../design-system/Field";
import { FormSection, PageHeading } from "../../design-system/FormSection";
import { Card, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { CategoryPicker } from "../catalog/CategoryPicker";
import { useDirectory } from "../catalog/DirectoryProvider";
import { PlaceSelect } from "../catalog/PlaceSelect";
import { ItemVisual } from "../items/ItemVisual";
import { PhotoPicker } from "./PhotoPicker";
import { useFoundReportForm } from "./useFoundReportForm";

function DropOffPicker({ value, onChange, error }: { value: string; onChange: (dropOffId: string) => void; error?: string }) {
  const { directory } = useDirectory();
  const { t } = useI18n();
  return (
    <div role="radiogroup" aria-label={t.reportFound.dropOffGroup} className="grid gap-2 sm:grid-cols-2">
      {directory.dropOffPoints.map((point) => {
        const selected = value === point.id;
        const ring = selected ? "border-brand ring-4 ring-brand/15 bg-brand-soft/60" : error ? "border-danger/60" : "border-line hover:border-line-strong";
        return (
          <button key={point.id} type="button" role="radio" aria-checked={selected} onClick={() => onChange(point.id)}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border bg-surface p-4 text-left transition-[border-color,box-shadow,background-color] duration-150 ${ring}`}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl transition-colors duration-150 ${selected ? "bg-brand text-white dark:text-bg" : "bg-surface-2 text-ink-2"}`}>
              <Store className="size-[18px]" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{point.name}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-3"><Clock3 className="size-3.5" /> {point.hours}</span>
            </span>
          </button>
        );
      })}
      {error && <p className="text-[13px] text-danger sm:col-span-2">{error}</p>}
    </div>
  );
}

function TipsAside() {
  const { t } = useI18n();
  const [photoTip, secretTip, dropOffTip] = t.reportFound.tips;
  const tips = [
    { icon: Lightbulb, text: photoTip },
    { icon: EyeOff, text: secretTip },
    { icon: ShieldCheck, text: dropOffTip },
  ];
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <Card className="p-5">
        <h2 className="font-display font-semibold">{t.reportFound.tipsTitle}</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {tips.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3 text-sm leading-relaxed text-ink-2">
              <Icon className="mt-0.5 size-[18px] shrink-0 text-accent" /> {text}
            </li>
          ))}
        </ul>
      </Card>
    </aside>
  );
}

function FoundSuccess({ foundItem, onAnother }: { foundItem: FoundItem; onAnother: () => void }) {
  const { dropOffPoint } = useDirectory();
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-lg animate-rise py-6 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-success-soft text-success">
        <CircleCheckBig className="size-8" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-bold">{t.reportFound.successTitle}</h1>
      <p className="mt-2 text-ink-2">
        {t.reportFound.successLead} <strong className="text-ink">{dropOffPoint(foundItem.dropOffPointId)?.name}</strong>
      </p>
      <Card className="mt-6 flex items-center gap-4 p-3 text-left">
        <ItemVisual foundItem={foundItem} iconSize="size-7" className="size-16 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{foundItem.title}</p>
          <p className="text-sm text-ink-3">{t.reportFound.itemRef} {foundItem.id}</p>
        </div>
      </Card>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <ButtonLink to={`/items/${foundItem.id}`} variant="secondary">{t.reportFound.viewPost}</ButtonLink>
        <Button onClick={onAnother}>{t.reportFound.reportAnother}</Button>
      </div>
    </div>
  );
}

export function ReportFoundPage() {
  const { draft, errors, setField, submit, submitting, failure, setFailure, created, reset } = useFoundReportForm();
  const { t } = useI18n();
  const text = t.reportFound;

  if (created) return <FoundSuccess foundItem={created} onAnother={reset} />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const accepted = await submit();
    if (!accepted) document.querySelector("[aria-invalid='true'], [role='alert']")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <PageHeading eyebrow={text.eyebrow} title={text.title} description={text.description} />
      <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          <FormSection step={1} title={text.step1Title} description={text.step1Description}>
            <PhotoPicker photo={draft.photo} onChange={(photo) => setField("photo", photo)} onReject={setFailure} />
            <Field label={text.titleLabel} error={errors.title}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.title)} value={draft.title} onChange={(event) => setField("title", event.target.value)} placeholder={text.titlePlaceholder} />}
            </Field>
            <div className="flex flex-col gap-1.5">
              <span id="found-category-label" className="text-sm font-medium">{text.categoryLabel}</span>
              <CategoryPicker value={draft.category} onChange={(category) => setField("category", category)} invalid={Boolean(errors.category)} labelledBy="found-category-label" />
              {errors.category && <p className="text-[13px] text-danger">{errors.category}</p>}
            </div>
            <Field label={text.descriptionLabel} optional hint={text.descriptionHint}>
              {(controlId, describedBy) => <TextArea id={controlId} aria-describedby={describedBy} value={draft.description} onChange={(event) => setField("description", event.target.value)} rows={3} />}
            </Field>
          </FormSection>

          <FormSection step={2} title={text.step2Title}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={text.locationLabel} error={errors.foundLocationId}>
                {(controlId, describedBy) => <PlaceSelect id={controlId} describedBy={describedBy} value={draft.foundLocationId} onChange={(placeId) => setField("foundLocationId", placeId)} invalid={Boolean(errors.foundLocationId)} placeholder={text.locationPlaceholder} />}
              </Field>
              <Field label={text.timeLabel} error={errors.foundAtLocal}>
                {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="datetime-local" invalid={Boolean(errors.foundAtLocal)} value={draft.foundAtLocal} onChange={(event) => setField("foundAtLocal", event.target.value)} />}
              </Field>
            </div>
          </FormSection>

          <FormSection step={3} title={text.step3Title} description={text.step3Description}>
            <DropOffPicker value={draft.dropOffPointId} onChange={(dropOffId) => setField("dropOffPointId", dropOffId)} error={errors.dropOffPointId} />
          </FormSection>

          <FormSection step={4} title={text.step4Title} description={text.step4Description}>
            <Field label={text.questionLabel} error={errors.verificationQuestion}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.verificationQuestion)} value={draft.verificationQuestion} onChange={(event) => setField("verificationQuestion", event.target.value)} placeholder={text.questionPlaceholder} />}
            </Field>
            <div className="-mt-2 flex flex-wrap gap-2">
              {text.questionIdeas.map((idea) => (
                <button key={idea} type="button" onClick={() => setField("verificationQuestion", idea)} className="cursor-pointer rounded-full border border-dashed border-line-strong px-3 py-1 text-[13px] text-ink-2 transition-colors duration-150 hover:border-brand hover:text-brand-ink">
                  + {idea}
                </button>
              ))}
            </div>
            <Field label={text.answerLabel} error={errors.verificationAnswer} hint={text.answerHint}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.verificationAnswer)} value={draft.verificationAnswer} onChange={(event) => setField("verificationAnswer", event.target.value)} leading={<Lock className="size-4" />} autoComplete="off" />}
            </Field>
          </FormSection>

          {failure && <ErrorNotice message={failure} />}
          <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto sm:self-end sm:px-10">
            {submitting ? text.submitting : text.submit}
          </Button>
        </div>
        <TipsAside />
      </form>
    </>
  );
}
