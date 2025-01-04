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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/protected', {
          withCredentials: true,
        });
        setIsAuthenticated(true);
        setUser(response.data.user); // Assume the backend sends user details
      } catch {
        setIsAuthenticated(false);
        setUser(null); // Clear user on error
      }
    };

    checkAuthStatus();
  }, []); // Run once on initialization

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser }}>
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
