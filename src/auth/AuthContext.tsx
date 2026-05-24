import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { getCurrentUser, login as loginRequest, register as registerRequest } from '../api/authService';
import { clearSession, getStoredSession, storeSession } from './sessionStorage';
import { AuthContext, type AuthContextValue } from './authContextValue';
import type { AuthSession } from '../types/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [checkingSession, setCheckingSession] = useState(() => Boolean(getStoredSession()?.accessToken));

  useEffect(() => {
    const storedSession = getStoredSession();

    if (!storedSession?.accessToken) {
      setCheckingSession(false);
      return;
    }

    async function validateSession() {
      try {
        const authResponse = await getCurrentUser();
        storeSession(authResponse);
        setSession(authResponse);
      } catch {
        clearSession();
        setSession(null);
      } finally {
        setCheckingSession(false);
      }
    }

    void validateSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.accessToken),
      checkingSession,
      async login(payload) {
        const authResponse = await loginRequest(payload);
        storeSession(authResponse);
        setSession(authResponse);
      },
      async register(payload) {
        const authResponse = await registerRequest(payload);
        storeSession(authResponse);
        setSession(authResponse);
      },
      logout() {
        clearSession();
        setSession(null);
      },
    }),
    [checkingSession, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
