'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../config/api";
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
          const response = await axios.get(`${API_URL}/protected`, {
            headers: {
              Authorization: `Bearer ${storedToken}`
            },
            withCredentials: true,
            timeout: 5000,
          });
          
          setIsAuthenticated(true);
          setUser(response.data.user);
        } else {
          // No stored token, try cookie-based auth (for local development)
          const response = await axios.get(`${API_URL}/protected`, {
            withCredentials: true,
            timeout: 5000,
          });
          
          setIsAuthenticated(true);
          setUser(response.data.user);
        }
      } catch (error: unknown) {
        
        // Clear stored auth data on failure
        tokenService.clearAuth();
        
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNREFUSED') {
            setError('Cannot connect to server. Please make sure the backend is running.');
          } else if (error.response?.status === 401) {
            setError('Not authenticated. Please log in.');
          } else if (error.code === 'ECONNABORTED') {
            setError('Connection timeout. Please check your network connection.');
          } else {
            setError(error.message || 'Authentication check failed');
          }
        } else {
          setError('An unexpected error occurred');
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
