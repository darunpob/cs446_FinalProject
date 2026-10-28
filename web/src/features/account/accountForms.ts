import type { ProfileUpdate } from "../../api/contract";
import { messages } from "../../i18n/locale";

export type ProfileErrors = Partial<Record<keyof ProfileUpdate, string>>;

const PHONE_PATTERN = /^0\d{8,9}$/;
const STUDENT_ID_PATTERN = /^\d{10}$/;

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

export function validateProfile(update: ProfileUpdate): ProfileErrors {
  const text = messages();
  const phone = normalizePhone(update.phone);
  const studentId = update.studentId.trim();
  const checks: ProfileErrors = {
    displayName: update.displayName.trim() ? undefined : text.errors.required(text.errors.fields.displayName),
    studentId: studentId && !STUDENT_ID_PATTERN.test(studentId) ? text.reportLost.studentIdInvalid : undefined,
    phone: phone && !PHONE_PATTERN.test(phone) ? text.reportLost.phoneInvalid : undefined,
  };
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message)) as ProfileErrors;
}
