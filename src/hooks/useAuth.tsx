import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchCurrentSession, logout } from "../api/auth";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  setAuthenticatedEmail: (email: string) => void;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentSession()
      .then(setEmail)
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: email !== null,
      isLoading,
      email,
      setAuthenticatedEmail: setEmail,
      disconnect: () => {
        logout().finally(() => setEmail(null));
      },
    }),
    [email, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
