import { useMemo, useState, type ReactNode } from 'react';

import { login as loginRequest, register as registerRequest } from '../api/authService';
import { clearSession, getStoredSession, storeSession } from './sessionStorage';
import { AuthContext, type AuthContextValue } from './authContextValue';
import type { AuthSession } from '../types/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.accessToken),
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
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
