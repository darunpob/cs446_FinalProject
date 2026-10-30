import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { AtSign, KeyRound } from "lucide-react";
import { USE_MOCK } from "../../api/client";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { Field, TextInput } from "../../design-system/Field";
import { PageHeading } from "../../design-system/FormSection";
import { Card, ErrorNotice } from "../../design-system/Surface";
import { demoAccounts } from "../../fixtures/mockData";
import { useI18n } from "../../i18n/useI18n";
import type { Session } from "../../api/contract";
import { useAuth } from "./AuthProvider";
import { GoogleSignInSection } from "./GoogleSignInButton";
import { safeNextPath } from "./nextPath";

function DemoAccounts({ onPick }: { onPick: (email: string, password: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="-mx-6 mt-6 border-t-2 border-dashed border-line-strong px-6 pt-5">
      <p className="text-xs font-semibold text-ink-2">{t.login.demoAccounts}</p>
      <div className="mt-2 flex flex-col divide-y divide-line">
        {demoAccounts.map((account) => (
          <button key={account.email} type="button" onClick={() => onPick(account.email, account.password)}
            className="-mx-2 flex cursor-pointer items-center justify-between gap-3 rounded-sm px-2 py-3 text-left text-sm transition-colors duration-150 hover:bg-surface-2">
            <span>
              <span className="block font-medium">{account.displayName}</span>
              <span className="text-[13px] text-ink-2">{account.email}</span>
            </span>
            <span className="rounded-sm bg-field px-2 py-0.5 text-xs font-semibold text-ink-2">{account.role === "guard" ? t.login.roleGuard : t.login.roleStudent}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { signIn } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const needsGuard = params.get("need") === "guard";

  const goNext = (session: Session) => {
    const fallback = session.user.role === "guard" ? "/admin" : "/";
    navigate(safeNextPath(params.get("next"), fallback), { replace: true });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFailure(null);
    try {
      goNext(await signIn(email, password));
    } catch (loginError) {
      setFailure(describeError(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-4">
      <PageHeading stock={needsGuard ? "guard" : "account"} title={needsGuard ? t.login.guardTitle : t.login.title} description={needsGuard ? t.login.guardSubtitle : t.login.subtitle} />
      <Card pinned className="p-6 pt-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {failure && <ErrorNotice message={failure} />}
          <Field label={t.login.email}>
            {(controlId) => <TextInput id={controlId} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} leading={<AtSign className="size-4" />} autoComplete="username" placeholder="name.surn@bumail.net" />}
          </Field>
          <Field label={t.login.password}>
            {(controlId) => <TextInput id={controlId} type="password" required value={password} onChange={(event) => setPassword(event.target.value)} leading={<KeyRound className="size-4" />} autoComplete="current-password" />}
          </Field>
          <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">{t.login.title}</Button>
        </form>
        <GoogleSignInSection onSignedIn={goNext} onError={setFailure} />
        {!needsGuard && (
          <p className="mt-5 text-center text-sm text-ink-2">
            {t.login.noAccount}{" "}
            <Link to={{ pathname: "/register", search: params.toString() }} className="font-semibold text-ink underline transition-colors duration-150 hover:text-ink-2">{t.login.registerLink}</Link>
          </p>
        )}
        {USE_MOCK && <DemoAccounts onPick={(demoEmail, demoPassword) => { setEmail(demoEmail); setPassword(demoPassword); }} />}
      </Card>
    </div>
  );
}
