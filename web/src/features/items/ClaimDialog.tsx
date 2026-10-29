import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import { CircleHelp, Clock3, MapPin, Phone, ShieldAlert } from "lucide-react";
import { api } from "../../api/client";
import type { ClaimOutcome, FoundItem } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { Field, TextInput } from "../../design-system/Field";
import { Dialog, ErrorNotice, StatusStamp } from "../../design-system/Surface";
import { messages } from "../../i18n/locale";
import { useI18n } from "../../i18n/useI18n";
import { useAuth } from "../auth/AuthProvider";
import { useDirectory } from "../catalog/DirectoryProvider";

interface ClaimForm {
  answer: string;
  claimantName: string;
  studentId: string;
  contact: string;
}

type FormErrors = Partial<Record<keyof ClaimForm, string>>;

const STUDENT_ID_PATTERN = /^\d{10}$/;

function validate(form: ClaimForm): FormErrors {
  const text = messages().claim;
  const checks: FormErrors = {
    answer: form.answer.trim() ? undefined : text.answerRequired,
    claimantName: form.claimantName.trim() ? undefined : text.nameRequired,
    studentId: STUDENT_ID_PATTERN.test(form.studentId.trim()) ? undefined : text.studentIdInvalid,
    contact: form.contact.trim() ? undefined : text.contactRequired,
  };
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message)) as FormErrors;
}

interface ClaimDialogProps {
  foundItem: FoundItem;
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function ClaimDialog({ foundItem, open, onClose, onVerified }: ClaimDialogProps) {
  const { session } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState<ClaimForm>({ answer: "", claimantName: session?.user.displayName ?? "", studentId: "", contact: session?.user.email ?? "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<ClaimOutcome | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const setField = (field: keyof ClaimForm) => (value: string) => setForm((previous) => ({ ...previous, [field]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    setFailure(null);
    try {
      const claimOutcome = await api.submitClaim({ itemId: foundItem.id, ...form });
      setOutcome(claimOutcome);
      if (claimOutcome.status === "verified") onVerified();
    } catch (claimError) {
      setFailure(describeError(claimError));
    } finally {
      setSubmitting(false);
    }
  };

  const verified = outcome?.status === "verified" ? outcome : null;
  return (
    <Dialog open={open} onClose={onClose} title={verified ? t.claim.titleVerified : t.claim.title}>
      {verified ? (
        <PickupTicket pickupCode={verified.pickupCode} dropOffPointId={verified.dropOffPointId} onDone={onClose} />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="rounded-sm bg-stock-yellow p-4 text-stock-ink shadow-paper">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <CircleHelp className="size-4" aria-hidden /> {t.claim.questionFromFinder}
            </div>
            <p className="mt-1.5 font-display text-xl leading-snug">{foundItem.verificationQuestion}</p>
          </div>
          {outcome?.status === "rejected" && (
            <div role="alert" className="flex gap-2 rounded-md bg-warn-soft px-4 py-3 text-sm font-medium text-warn">
              <ShieldAlert className="size-5 shrink-0" />
              {t.claim.wrongAnswer(outcome.attemptsLeft)}
            </div>
          )}
          {failure && <ErrorNotice message={failure} />}
          <Field label={t.claim.answerLabel} error={errors.answer} hint={t.claim.answerHint}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.answer)} value={form.answer} onChange={(event) => setField("answer")(event.target.value)} autoComplete="off" />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.claim.nameLabel} error={errors.claimantName}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.claimantName)} value={form.claimantName} onChange={(event) => setField("claimantName")(event.target.value)} autoComplete="name" />}
            </Field>
            <Field label={t.claim.studentIdLabel} error={errors.studentId}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.studentId)} value={form.studentId} onChange={(event) => setField("studentId")(event.target.value)} inputMode="numeric" maxLength={10} placeholder="16xxxxxxxx" />}
            </Field>
          </div>
          <Field label={t.claim.contactLabel} error={errors.contact} hint={t.claim.contactHint}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.contact)} value={form.contact} onChange={(event) => setField("contact")(event.target.value)} />}
          </Field>
          <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
            {t.claim.submit}
          </Button>
        </form>
      )}
    </Dialog>
  );
}

function PickupTicket({ pickupCode, dropOffPointId, onDone }: { pickupCode: string; dropOffPointId: string; onDone: () => void }) {
  const { dropOffPoint } = useDirectory();
  const point = dropOffPoint(dropOffPointId);
  const { session } = useAuth();
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-5">
      <div className="relative rounded-md border-2 border-dashed border-line-strong bg-surface-2 px-6 pt-5 pb-6 text-center">
        <p className="text-sm font-semibold text-ink-2">{t.claim.pickupCode}</p>
        <p className="mt-1 font-mono text-4xl font-bold tracking-[0.25em] tabular-nums">{pickupCode}</p>
        <StatusStamp status="claimed" size="lg" pressed className="absolute -top-4 -right-2 [--stamp-tilt:8deg]" />
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-line p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-ink-2" aria-hidden /> {point?.name ?? t.claim.dropOffFallback}</p>
        {point && <p className="flex items-center gap-2 text-ink-2 tabular-nums"><Clock3 className="size-4 text-ink-3" aria-hidden /> {point.hours}</p>}
        {point && <p className="flex items-center gap-2 text-ink-2 tabular-nums"><Phone className="size-4 text-ink-3" aria-hidden /> {point.phone}</p>}
      </div>
      <p className="text-sm leading-relaxed text-ink-2">
        {t.claim.pickupBefore} <strong className="text-ink">{t.claim.pickupStrong}</strong> {t.claim.pickupAfter}
      </p>
      {session && (
        <p className="text-sm text-ink-2">
          {t.claim.ticketSaved} <Link to="/my-reports" onClick={onDone} className="font-semibold text-ink underline underline-offset-2">{t.claim.ticketSavedLink}</Link>
        </p>
      )}
      <Button onClick={onDone} variant="secondary" size="lg" className="w-full">{t.claim.done}</Button>
    </div>
  );
}
