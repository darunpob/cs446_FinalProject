import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "../../api/client";
import type { Session } from "../../api/contract";
import { describeError } from "../../api/errors";
import { useI18n } from "../../i18n/useI18n";
import { useAuth } from "./AuthProvider";

const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const BUTTON_MAX_WIDTH_PX = 400;

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (response: GoogleCredentialResponse) => void; ux_mode: "popup" }): void;
      renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

let gisLoading: Promise<GoogleIdentityServices> | null = null;

function loadGoogleIdentityServices(): Promise<GoogleIdentityServices> {
  gisLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google) : reject(new Error("Google Identity Services did not load")));
    script.onerror = () => {
      gisLoading = null;
      reject(new Error("Google Identity Services did not load"));
    };
    document.head.appendChild(script);
  });
  return gisLoading;
}

interface GoogleSignInButtonProps {
  onSignedIn: (session: Session) => void;
  onError: (message: string) => void;
}

/** Google's own rendered button; the API decides whether the account's domain may sign in. */
export function GoogleSignInButton({ onSignedIn, onError }: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useAuth();
  const { t, locale } = useI18n();
  const slotRef = useRef<HTMLDivElement>(null);
  const handlersRef = useRef({ onSignedIn, onError, signInWithGoogle });
  handlersRef.current = { onSignedIn, onError, signInWithGoogle };
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const onCredential = async ({ credential }: GoogleCredentialResponse) => {
      const handlers = handlersRef.current;
      try {
        handlers.onSignedIn(await handlers.signInWithGoogle(credential));
      } catch (googleError) {
        handlers.onError(describeError(googleError));
      }
    };
    loadGoogleIdentityServices()
      .then((google) => {
        const slot = slotRef.current;
        if (cancelled || !slot) return;
        google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (response) => void onCredential(response), ux_mode: "popup" });
        slot.replaceChildren();
        const width = Math.min(BUTTON_MAX_WIDTH_PX, Math.round(slot.clientWidth));
        google.accounts.id.renderButton(slot, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width, locale });
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (unavailable) return <p className="text-center text-sm text-ink-2">{t.login.googleUnavailable}</p>;
  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={slotRef} className="flex min-h-11 w-full justify-center" />
      <p className="text-center text-xs text-ink-3">{t.login.googleHint}</p>
    </div>
  );
}

export function GoogleSignInSection({ onSignedIn, onError }: GoogleSignInButtonProps) {
  const { t } = useI18n();
  if (!GOOGLE_CLIENT_ID) return null;
  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 text-xs font-semibold text-ink-3" aria-hidden>
        <span className="h-px flex-1 bg-line-strong" />
        {t.login.or}
        <span className="h-px flex-1 bg-line-strong" />
      </div>
      <GoogleSignInButton onSignedIn={onSignedIn} onError={onError} />
    </div>
  );
}
