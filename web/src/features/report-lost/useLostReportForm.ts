import { useState } from "react";
import { api } from "../../api/client";
import { DESCRIPTION_MAX_LENGTH, REWARD_MAX_BAHT, REWARD_MIN_BAHT, isUniversityEmail } from "../../api/contract";
import type { CategoryId, LostReportReceipt } from "../../api/contract";
import { describeError } from "../../api/errors";
import { messages } from "../../i18n/locale";
import { fromLocalInputValue, toLocalInputValue } from "../catalog/thaiTime";
import { uploadPhotos } from "../report-found/photoCompression";
import { titleError } from "../report-found/useFoundReportForm";

export interface LostReportDraft {
  title: string;
  category: CategoryId | null;
  description: string;
  photos: File[];
  lastSeenLocationId: string;
  lostAtLocal: string;
  studentId: string;
  name: string;
  lineId: string;
  phone: string;
  email: string;
  /** Whole baht as typed; "" or "0" means no reward. */
  reward: string;
}

export type LostReportErrors = Partial<Record<keyof LostReportDraft, string>>;

const PHONE_PATTERN = /^0\d{8,9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_ID_PATTERN = /^\d{10}$/;

type LostReportText = ReturnType<typeof messages>["reportLost"];

function blankDraft(name = "", email = ""): LostReportDraft {
  return { title: "", category: null, description: "", photos: [], lastSeenLocationId: "", lostAtLocal: toLocalInputValue(new Date()), studentId: "", name, lineId: "", phone: "", email, reward: "" };
}

function emailError(email: string, text: LostReportText): string | undefined {
  if (!email) return text.emailRequired;
  if (!EMAIL_PATTERN.test(email)) return text.emailInvalid;
  return isUniversityEmail(email) ? undefined : text.emailNotUniversity;
}

function contactErrors(draft: LostReportDraft): LostReportErrors {
  const phone = draft.phone.replace(/[\s-]/g, "");
  const studentId = draft.studentId.trim();
  const text = messages().reportLost;
  return {
    email: emailError(draft.email.trim(), text),
    phone: phone && !PHONE_PATTERN.test(phone) ? text.phoneInvalid : undefined,
    studentId: studentId && !STUDENT_ID_PATTERN.test(studentId) ? text.studentIdInvalid : undefined,
  };
}

export function rewardAmountOf(draft: LostReportDraft): number {
  return draft.reward.trim() ? Number(draft.reward.trim()) : 0;
}

function rewardError(draft: LostReportDraft): string | undefined {
  const amount = rewardAmountOf(draft);
  if (amount === 0) return undefined;
  const inRange = Number.isInteger(amount) && amount >= REWARD_MIN_BAHT && amount <= REWARD_MAX_BAHT;
  return inRange ? undefined : messages().errors.rewardInvalid(REWARD_MIN_BAHT, REWARD_MAX_BAHT);
}

export function validateLostReport(draft: LostReportDraft): LostReportErrors {
  const text = messages();
  const checks: LostReportErrors = {
    title: titleError(draft.title, text.reportLost.titleTooShort),
    description: draft.description.trim().length > DESCRIPTION_MAX_LENGTH ? text.errors.tooLong(text.errors.fields.description, DESCRIPTION_MAX_LENGTH) : undefined,
    category: draft.category ? undefined : text.reportFound.categoryRequired,
    lastSeenLocationId: draft.lastSeenLocationId ? undefined : text.reportLost.locationRequired,
    lostAtLocal: draft.lostAtLocal ? undefined : text.reportLost.timeRequired,
    name: draft.name.trim() ? undefined : text.reportLost.nameRequired,
    ...contactErrors(draft),
    reward: rewardError(draft),
  };
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message)) as LostReportErrors;
}

/**
 * A report with a reward goes straight on to the gateway's checkout, so the owner pays while still on the form.
 * Returns false when checkout could not start; the receipt then offers the pay button instead.
 */
async function startCheckoutFor(issued: LostReportReceipt): Promise<boolean> {
  if (issued.reward?.status !== "awaiting_payment") return false;
  try {
    const { checkoutUrl } = await api.startRewardCheckout(issued.id);
    window.location.assign(checkoutUrl);
    return true;
  } catch (checkoutError) {
    console.warn("Reward checkout did not start; the receipt offers the pay button instead", checkoutError);
    return false;
  }
}

export function useLostReportForm(initialName: string, initialEmail: string) {
  const [draft, setDraft] = useState<LostReportDraft>(() => blankDraft(initialName, initialEmail));
  const [errors, setErrors] = useState<LostReportErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<LostReportReceipt | null>(null);

  const setField = <Field extends keyof LostReportDraft>(field: Field, value: LostReportDraft[Field]) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const submit = async () => {
    const nextErrors = validateLostReport(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !draft.category) return false;
    setSubmitting(true);
    setFailure(null);
    try {
      const imageKeys = await uploadPhotos(draft.photos);
      const issued = await api.createLostReport({
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        lastSeenLocationId: draft.lastSeenLocationId,
        lostAt: fromLocalInputValue(draft.lostAtLocal),
        imageKeys,
        studentId: draft.studentId.trim(),
        contact: { name: draft.name.trim(), lineId: draft.lineId.trim(), phone: draft.phone.replace(/[\s-]/g, ""), email: draft.email.trim() },
        rewardAmount: rewardAmountOf(draft),
      });
      if (await startCheckoutFor(issued)) return true;
      setReceipt(issued);
      setSubmitting(false);
      return true;
    } catch (submitError) {
      setFailure(describeError(submitError));
      setSubmitting(false);
      return false;
    }
  };

  return { draft, errors, setField, submit, submitting, failure, setFailure, receipt };
}
