'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { User, DashboardData } from '@/types/user';
import { useToast } from '@/app/contexts/ToastContext';
import { getErrorMessage } from '@/utils/errorHandling';
import { useAuthGate } from './_useAuthGate';
import { useToastOnError } from './_useToastOnError';

export const userQueryKeys = {
  all: ['user'] as const,
  dashboard: ['user', 'dashboard'] as const,
  profile: ['user', 'profile'] as const,
  allUsers: ['user', 'allUsers'] as const,
};

interface UseUserQueryOptions {
  enabled?: boolean;
}

export function useDashboard({ enabled = true }: UseUserQueryOptions = {}) {
  const query = useQuery<DashboardData>({
    queryKey: userQueryKeys.dashboard,
    queryFn: () => userService.getDashboard(),
    enabled: useAuthGate(enabled),
  });
  useToastOnError(query.error, 'Failed to fetch dashboard');
  return query;
}

export function useProfile({ enabled = true }: UseUserQueryOptions = {}) {
  const query = useQuery<User>({
    queryKey: userQueryKeys.profile,
    queryFn: () => userService.getProfile(),
    enabled: useAuthGate(enabled),
  });
  useToastOnError(query.error, 'Failed to fetch profile');
  return query;
}

export function useAllUsers({ enabled = true }: UseUserQueryOptions = {}) {
  const query = useQuery<User[]>({
    queryKey: userQueryKeys.allUsers,
    queryFn: () => userService.getAllUsers(),
    enabled: useAuthGate(enabled),
  });
  useToastOnError(query.error, 'Failed to fetch users');
  return query;
}

interface UpdateUserPasswordVariables {
  userId: number;
  oldPassword: string;
  newPassword: string;
}

export function useUpdateUserPassword() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, unknown, UpdateUserPasswordVariables>({
    mutationFn: ({ userId, oldPassword, newPassword }) =>
      userService.updateUserPassword(userId, oldPassword, newPassword),
    onSuccess: () => {
      showSuccess('Password updated successfully');
      queryClient.invalidateQueries({ queryKey: userQueryKeys.allUsers });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to update password'));
    },
  });
}

interface AdminResetUserPasswordVariables {
  userId: number;
  newPassword: string;
}

export function useAdminResetUserPassword() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, unknown, AdminResetUserPasswordVariables>({
    mutationFn: ({ userId, newPassword }) =>
      userService.adminResetUserPassword(userId, newPassword),
    onSuccess: () => {
      showSuccess('Password updated successfully');
      queryClient.invalidateQueries({ queryKey: userQueryKeys.allUsers });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to update password'));
    },
  });
}
