import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearSession, loadSession, saveSession } from '../services/auth';
import type { SignInResult } from '../hooks/useProviderSignIn';
import type { AuthSession } from '../types';

type AuthContextValue = {
  hydrated: boolean;
  session: AuthSession | null;
  signIn: (result: SignInResult) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await loadSession();
      if (!alive) return;
      setSession(s);
      setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (result: SignInResult) => {
    const next: AuthSession = { identity: result.identity, tokens: result.tokens, createdAt: new Date().toISOString() };
    await saveSession(next);
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  return <AuthContext.Provider value={{ hydrated, session, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
