'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  combatRoundsService,
  CombatRound,
} from '@/services/combatRoundsService';
import { useToast } from '@/app/contexts/ToastContext';
import { getErrorMessage } from '@/utils/errorHandling';
import { useToastOnError } from './_useToastOnError';

export const combatRoundsQueryKeys = {
  all: ['combatRounds'] as const,
  location: (locationId: string) =>
    ['combatRounds', 'location', locationId] as const,
  active: (locationId: string) =>
    ['combatRounds', 'location', locationId, 'active'] as const,
  resolved: (locationId: string, limit: number) =>
    ['combatRounds', 'location', locationId, 'resolved', limit] as const,
};

interface UseCombatRoundsQueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useActiveCombatRound(
  locationId: string,
  { enabled = true, refetchInterval = false }: UseCombatRoundsQueryOptions = {}
) {
  const query = useQuery<CombatRound | null>({
    queryKey: combatRoundsQueryKeys.active(locationId),
    queryFn: () => combatRoundsService.getActiveCombatRound(locationId),
    enabled: enabled && Boolean(locationId),
    refetchInterval,
  });
  useToastOnError(query.error, 'Failed to fetch active combat round');
  return query;
}

export function useResolvedCombatRounds(
  locationId: string,
  limit = 5,
  { enabled = true, refetchInterval = false }: UseCombatRoundsQueryOptions = {}
) {
  const query = useQuery<CombatRound[]>({
    queryKey: combatRoundsQueryKeys.resolved(locationId, limit),
    queryFn: () =>
      combatRoundsService.getResolvedCombatRounds(locationId, limit),
    enabled: enabled && Boolean(locationId),
    refetchInterval,
  });
  useToastOnError(query.error, 'Failed to fetch resolved combat rounds');
  return query;
}

interface CreateCombatRoundVariables {
  locationId: number;
  eventId: number;
}

export function useCreateCombatRound() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<{ success: boolean }, unknown, CreateCombatRoundVariables>({
    mutationFn: (vars) => combatRoundsService.createCombatRound(vars),
    onSuccess: (_result, vars) => {
      showSuccess('Combat round created successfully');
      queryClient.invalidateQueries({
        queryKey: combatRoundsQueryKeys.location(String(vars.locationId)),
      });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to create combat round'));
    },
  });
}

interface RoundLocationVariables {
  roundId: number;
  locationId: string;
}

export function useResolveCombatRound() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<{ success: boolean }, unknown, RoundLocationVariables>({
    mutationFn: ({ roundId }) => combatRoundsService.resolveCombatRound(roundId),
    onSuccess: (_result, { locationId }) => {
      showSuccess('Combat round resolved successfully');
      queryClient.invalidateQueries({
        queryKey: combatRoundsQueryKeys.location(locationId),
      });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to resolve combat round'));
    },
  });
}

export function useCancelCombatRound() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<{ success: boolean }, unknown, RoundLocationVariables>({
    mutationFn: ({ roundId }) => combatRoundsService.cancelCombatRound(roundId),
    onSuccess: (_result, { locationId }) => {
      showSuccess('Combat round cancelled');
      queryClient.invalidateQueries({
        queryKey: combatRoundsQueryKeys.location(locationId),
      });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to cancel combat round'));
    },
  });
}
