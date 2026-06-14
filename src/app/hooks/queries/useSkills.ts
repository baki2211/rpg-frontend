'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { skillsService } from '../../../services/skillsService';
import { Skill } from '../../../types/character';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../../utils/errorHandling';
import { useAuthGate } from './_useAuthGate';
import { useToastOnError } from './_useToastOnError';
import { charactersQueryKeys } from './useCharacters';

export const skillsQueryKeys = {
  all: ['skills'] as const,
  acquiredAll: ['skills', 'acquired'] as const,
  acquiredByCharacter: (characterId: number) =>
    ['skills', 'acquired', characterId] as const,
  acquired: (characterId: number, include?: string) =>
    ['skills', 'acquired', characterId, { include: include ?? null }] as const,
  availableAll: ['skills', 'available'] as const,
  availableByCharacter: (characterId: number) =>
    ['skills', 'available', characterId] as const,
  available: (characterId: number, include?: string) =>
    ['skills', 'available', characterId, { include: include ?? null }] as const,
};

interface UseSkillsQueryOptions {
  enabled?: boolean;
}

export function useAcquiredSkills(
  characterId: number | null | undefined,
  include?: string,
  options?: UseSkillsQueryOptions,
) {
  const enabled = useAuthGate((options?.enabled ?? true) && characterId != null);
  const query = useQuery<Skill[]>({
    queryKey: skillsQueryKeys.acquired(characterId ?? 0, include),
    queryFn: () => skillsService.getAcquiredSkills(characterId as number, include),
    enabled,
  });
  useToastOnError(query.error, 'Failed to fetch acquired skills');
  return query;
}

export function useAvailableSkills(
  characterId: number | null | undefined,
  include?: string,
  options?: UseSkillsQueryOptions,
) {
  const enabled = useAuthGate((options?.enabled ?? true) && characterId != null);
  const query = useQuery<Skill[]>({
    queryKey: skillsQueryKeys.available(characterId ?? 0, include),
    queryFn: () => skillsService.getAvailableSkills(characterId as number, include),
    enabled,
  });
  useToastOnError(query.error, 'Failed to fetch available skills');
  return query;
}

export function useAcquireSkill(characterId: number | null | undefined) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: (skillId: number) => skillsService.acquireSkill(skillId),
    onSuccess: () => {
      showSuccess('Skill acquired successfully');
      if (characterId != null) {
        queryClient.invalidateQueries({ queryKey: skillsQueryKeys.acquiredByCharacter(characterId) });
        queryClient.invalidateQueries({ queryKey: skillsQueryKeys.availableByCharacter(characterId) });
      } else {
        queryClient.invalidateQueries({ queryKey: skillsQueryKeys.all });
      }
      // Acquiring a skill mutates the player character's skillPoints — refresh
      // the characters list so headers showing remaining points stay in sync.
      // The active-NPC endpoint is unaffected (skill points live on the PC).
      queryClient.invalidateQueries({ queryKey: charactersQueryKeys.list });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to acquire skill'));
    },
  });
}
