'use client';

import { useQuery } from '@tanstack/react-query';
import { raceService } from '../../../services/raceService';
import { Race } from '../../../types/character';
import { useToastOnError } from './_useToastOnError';

export const racesQueryKeys = {
  all: ['races'] as const,
  playable: ['races', 'playable'] as const,
};

export function useRaces() {
  const query = useQuery<Race[]>({
    queryKey: racesQueryKeys.all,
    queryFn: () => raceService.getRaces(),
  });
  useToastOnError(query.error, 'Failed to fetch races');
  return query;
}

export function usePlayableRaces() {
  const query = useQuery<Race[]>({
    queryKey: racesQueryKeys.playable,
    queryFn: () => raceService.getPlayableRaces(),
  });
  useToastOnError(query.error, 'Failed to fetch playable races');
  return query;
}
