'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masteryTiersService, MasteryTier } from '../../../services/masteryTiersService';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../../utils/errorHandling';
import { useToastOnError } from './_useToastOnError';

export const masteryTiersQueryKeys = {
  all: ['masteryTiers'] as const,
  list: ['masteryTiers', 'list'] as const,
};

export function useMasteryTiers() {
  const query = useQuery<MasteryTier[]>({
    queryKey: masteryTiersQueryKeys.list,
    queryFn: () => masteryTiersService.getTiers(),
  });
  useToastOnError(query.error, 'Failed to fetch mastery tiers');
  return query;
}

export function useCreateMasteryTier() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<MasteryTier, unknown, Partial<MasteryTier>>({
    mutationFn: (tierData) => masteryTiersService.createTier(tierData),
    onSuccess: () => {
      showSuccess('Mastery tier created successfully');
      queryClient.invalidateQueries({ queryKey: masteryTiersQueryKeys.all });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to create mastery tier'));
    },
  });
}

export function useUpdateMasteryTier() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<MasteryTier, unknown, { id: number; updateData: Partial<MasteryTier> }>({
    mutationFn: ({ id, updateData }) => masteryTiersService.updateTier(id, updateData),
    onSuccess: () => {
      showSuccess('Mastery tier updated successfully');
      queryClient.invalidateQueries({ queryKey: masteryTiersQueryKeys.all });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to update mastery tier'));
    },
  });
}

export function useDeleteMasteryTier() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, unknown, number>({
    mutationFn: (id) => masteryTiersService.deleteTier(id),
    onSuccess: () => {
      showSuccess('Mastery tier deleted successfully');
      queryClient.invalidateQueries({ queryKey: masteryTiersQueryKeys.all });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to delete mastery tier'));
    },
  });
}

export function useInitializeMasteryTierDefaults() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<{ createdTiers: number }>({
    mutationFn: () => masteryTiersService.initializeDefaults(),
    onSuccess: (result) => {
      showSuccess(`Initialized ${result.createdTiers} default tiers`);
      queryClient.invalidateQueries({ queryKey: masteryTiersQueryKeys.all });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to initialize default tiers'));
    },
  });
}
