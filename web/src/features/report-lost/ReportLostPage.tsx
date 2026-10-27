import type { FormEvent } from "react";
import { AtSign, BellRing, IdCard, MailCheck, MessageCircle, Phone, Sparkles } from "lucide-react";
import type { CategoryId, LostReportReceipt } from "../../api/contract";
import { Button, ButtonLink } from "../../design-system/Button";
import { Field, TextArea, TextInput } from "../../design-system/Field";
import { FormSection, PageHeading } from "../../design-system/FormSection";
import { Card, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { useAuth } from "../auth/AuthProvider";
import { CategoryPicker } from "../catalog/CategoryPicker";
import { PlaceSelect } from "../catalog/PlaceSelect";
import { ItemCard, NOTICE_GRID } from "../items/ItemCard";
import { LINE_OA_URL, LineFollowCard } from "./LineFollowCard";
import { useLostReportForm } from "./useLostReportForm";

const CARD_HOLDING_CATEGORIES: CategoryId[] = ["card", "wallet"];

function LostReceipt({ receipt, email }: { receipt: LostReportReceipt; email: string }) {
  const matches = receipt.possibleMatches;
  const { t } = useI18n();
  const text = t.reportLost;
  return (
    <div>
      <Card pinned className="overflow-hidden">
        <div className="h-3 bg-stock-pink" aria-hidden />
        <div className="p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-sm bg-stock-pink text-stock-ink">
            <BellRing className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-4xl">{text.receiptTitle}</h1>
          <p className="mt-2 max-w-xl text-ink-2">
            {text.receiptNumber} <strong className="text-ink tabular-nums">{receipt.id}</strong> · {text.receiptLead}
          </p>
          <div role="note" className="mt-5 flex max-w-2xl gap-3 rounded-md border-2 border-warn bg-warn-soft p-4">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink">{text.confirmEmailTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{text.confirmEmailBody(email)}</p>
            </div>
          </div>
        </div>
      </Card>
      {LINE_OA_URL && <LineFollowCard reportId={receipt.id} />}
      <div className="mt-12 mb-5 flex items-center gap-2">
        <Sparkles className="size-5 text-stock-yellow" aria-hidden />
        <h2 className="font-display text-2xl">{matches.length > 0 ? text.mightBeYours : text.noMatches}</h2>
      </div>
      {matches.length > 0 ? (
        <div className={NOTICE_GRID}>
          {matches.map((foundItem) => <ItemCard key={foundItem.id} foundItem={foundItem} />)}
        </div>
      ) : (
        <p className="text-on-felt-2">{text.checkBack}</p>
      )}
      <ButtonLink to="/" variant="secondary" className="mt-8">{t.item.viewAll}</ButtonLink>
    </div>
  );
}

export function ReportLostPage() {
  const { session } = useAuth();
  const { draft, errors, setField, submit, submitting, failure, receipt } = useLostReportForm(session?.user.displayName ?? "", session?.user.email ?? "");
  const { t } = useI18n();
  const text = t.reportLost;

  if (receipt) return <LostReceipt receipt={receipt} email={draft.email.trim()} />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const accepted = await submit();
    if (!accepted) document.querySelector("[aria-invalid='true'], [role='alert']")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading stock="lost" title={text.title} description={text.description} />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <FormSection step={1} title={text.step1Title}>
          <Field label={text.whatLabel} error={errors.title}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.title)} value={draft.title} onChange={(event) => setField("title", event.target.value)} placeholder={text.whatPlaceholder} />}
          </Field>
          <div className="flex flex-col gap-1.5">
            <span id="lost-category-label" className="text-sm font-medium">{t.reportFound.categoryLabel}</span>
            <CategoryPicker value={draft.category} onChange={(category) => setField("category", category)} invalid={Boolean(errors.category)} labelledBy="lost-category-label" />
            {errors.category && <p className="text-[13px] text-danger">{errors.category}</p>}
          </div>
          <Field label={text.featuresLabel} optional hint={text.featuresHint}>
            {(controlId, describedBy) => <TextArea id={controlId} aria-describedby={describedBy} value={draft.description} onChange={(event) => setField("description", event.target.value)} rows={3} />}
          </Field>
          {draft.category && CARD_HOLDING_CATEGORIES.includes(draft.category) && (
            <Field label={text.studentIdLabel} optional error={errors.studentId} hint={text.studentIdHint}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.studentId)} value={draft.studentId} onChange={(event) => setField("studentId", event.target.value)} inputMode="numeric" maxLength={10} leading={<IdCard className="size-4" />} />}
            </Field>
          )}
        </FormSection>

        <FormSection step={2} title={text.step2Title}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={text.whereLabel} error={errors.lastSeenLocationId}>
              {(controlId, describedBy) => <PlaceSelect id={controlId} describedBy={describedBy} value={draft.lastSeenLocationId} onChange={(placeId) => setField("lastSeenLocationId", placeId)} invalid={Boolean(errors.lastSeenLocationId)} placeholder={t.reportFound.locationPlaceholder} />}
            </Field>
            <Field label={text.whenLabel} error={errors.lostAtLocal}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="datetime-local" invalid={Boolean(errors.lostAtLocal)} value={draft.lostAtLocal} onChange={(event) => setField("lostAtLocal", event.target.value)} />}
            </Field>
          </div>
        </FormSection>

        <FormSection step={3} title={text.step3Title} description={text.step3Description}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={text.nameLabel} error={errors.name}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.name)} value={draft.name} onChange={(event) => setField("name", event.target.value)} autoComplete="name" />}
            </Field>
            <Field label={text.emailLabel} error={errors.email} hint={text.emailHint}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="email" leading={<AtSign className="size-4" />} invalid={Boolean(errors.email)} value={draft.email} onChange={(event) => setField("email", event.target.value)} autoComplete="email" placeholder="name.surn@bumail.net" />}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={text.lineIdLabel} optional hint={text.lineIdHint}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} leading={<MessageCircle className="size-4" />} value={draft.lineId} onChange={(event) => setField("lineId", event.target.value)} />}
            </Field>
            <Field label={text.phoneLabel} optional error={errors.phone}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="tel" inputMode="tel" leading={<Phone className="size-4" />} invalid={Boolean(errors.phone)} value={draft.phone} onChange={(event) => setField("phone", event.target.value)} />}
            </Field>
          </div>
        </FormSection>

        {failure && <ErrorNotice message={failure} />}
        <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto sm:self-end sm:px-10">
          {submitting ? text.submitting : text.submit}
        </Button>
      </form>
    </div>
  );
}
