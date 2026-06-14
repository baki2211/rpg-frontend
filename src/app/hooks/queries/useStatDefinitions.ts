'use client';

import { useQuery } from '@tanstack/react-query';
import { statDefinitionsService, StatDefinition } from '@/services/statDefinitionsService';
import { useToastOnError } from './_useToastOnError';

export const statDefinitionsQueryKeys = {
  all: ['statDefinitions'] as const,
  list: (category?: string, activeOnly?: boolean) =>
    ['statDefinitions', { category: category ?? null, activeOnly: activeOnly ?? null }] as const,
  primary: ['statDefinitions', 'primary'] as const,
};

export function useStatDefinitions(category?: string, activeOnly?: boolean) {
  const query = useQuery<StatDefinition[]>({
    queryKey: statDefinitionsQueryKeys.list(category, activeOnly),
    queryFn: () => statDefinitionsService.getStatDefinitions(category, activeOnly),
  });
  useToastOnError(query.error, 'Failed to fetch stat definitions');
  return query;
}

export function usePrimaryStats() {
  const query = useQuery<StatDefinition[]>({
    queryKey: statDefinitionsQueryKeys.primary,
    queryFn: () => statDefinitionsService.getPrimaryStats(),
  });
  useToastOnError(query.error, 'Failed to fetch primary stats');
  return query;
}
