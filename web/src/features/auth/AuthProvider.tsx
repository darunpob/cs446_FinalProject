import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { api } from "../../api/client";
import type { NewAccount, Session, SessionUser, UserRole } from "../../api/contract";
import { readSession, writeSession } from "./sessionStore";

interface AuthState {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<Session>;
  signInWithGoogle: (idToken: string) => Promise<Session>;
  register: (draft: NewAccount) => Promise<Session>;
  /** Keeps the header and forms in step after the user edits their profile. */
  refreshUser: (user: SessionUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const adopt = useCallback((issued: Session) => {
    writeSession(issued);
    setSession(issued);
    return issued;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => adopt(await api.login(email, password)), [adopt]);

  const signInWithGoogle = useCallback(async (idToken: string) => adopt(await api.loginWithGoogle(idToken)), [adopt]);

  const register = useCallback(async (draft: NewAccount) => adopt(await api.register(draft)), [adopt]);

  const refreshUser = useCallback((user: SessionUser) => {
    setSession((current) => {
      if (!current) return current;
      const updated = { ...current, user: { email: user.email, displayName: user.displayName, role: user.role } };
      writeSession(updated);
      return updated;
    });
  }, []);

  const signOut = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const auth = useMemo(
    () => ({ session, signIn, signInWithGoogle, register, refreshUser, signOut }),
    [session, signIn, signInWithGoogle, register, refreshUser, signOut],
  );
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
  return auth;
}

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  if (session?.user.role === role) return children;
  const next = encodeURIComponent(location.pathname);
  return <Navigate to={`/login?next=${next}&need=${role}`} replace />;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  if (session) return children;
  return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
}
