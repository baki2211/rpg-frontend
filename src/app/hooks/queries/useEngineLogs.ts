'use client';

import { useQuery } from '@tanstack/react-query';
import { engineLogsService } from '../../../services/engineLogsService';
import { useToastOnError } from './_useToastOnError';

export const engineLogsQueryKeys = {
  all: ['engineLogs'] as const,
  byLocation: (locationId: string) => ['engineLogs', { locationId }] as const,
};

export function useEngineLogsByLocation(locationId: string) {
  const query = useQuery({
    queryKey: engineLogsQueryKeys.byLocation(locationId),
    queryFn: () => engineLogsService.getLogsByLocation(locationId),
  });
  useToastOnError(query.error, 'Failed to fetch engine logs');
  return query;
}