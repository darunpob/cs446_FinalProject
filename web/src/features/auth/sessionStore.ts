import type { Session } from "../../api/contract";

const SESSION_KEY = "bu-lf-session";

function isSession(candidate: unknown): candidate is Session {
  const session = candidate as Session | null;
  return Boolean(session?.accessToken && session.user?.email && session.user.role);
}

export function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isSession(parsed) ? parsed : null;
  } catch (storageError) {
    console.warn("Session could not be read", storageError);
    return null;
  }
}

export function writeSession(session: Session | null): void {
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch (storageError) {
    console.warn("Session could not be saved; it will last for this tab only", storageError);
  }
}
