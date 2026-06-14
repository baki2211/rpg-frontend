'use client';

import { useQuery } from '@tanstack/react-query';
import { locationService } from '@/services/locationService';
import { Location } from '@/types/types';
import { useAuthGate } from './_useAuthGate';
import { useToastOnError } from './_useToastOnError';

export const locationsQueryKeys = {
  all: ['locations'] as const,
  byId: (locationId: string) => ['locations', { locationId }] as const,
};

export function useLocation(locationId: string | null) {
  const query = useQuery<Location>({
    queryKey: locationsQueryKeys.byId(locationId ?? ''),
    queryFn: () => locationService.getLocationById(locationId!),
    enabled: useAuthGate(!!locationId),
  });
  useToastOnError(query.error, 'Failed to fetch location');
  return query;
}
