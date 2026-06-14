'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  skillValidationService,
  SkillValidationRule,
  SkillTypesByCategory,
} from '@/services/skillValidationService';
import { useToast } from '@/app/contexts/ToastContext';
import { getErrorMessage } from '@/utils/errorHandling';
import { useToastOnError } from './_useToastOnError';

export const skillValidationQueryKeys = {
  all: ['skillValidation'] as const,
  byCategory: ['skillValidation', 'byCategory'] as const,
};

export function useSkillValidationRules() {
  const query = useQuery<SkillTypesByCategory>({
    queryKey: skillValidationQueryKeys.byCategory,
    queryFn: () => skillValidationService.getRulesByCategory(),
  });
  useToastOnError(query.error, 'Failed to fetch skill validation rules');
  return query;
}

export function useUpdateSkillValidationRule() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<
    SkillValidationRule,
    unknown,
    { id: number; updateData: Partial<SkillValidationRule> }
  >({
    mutationFn: ({ id, updateData }) => skillValidationService.updateRule(id, updateData),
    onSuccess: () => {
      showSuccess('Validation rule updated successfully');
      queryClient.invalidateQueries({ queryKey: skillValidationQueryKeys.all });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to update validation rule'));
    },
  });
}

export function useInitializeSkillValidationDefaults() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<{ createdRules: number }>({
    mutationFn: () => skillValidationService.initializeDefaults(),
    onSuccess: (result) => {
      showSuccess(`Initialized ${result.createdRules} default rules`);
      queryClient.invalidateQueries({ queryKey: skillValidationQueryKeys.all });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to initialize default rules'));
    },
  });
}
