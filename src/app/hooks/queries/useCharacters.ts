'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { characterService } from '@/services/characterService';
import { Character } from '@/types/character';
import { useToast } from '@/app/contexts/ToastContext';
import { getErrorMessage } from '@/utils/errorHandling';
import { useAuthGate } from './_useAuthGate';
import { useToastOnError } from './_useToastOnError';

export const charactersQueryKeys = {
  all: ['characters'] as const,
  list: ['characters', 'list'] as const,
  activeNPC: ['characters', 'activeNPC'] as const,
};

interface UseCharactersQueryOptions {
  enabled?: boolean;
}

export function useCharacters({ enabled = true }: UseCharactersQueryOptions = {}) {
  const query = useQuery<Character[], unknown, Character[]>({
    queryKey: charactersQueryKeys.list,
    queryFn: () => characterService.getCharacters(),
    select: (data) => data.filter((char) => !char.isNPC),
    enabled: useAuthGate(enabled),
  });
  useToastOnError(query.error, 'Failed to fetch characters');
  return query;
}

export function useActiveNPC({ enabled = true }: UseCharactersQueryOptions = {}) {
  // Legacy CharacterContext swallowed errors on this endpoint (no toast,
  // just set empty array). Preserve that — the endpoint 404s when no NPC is
  // active and that's normal.
  return useQuery<Character | null, unknown, Character | null>({
    queryKey: charactersQueryKeys.activeNPC,
    queryFn: async () => {
      try {
        return await characterService.getActiveNPC();
      } catch {
        return null;
      }
    },
    // `isNPC` is optional on Character — pin it for downstream NPC branches.
    select: (data) => (data ? { ...data, isNPC: true } : null),
    enabled: useAuthGate(enabled),
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<Character, unknown, FormData>({
    mutationFn: (formData) => characterService.createCharacter(formData),
    onSuccess: () => {
      showSuccess('Character created successfully');
      queryClient.invalidateQueries({ queryKey: charactersQueryKeys.all });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to create character'));
    },
  });
}

// Activating a character also flips which NPC is active (the backend
// deactivates the previous active row), so invalidate the npc query domain
// too (mirrors the `npcQueryKeys.all` invalidation in `useActivateNPC`).
export function useActivateCharacter() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, unknown, number>({
    mutationFn: (characterId) => characterService.activateCharacter(characterId),
    onSuccess: () => {
      showSuccess('Character activated successfully');
      queryClient.invalidateQueries({ queryKey: charactersQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['npc'] });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to activate character'));
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<void, unknown, number>({
    mutationFn: (characterId) => characterService.deleteCharacter(characterId),
    onSuccess: () => {
      showSuccess('Character deleted successfully');
      queryClient.invalidateQueries({ queryKey: charactersQueryKeys.all });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to delete character'));
    },
  });
}

interface UpdateCharacterVariables {
  characterId: number;
  data: Partial<Character>;
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<Character, unknown, UpdateCharacterVariables>({
    mutationFn: ({ characterId, data }) =>
      characterService.updateCharacter(characterId, data),
    onSuccess: () => {
      showSuccess('Character updated successfully');
      queryClient.invalidateQueries({ queryKey: charactersQueryKeys.all });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to update character'));
    },
  });
}
