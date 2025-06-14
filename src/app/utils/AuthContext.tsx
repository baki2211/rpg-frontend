'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

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
        console.log('Checking authentication status...');
        
        const response = await axios.get('http://localhost:5001/api/protected', {
          withCredentials: true,
          timeout: 5000, // 5 second timeout (reduced from 10)
        });
        
        console.log('Auth check successful:', response.data);
        setIsAuthenticated(true);
        setUser(response.data.user); // Assume the backend sends user details
      } catch (error: unknown) {
        console.error('Auth check failed:', error);
        
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
        setUser(null); // Clear user on error
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
