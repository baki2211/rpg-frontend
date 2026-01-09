'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../../services/apiClient";
import { tokenService } from "../../services/tokenService";

interface User {
  id: string;
  username: string;
  role: string; // Include the user's role (e.g., 'admin', 'user')
}

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null; // Add user to context
  setUser: React.Dispatch<React.SetStateAction<User | null>>; // Setter for user
  isLoading: boolean; // Add loading state
  error: string | null; // Add error state
  retryAuth: () => void; // Add retry function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authCheckInProgress = React.useRef(false);

  const checkAuthStatus = async (retryCount = 0): Promise<void> => {
    // Prevent duplicate simultaneous auth checks
    if (authCheckInProgress.current) {
      return;
    }
    authCheckInProgress.current = true;
    try {
      setIsLoading(true);
      setError(null);
      
      // First check if we have a stored token
      const storedToken = tokenService.getToken();
      const storedUser = tokenService.getUser();
      
      if (storedToken && storedUser) {
        // We have a stored token, let's verify it's still valid
        const response = await api.get('/protected');
        const responseData = response.data as { user: User };
        
        setIsAuthenticated(true);
        setUser(responseData.user);
      } else {
        // No stored token, clear auth state
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error: unknown) {
      const axiosError = error as { code?: string; response?: { status: number }; message?: string };

      // Handle rate limiting
      if (axiosError.response?.status === 429) {
        setError('Too many requests. Please wait a moment before trying again.');
        // Don't clear auth state for rate limiting
        return;
      }

      // Only clear auth on actual authentication failures
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        tokenService.clearAuth();
        setIsAuthenticated(false);
        setUser(null);
        setError('Session expired. Please log in again.');
      } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ECONNABORTED' ||
                 axiosError.message?.includes('Network Error') || axiosError.message?.includes('timeout')) {
        // Network errors - don't clear auth, but show appropriate message
        if (retryCount < 3) {
          // Retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          setError(`Connection issue. Retrying in ${delay/1000}s...`);
          setTimeout(() => checkAuthStatus(retryCount + 1), delay);
          return;
        } else {
          setError('Connection lost. Your session is preserved. Check your network connection.');
          // Keep current auth state - user might still be authenticated when connection returns
        }
      } else {
        // Other errors - keep auth state but show error
        setError(axiosError.message || 'Authentication check failed. Your session is preserved.');
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
  }, []); // Run once on initialization

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
