import { MIN_PASSWORD_LENGTH, isUniversityEmail } from "../../api/contract";
import { messages } from "../../i18n/locale";

export interface RegisterDraft {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegisterErrors = Partial<Record<keyof RegisterDraft, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailError(email: string): string | undefined {
  const text = messages().reportLost;
  if (!email) return text.emailRequired;
  if (!EMAIL_PATTERN.test(email)) return text.emailInvalid;
  return isUniversityEmail(email) ? undefined : text.emailNotUniversity;
}

export function passwordErrors(password: string, confirmPassword: string): Pick<RegisterErrors, "password" | "confirmPassword"> {
  const text = messages();
  return {
    password: password.length < MIN_PASSWORD_LENGTH ? text.errors.passwordTooShort(MIN_PASSWORD_LENGTH) : undefined,
    confirmPassword: confirmPassword !== password ? text.register.passwordMismatch : undefined,
  };
}

export function validateRegistration(draft: RegisterDraft): RegisterErrors {
  const checks: RegisterErrors = {
    displayName: draft.displayName.trim() ? undefined : messages().errors.required(messages().errors.fields.displayName),
    email: emailError(draft.email.trim()),
    ...passwordErrors(draft.password, draft.confirmPassword),
  };
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message)) as RegisterErrors;
}
