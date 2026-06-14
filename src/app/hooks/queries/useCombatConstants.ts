'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  combatConstantsService,
  CombatConstant,
  ConstantsByCategory,
} from '@/services/combatConstantsService';
import { useToast } from '@/app/contexts/ToastContext';
import { getErrorMessage } from '@/utils/errorHandling';
import { useAuthGate } from './_useAuthGate';
import { useToastOnError } from './_useToastOnError';

export const combatConstantsQueryKeys = {
  all: ['combatConstants'] as const,
  byCategory: ['combatConstants', 'byCategory'] as const,
};

export function useCombatConstants() {
  const query = useQuery<ConstantsByCategory>({
    queryKey: combatConstantsQueryKeys.byCategory,
    queryFn: () => combatConstantsService.getConstantsByCategory(),
    enabled: useAuthGate(),
  });
  useToastOnError(query.error, 'Failed to fetch combat constants');
  return query;
}

export function useUpdateCombatConstant() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<CombatConstant, unknown, { id: number; value: number }>({
    mutationFn: ({ id, value }) => combatConstantsService.updateConstant(id, value),
    onSuccess: () => {
      showSuccess('Combat constant updated successfully');
      queryClient.invalidateQueries({ queryKey: combatConstantsQueryKeys.all });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to update combat constant'));
    },
  });
}

export function useInitializeCombatConstantDefaults() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<{ createdConstants: number }>({
    mutationFn: () => combatConstantsService.initializeDefaults(),
    onSuccess: (result) => {
      showSuccess(`Initialized ${result.createdConstants} default constants`);
      queryClient.invalidateQueries({ queryKey: combatConstantsQueryKeys.all });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to initialize default constants'));
    },
  });
}
