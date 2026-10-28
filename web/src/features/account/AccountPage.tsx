import { useCallback } from "react";
import { useNavigate } from "react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import { api } from "../../api/client";
import type { UserProfile } from "../../api/contract";
import { ApiError } from "../../api/errors";
import { useApiQuery } from "../../api/useApiQuery";
import { Button, ButtonLink } from "../../design-system/Button";
import { PageHeading } from "../../design-system/FormSection";
import { Badge, Card, ErrorNotice, Spinner } from "../../design-system/Surface";
import { useI18n } from "../../i18n/useI18n";
import { useAuth } from "../auth/AuthProvider";
import { PasswordForm } from "./PasswordForm";
import { ProfileForm } from "./ProfileForm";

function ProfileSummary({ profile, onSignOut }: { profile: UserProfile; onSignOut: () => void }) {
  const { t } = useI18n();
  const isGuard = profile.role === "guard";
  return (
    <Card pinned className="flex flex-wrap items-center gap-4 p-5 pt-6 sm:p-7">
      <span className="grid size-14 shrink-0 place-items-center rounded-md bg-stock-sand font-display text-2xl text-stock-ink shadow-paper" aria-hidden>
        {profile.displayName.trim().charAt(0).toUpperCase() || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold">{profile.displayName}</p>
        <p className="truncate text-sm text-ink-2">{profile.email}</p>
        <Badge tone={isGuard ? "verify" : "neutral"} className="mt-1.5">{isGuard ? t.login.roleGuard : t.login.roleStudent}</Badge>
      </div>
      <div className="flex w-full gap-2 sm:w-auto">
        {isGuard && <ButtonLink to="/admin" variant="soft" size="sm" icon={<ShieldCheck className="size-4" aria-hidden />} className="flex-1 sm:flex-none">{t.nav.guard}</ButtonLink>}
        <Button variant="danger" size="sm" icon={<LogOut className="size-4" aria-hidden />} onClick={onSignOut} className="flex-1 sm:flex-none">{t.nav.logout}</Button>
      </div>
    </Card>
  );
}

export function AccountPage() {
  const { session, refreshUser, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const loadProfile = useCallback(async () => {
    try {
      return await api.getProfile();
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.code === "UNAUTHORIZED") signOut();
      throw loadError;
    }
  }, [signOut]);

  const { state, reload } = useApiQuery(loadProfile, [session?.user.email]);

  const handleSignOut = () => {
    signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading stock="account" title={t.account.title} description={t.account.subtitle} />
      {state.phase === "loading" && <Spinner label={t.common.loading} />}
      {state.phase === "failed" && <ErrorNotice message={state.message} onRetry={reload} />}
      {state.phase === "ready" && (
        <div className="flex flex-col gap-6">
          <ProfileSummary profile={{ ...state.value, displayName: session?.user.displayName ?? state.value.displayName }} onSignOut={handleSignOut} />
          <ProfileForm key={state.value.email} profile={state.value} onSaved={refreshUser} />
          <PasswordForm />
        </div>
      )}
    </div>
  );
}
