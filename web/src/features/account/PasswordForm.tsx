import { useState } from "react";
import type { FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { api } from "../../api/client";
import { MIN_PASSWORD_LENGTH } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { Field, TextInput } from "../../design-system/Field";
import { Card, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { passwordErrors } from "../auth/registerForm";
import { SavedNotice } from "./SavedNotice";

interface PasswordDraft {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type PasswordErrors = Partial<Record<keyof PasswordDraft, string>>;

const BLANK_DRAFT: PasswordDraft = { currentPassword: "", newPassword: "", confirmPassword: "" };

function validatePasswordDraft(draft: PasswordDraft, requiredMessage: string): PasswordErrors {
  const { password, confirmPassword } = passwordErrors(draft.newPassword, draft.confirmPassword);
  const checks: PasswordErrors = { currentPassword: draft.currentPassword ? undefined : requiredMessage, newPassword: password, confirmPassword };
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message)) as PasswordErrors;
}

export function PasswordForm() {
  const { t } = useI18n();
  const text = t.account;
  const [draft, setDraft] = useState<PasswordDraft>(BLANK_DRAFT);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const setField = (field: keyof PasswordDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setChanged(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validatePasswordDraft(draft, t.errors.required(text.currentPassword));
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    setFailure(null);
    try {
      await api.changePassword({ currentPassword: draft.currentPassword, newPassword: draft.newPassword });
      setDraft(BLANK_DRAFT);
      setChanged(true);
    } catch (changeError) {
      setFailure(describeError(changeError));
    } finally {
      setSaving(false);
    }
  };

  const passwordField = (field: keyof PasswordDraft, label: string, autoComplete: string, hint?: string) => (
    <Field label={label} error={errors[field]} hint={hint}>
      {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="password" invalid={Boolean(errors[field])} value={draft[field]} onChange={(event) => setField(field, event.target.value)} leading={<KeyRound className="size-4" />} autoComplete={autoComplete} />}
    </Field>
  );

  return (
    <Card className="p-5 sm:p-7">
      <h2 className="text-lg font-semibold">{text.passwordTitle}</h2>
      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
        {failure && <ErrorNotice message={failure} />}
        {passwordField("currentPassword", text.currentPassword, "current-password")}
        <div className="grid gap-4 sm:grid-cols-2">
          {passwordField("newPassword", text.newPassword, "new-password", t.register.passwordHint(MIN_PASSWORD_LENGTH))}
          {passwordField("confirmPassword", t.register.confirmLabel, "new-password")}
        </div>
        {changed && <SavedNotice message={text.passwordChanged} />}
        <Button type="submit" variant="secondary" loading={saving} className="w-full sm:w-auto sm:self-end sm:px-8">{text.changePassword}</Button>
      </form>
    </Card>
  );
}
