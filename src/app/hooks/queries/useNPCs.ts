'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { npcService, NPC, ActiveCharacter } from '../../../services/npcService';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../../utils/errorHandling';
import { useToastOnError } from './_useToastOnError';

export const npcQueryKeys = {
  all: ['npc'] as const,
  available: ['npc', 'available'] as const,
  activeCharacter: ['npc', 'activeCharacter'] as const,
};

export function useAvailableNPCs() {
  const query = useQuery<NPC[]>({
    queryKey: npcQueryKeys.available,
    queryFn: () => npcService.getAvailableNPCs(),
  });
  useToastOnError(query.error, 'Failed to fetch available NPCs');
  return query;
}

export function useNPCActiveCharacter() {
  const query = useQuery<ActiveCharacter | null>({
    queryKey: npcQueryKeys.activeCharacter,
    queryFn: () => npcService.getActiveCharacter(),
  });
  useToastOnError(query.error, 'Failed to fetch active character');
  return query;
}

// Activating / deactivating an NPC changes which character is "active" for
// the user, which is also tracked by CharacterContext (`characters`,
// `activeNPCs`). Once Phase 5.2 lands and CharacterContext becomes
// query-backed, this mutation should also invalidate that root key. For now
// CharacterContext refetches on auth boot only; consumers that need fresh
// character data after activate/deactivate must call its `fetchCharacters`
// themselves (the legacy NPCSection page does not — preserved behavior).
export function useActivateNPC() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, unknown, number>({
    mutationFn: (npcId) => npcService.activateNPC(npcId),
    onSuccess: () => {
      showSuccess('NPC activated successfully');
      queryClient.invalidateQueries({ queryKey: npcQueryKeys.all });
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
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to deactivate NPC'));
    },
  });
}
