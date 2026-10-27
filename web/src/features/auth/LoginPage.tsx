import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AtSign, KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { isMockMode } from "../../api/client";
import { describeError } from "../../api/errors";
import { Button } from "../../design-system/Button";
import { Field, TextInput } from "../../design-system/Field";
import { Card, ErrorNotice } from "../../design-system/Surface";
import { demoAccounts } from "../../fixtures/accounts";
import { useI18n } from "../../i18n/useI18n";
import { useAuth } from "./AuthProvider";

function safeNextPath(rawNext: string | null): string {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) return "/";
  return rawNext;
}

function DemoAccounts({ onPick }: { onPick: (email: string, password: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-line-strong p-4">
      <p className="text-xs font-semibold text-ink-3">{t.login.demoAccounts}</p>
      <div className="mt-3 flex flex-col gap-2">
        {demoAccounts.map((account) => (
          <button key={account.email} type="button" onClick={() => onPick(account.email, account.password)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-brand-soft">
            <span>
              <span className="block font-medium">{account.displayName}</span>
              <span className="text-[13px] text-ink-3">{account.email}</span>
            </span>
            <span className="rounded-md bg-surface px-2 py-0.5 text-xs text-ink-2">{account.role === "guard" ? t.login.roleGuard : t.login.roleStudent}</span>
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFailure(null);
    try {
      const session = await signIn(email, password);
      const fallback = session.user.role === "guard" ? "/admin" : "/";
      navigate(params.get("next") ? safeNextPath(params.get("next")) : fallback, { replace: true });
    } catch (loginError) {
      setFailure(describeError(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md animate-rise py-4">
      <div className="mb-6 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-accent text-white shadow-glow">
          {needsGuard ? <ShieldCheck className="size-7" /> : <LogIn className="size-7" />}
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold">{needsGuard ? t.login.guardTitle : t.login.title}</h1>
        <p className="mt-2 text-ink-2">{needsGuard ? t.login.guardSubtitle : t.login.subtitle}</p>
      </div>
      <Card className="p-6">
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
        {isMockMode && <DemoAccounts onPick={(demoEmail, demoPassword) => { setEmail(demoEmail); setPassword(demoPassword); }} />}
      </Card>
    </div>
  );
}
