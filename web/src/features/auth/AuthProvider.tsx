import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { api } from "../../api/client";
import type { Session, UserRole } from "../../api/contract";
import { readSession, writeSession } from "./sessionStore";

interface AuthState {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<Session>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const signIn = useCallback(async (email: string, password: string) => {
    const issued = await api.login(email, password);
    writeSession(issued);
    setSession(issued);
    return issued;
  }, []);

  const signOut = useCallback(() => {
    writeSession(null);
    setSession(null);
  }, []);

  const auth = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
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
