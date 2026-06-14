'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { npcService, NPC, ActiveCharacter } from '@/services/npcService';
import { useToast } from '@/app/contexts/ToastContext';
import { getErrorMessage } from '@/utils/errorHandling';
import { useAuthGate } from './_useAuthGate';
import { useToastOnError } from './_useToastOnError';
import { charactersQueryKeys } from './useCharacters';

export const npcQueryKeys = {
  all: ['npc'] as const,
  available: ['npc', 'available'] as const,
  activeCharacter: ['npc', 'activeCharacter'] as const,
};

export function useAvailableNPCs() {
  const query = useQuery<NPC[]>({
    queryKey: npcQueryKeys.available,
    queryFn: () => npcService.getAvailableNPCs(),
    enabled: useAuthGate(),
  });
  useToastOnError(query.error, 'Failed to fetch available NPCs');
  return query;
}

export function useNPCActiveCharacter() {
  const query = useQuery<ActiveCharacter | null>({
    queryKey: npcQueryKeys.activeCharacter,
    queryFn: () => npcService.getActiveCharacter(),
    enabled: useAuthGate(),
  });
  useToastOnError(query.error, 'Failed to fetch active character');
  return query;
}

// Activating / deactivating an NPC flips which character is "active" for the
// user, so invalidate the characters domain alongside the npc one.
export function useActivateNPC() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, unknown, number>({
    mutationFn: (npcId) => npcService.activateNPC(npcId),
    onSuccess: () => {
      showSuccess('NPC activated successfully');
      queryClient.invalidateQueries({ queryKey: npcQueryKeys.all });
      // active-NPC endpoint is the source of truth; list is invalidated for the
      // `isActive` flag surfaced in character cards.
      queryClient.invalidateQueries({ queryKey: charactersQueryKeys.activeNPC });
      queryClient.invalidateQueries({ queryKey: charactersQueryKeys.list });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to activate NPC'));
    },
  });
}

export function useDeactivateNPC() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, unknown, number>({
    mutationFn: (characterId) => npcService.deactivateNPC(characterId),
    onSuccess: () => {
      showSuccess('NPC deactivated successfully');
      queryClient.invalidateQueries({ queryKey: npcQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: charactersQueryKeys.activeNPC });
      queryClient.invalidateQueries({ queryKey: charactersQueryKeys.list });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to deactivate NPC'));
    },
  });
}
