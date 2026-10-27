import { useState } from "react";
import type { FormEvent } from "react";
import { BadgeCheck, CircleHelp, Clock3, MapPin, Phone, ShieldAlert } from "lucide-react";
import { api } from "../../api/client";
import type { ClaimOutcome, FoundItem } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { Field, TextInput } from "../../design-system/Field";
import { Dialog, ErrorNotice } from "../../design-system/Surface";
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
  const checks: FormErrors = {
    answer: form.answer.trim() ? undefined : "กรุณาตอบคำถามยืนยัน",
    claimantName: form.claimantName.trim() ? undefined : "กรุณากรอกชื่อ-นามสกุล",
    studentId: STUDENT_ID_PATTERN.test(form.studentId.trim()) ? undefined : "รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก",
    contact: form.contact.trim() ? undefined : "กรุณากรอกช่องทางติดต่อ",
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
    <Dialog open={open} onClose={onClose} title={verified ? "ยืนยันสำเร็จ 🎉" : "ยืนยันว่านี่คือของคุณ"}>
      {verified ? (
        <PickupTicket pickupCode={verified.pickupCode} dropOffPointId={verified.dropOffPointId} onDone={onClose} />
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="rounded-2xl border border-brand/20 bg-brand-soft p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-brand-ink">
              <CircleHelp className="size-4" /> คำถามยืนยันจากผู้เก็บได้
            </div>
            <p className="mt-1.5 font-display text-lg font-semibold">{foundItem.verificationQuestion}</p>
          </div>
          {outcome?.status === "rejected" && (
            <div role="alert" className="flex gap-2 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
              <ShieldAlert className="size-5 shrink-0" />
              คำตอบยังไม่ตรง เหลือโอกาสอีก {outcome.attemptsLeft} ครั้ง
            </div>
          )}
          {failure && <ErrorNotice message={failure} />}
          <Field label="คำตอบของคุณ" error={errors.answer} hint="ตอบสั้น ๆ ตามที่จำได้ ระบบไม่สนตัวพิมพ์เล็ก/ใหญ่">
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.answer)} value={form.answer} onChange={(event) => setField("answer")(event.target.value)} autoComplete="off" />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ชื่อ-นามสกุล" error={errors.claimantName}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.claimantName)} value={form.claimantName} onChange={(event) => setField("claimantName")(event.target.value)} autoComplete="name" />}
            </Field>
            <Field label="รหัสนักศึกษา" error={errors.studentId}>
              {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.studentId)} value={form.studentId} onChange={(event) => setField("studentId")(event.target.value)} inputMode="numeric" maxLength={10} placeholder="16xxxxxxxx" />}
            </Field>
          </div>
          <Field label="ช่องทางติดต่อ" error={errors.contact} hint="LINE ID, เบอร์โทร หรืออีเมล">
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.contact)} value={form.contact} onChange={(event) => setField("contact")(event.target.value)} />}
          </Field>
          <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
            ส่งคำตอบ
          </Button>
        </form>
      )}
    </Dialog>
  );
}

function PickupTicket({ pickupCode, dropOffPointId, onDone }: { pickupCode: string; dropOffPointId: string; onDone: () => void }) {
  const { dropOffPoint } = useDirectory();
  const point = dropOffPoint(dropOffPointId);
  return (
    <div className="flex flex-col gap-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-accent p-6 text-center text-white">
        <div className="dot-grid absolute inset-0 opacity-15" aria-hidden />
        <BadgeCheck className="relative mx-auto size-8" />
        <p className="relative mt-2 text-sm opacity-90">รหัสรับของของคุณ</p>
        <p className="relative mt-1 font-display text-4xl font-bold tracking-[0.3em]">{pickupCode}</p>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl border border-line p-4 text-sm">
        <p className="flex items-center gap-2 font-medium"><MapPin className="size-4 text-brand" /> {point?.name ?? "จุดรับฝาก"}</p>
        {point && <p className="flex items-center gap-2 text-ink-2"><Clock3 className="size-4 text-ink-3" /> {point.hours}</p>}
        {point && <p className="flex items-center gap-2 text-ink-2"><Phone className="size-4 text-ink-3" /> {point.phone}</p>}
      </div>
      <p className="text-sm leading-relaxed text-ink-2">
        แสดงรหัสนี้พร้อม <strong className="text-ink">บัตรนักศึกษา</strong> ให้เจ้าหน้าที่ที่จุดรับฝาก เราส่งรายละเอียดไปทาง LINE ด้วยแล้ว
      </p>
      <Button onClick={onDone} variant="secondary" size="lg" className="w-full">เรียบร้อย</Button>
    </div>
  );
}
