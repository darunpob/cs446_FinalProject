import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { AtSign, KeyRound, UserRound } from "lucide-react";
import { MIN_PASSWORD_LENGTH } from "../../api/contract";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { Field, TextInput } from "../../design-system/Field";
import { PageHeading } from "../../design-system/FormSection";
import { Card, ErrorNotice } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { useAuth } from "./AuthProvider";
import { GoogleSignInSection } from "./GoogleSignInButton";
import { safeNextPath } from "./nextPath";
import { validateRegistration } from "./registerForm";
import type { RegisterDraft, RegisterErrors } from "./registerForm";

const BLANK_DRAFT: RegisterDraft = { displayName: "", email: "", password: "", confirmPassword: "" };

export function RegisterPage() {
  const { session, register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [draft, setDraft] = useState<RegisterDraft>(BLANK_DRAFT);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const text = t.register;

  if (session) return <Navigate to="/account" replace />;

  const setField = (field: keyof RegisterDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateRegistration(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    setFailure(null);
    try {
      await register({ email: draft.email.trim(), password: draft.password, displayName: draft.displayName.trim() });
      navigate(safeNextPath(params.get("next"), "/account"), { replace: true });
    } catch (registerError) {
      setFailure(describeError(registerError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-4">
      <PageHeading stock="account" title={text.title} description={text.subtitle} />
      <Card pinned className="p-6 pt-8">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {failure && <ErrorNotice message={failure} />}
          <Field label={text.nameLabel} error={errors.displayName}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} invalid={Boolean(errors.displayName)} value={draft.displayName} onChange={(event) => setField("displayName", event.target.value)} leading={<UserRound className="size-4" />} autoComplete="name" />}
          </Field>
          <Field label={t.login.email} error={errors.email} hint={t.reportLost.emailHint}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="email" invalid={Boolean(errors.email)} value={draft.email} onChange={(event) => setField("email", event.target.value)} leading={<AtSign className="size-4" />} autoComplete="email" placeholder="name.surn@bumail.net" />}
          </Field>
          <Field label={t.login.password} error={errors.password} hint={text.passwordHint(MIN_PASSWORD_LENGTH)}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="password" invalid={Boolean(errors.password)} value={draft.password} onChange={(event) => setField("password", event.target.value)} leading={<KeyRound className="size-4" />} autoComplete="new-password" />}
          </Field>
          <Field label={text.confirmLabel} error={errors.confirmPassword}>
            {(controlId, describedBy) => <TextInput id={controlId} aria-describedby={describedBy} type="password" invalid={Boolean(errors.confirmPassword)} value={draft.confirmPassword} onChange={(event) => setField("confirmPassword", event.target.value)} leading={<KeyRound className="size-4" />} autoComplete="new-password" />}
          </Field>
          <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">{text.submit}</Button>
        </form>
        <GoogleSignInSection onSignedIn={() => navigate(safeNextPath(params.get("next"), "/account"), { replace: true })} onError={setFailure} />
        <p className="mt-5 text-center text-sm text-ink-2">
          {text.haveAccount}{" "}
          <Link to={{ pathname: "/login", search: params.toString() }} className="font-semibold text-ink underline transition-colors duration-150 hover:text-ink-2">{text.loginLink}</Link>
        </p>
      </Card>
    </div>
  );
}
