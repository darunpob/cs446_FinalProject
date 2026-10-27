import { useState } from "react";
import { api } from "../../api/client";
import type { CategoryId, LostReportReceipt } from "../../api/contract";
import { describeError } from "../../api/errors";
import { fromLocalInputValue, toLocalInputValue } from "../catalog/thaiTime";

export interface LostReportDraft {
  title: string;
  category: CategoryId | null;
  description: string;
  lastSeenLocationId: string;
  lostAtLocal: string;
  name: string;
  lineId: string;
  phone: string;
  email: string;
}

export type LostReportErrors = Partial<Record<keyof LostReportDraft | "contact", string>>;

const PHONE_PATTERN = /^0\d{8,9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function blankDraft(name = "", email = ""): LostReportDraft {
  return { title: "", category: null, description: "", lastSeenLocationId: "", lostAtLocal: toLocalInputValue(new Date()), name, lineId: "", phone: "", email };
}

function contactErrors(draft: LostReportDraft): LostReportErrors {
  const phone = draft.phone.replace(/[\s-]/g, "");
  return {
    contact: draft.lineId.trim() || phone || draft.email.trim() ? undefined : "ใส่ช่องทางติดต่ออย่างน้อย 1 ช่องทาง",
    phone: phone && !PHONE_PATTERN.test(phone) ? "เบอร์โทรไม่ถูกต้อง" : undefined,
    email: draft.email.trim() && !EMAIL_PATTERN.test(draft.email.trim()) ? "อีเมลไม่ถูกต้อง" : undefined,
  };
}

export function validateLostReport(draft: LostReportDraft): LostReportErrors {
  const checks: LostReportErrors = {
    title: draft.title.trim().length < 3 ? "บอกว่าหายอะไร อย่างน้อย 3 ตัวอักษร" : undefined,
    category: draft.category ? undefined : "เลือกหมวดหมู่",
    lastSeenLocationId: draft.lastSeenLocationId ? undefined : "เลือกบริเวณที่น่าจะหาย",
    lostAtLocal: draft.lostAtLocal ? undefined : "ระบุเวลาโดยประมาณ",
    name: draft.name.trim() ? undefined : "กรอกชื่อของคุณ",
    ...contactErrors(draft),
  };
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message)) as LostReportErrors;
}

export function useLostReportForm(initialName: string, initialEmail: string) {
  const [draft, setDraft] = useState<LostReportDraft>(() => blankDraft(initialName, initialEmail));
  const [errors, setErrors] = useState<LostReportErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<LostReportReceipt | null>(null);

  const setField = <Field extends keyof LostReportDraft>(field: Field, value: LostReportDraft[Field]) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined, contact: undefined }));
  };

  const submit = async () => {
    const nextErrors = validateLostReport(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !draft.category) return false;
    setSubmitting(true);
    setFailure(null);
    try {
      const issued = await api.createLostReport({
        title: draft.title,
        description: draft.description,
        category: draft.category,
        lastSeenLocationId: draft.lastSeenLocationId,
        lostAt: fromLocalInputValue(draft.lostAtLocal),
        contact: { name: draft.name.trim(), lineId: draft.lineId.trim(), phone: draft.phone.replace(/[\s-]/g, ""), email: draft.email.trim() },
      });
      setReceipt(issued);
      return true;
    } catch (submitError) {
      setFailure(describeError(submitError));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { draft, errors, setField, submit, submitting, failure, receipt };
}
