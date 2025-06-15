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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
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
        
        // Clear stored auth data on failure
        tokenService.clearAuth();
        
        const axiosError = error as { code?: string; response?: { status: number }; message?: string };
        if (axiosError.code === 'ECONNREFUSED') {
          setError('Cannot connect to server. Please make sure the backend is running.');
        } else if (axiosError.response?.status === 401) {
          setError('Not authenticated. Please log in.');
        } else if (axiosError.code === 'ECONNABORTED') {
          setError('Connection timeout. Please check your network connection.');
        } else {
          setError(axiosError.message || 'Authentication check failed');
        }
        
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []); // Run once on initialization

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser, isLoading, error }}>
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
