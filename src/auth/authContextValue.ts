import { createContext } from 'react';

import type { AuthSession, LoginRequest, RegisterRequest } from '../types/auth';

export type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  checkingSession: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
