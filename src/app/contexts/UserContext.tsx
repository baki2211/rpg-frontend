'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { userService } from '../../services/userService';
import { useToast } from './ToastContext';
import { User, DashboardData, UpdateProfileData, ChangePasswordData } from '../../types/user';
import { getErrorMessage } from '../../utils/errorHandling';

interface UserContextValue {
  // State
  user: User | null;
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  // Actions
  fetchDashboard: () => Promise<DashboardData>;
  fetchProfile: () => Promise<User>;
  updateProfile: (userData: UpdateProfileData) => Promise<User>;
  changePassword: (passwordData: ChangePasswordData) => Promise<void>;
  clearUser: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchDashboard = useCallback(async (): Promise<DashboardData> => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getDashboard();
      setDashboardData(data);
      setUser(data.user);
      return data;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch dashboard');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchProfile = useCallback(async (): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      const userData = await userService.getProfile();
      setUser(userData);
      return userData;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch profile');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const updateProfile = useCallback(async (userData: UpdateProfileData): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await userService.updateProfile(userData);
      setUser(updatedUser);
      showSuccess('Profile updated successfully');
      return updatedUser;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to update profile');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const changePassword = useCallback(async (passwordData: ChangePasswordData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await userService.changePassword(passwordData);
      showSuccess('Password changed successfully');
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to change password');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const clearUser = useCallback(() => {
    setUser(null);
    setDashboardData(null);
    setError(null);
  }, []);

  const value = useMemo<UserContextValue>(() => ({
    user,
    dashboardData,
    loading,
    error,
    fetchDashboard,
    fetchProfile,
    updateProfile,
    changePassword,
    clearUser,
  }), [
    user,
    dashboardData,
    loading,
    error,
    fetchDashboard,
    fetchProfile,
    updateProfile,
    changePassword,
    clearUser,
  ]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
