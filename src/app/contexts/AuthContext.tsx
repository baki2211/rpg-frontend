'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../../services/authService";
import { getCsrfToken } from "../../services/csrfService";
import { AuthUser, AuthContextType } from "../../types/auth";
import { getErrorCode, getErrorMessage, getErrorStatus } from "../../utils/errorHandling";

const throwNotInProvider = (): never => {
  throw new Error('useAuth must be used within an AuthProvider');
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: throwNotInProvider,
  user: null,
  setUser: throwNotInProvider,
  isLoading: true,
  error: null,
  retryAuth: throwNotInProvider,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authCheckInProgress = React.useRef(false);
  const hasInitialized = React.useRef(false);

  const checkAuthStatus = async (retryCount = 0): Promise<void> => {
    // Prevent duplicate simultaneous auth checks
    if (authCheckInProgress.current) {
      return;
    }

    // Prevent duplicate initialization (React Strict Mode protection)
    if (retryCount === 0 && hasInitialized.current) {
      setIsLoading(false);
      return;
    }

    authCheckInProgress.current = true;
    if (retryCount === 0) {
      hasInitialized.current = true;
    }
    try {
      setIsLoading(true);
      setError(null);

      // The session JWT cookie is httpOnly, but the csrfToken cookie isn't
      // and is always set alongside it. Use its presence as a hint that the
      // browser has an active session; absence means definitively logged out
      // and we skip /protected to avoid the apiClient 401 auto-redirect.
      if (!getCsrfToken()) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const authData = await authService.checkAuth();
      setIsAuthenticated(true);
      setUser(authData);
    } catch (err) {
      if (!(err instanceof Error)) return;

      const code = getErrorCode(err);
      const status = getErrorStatus(err);

      if (code === 'ERR_TOO_MANY_REQUESTS') {
        setError('Too many requests. Please wait a moment before trying again.');
        setIsLoading(false);
        authCheckInProgress.current = false;
        return;
      }

      if (status === 401 || status === 403) {
        setIsAuthenticated(false);
        setUser(null);
        setError(null);
      } else if (code === 'ERR_NETWORK' || code === 'ERR_TIMEOUT') {
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          setError(`Connection issue. Retrying in ${delay/1000}s...`);
          setTimeout(() => checkAuthStatus(retryCount + 1), delay);
          return;
        } else {
          setError('Connection lost. Your session is preserved. Check your network connection.');
        }
      } else {
        setError(getErrorMessage(err, 'Authentication check failed. Your session is preserved.'));
      }
    } finally {
      if (retryCount === 0) { // Only set loading false on initial call, not retries
        setIsLoading(false);
      }
      authCheckInProgress.current = false;
    }
  };

  const retryAuth = () => {
    checkAuthStatus();
  };

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      setIsAuthenticated, 
      user, 
      setUser, 
      isLoading, 
      error,
      retryAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
