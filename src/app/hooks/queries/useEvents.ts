'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsService, GameEvent } from '../../../services/eventsService';
import { useToast } from '../../contexts/ToastContext';
import { getErrorMessage } from '../../../utils/errorHandling';
import { useToastOnError } from './_useToastOnError';

export const eventsQueryKeys = {
  all: ['events'] as const,
  location: (locationId: string) => ['events', 'location', locationId] as const,
  active: (locationId: string) =>
    ['events', 'location', locationId, 'active'] as const,
  recent: (locationId: string, limit: number) =>
    ['events', 'location', locationId, 'recent', limit] as const,
};

interface UseEventsQueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useActiveEvent(
  locationId: string,
  { enabled = true, refetchInterval = false }: UseEventsQueryOptions = {}
) {
  const query = useQuery<GameEvent | null>({
    queryKey: eventsQueryKeys.active(locationId),
    queryFn: () => eventsService.getActiveEvent(locationId),
    enabled: enabled && Boolean(locationId),
    refetchInterval,
  });
  useToastOnError(query.error, 'Failed to fetch active event');
  return query;
}

export function useRecentEvents(
  locationId: string,
  limit = 5,
  { enabled = true, refetchInterval = false }: UseEventsQueryOptions = {}
) {
  const query = useQuery<GameEvent[]>({
    queryKey: eventsQueryKeys.recent(locationId, limit),
    queryFn: () => eventsService.getRecentEvents(locationId, limit),
    enabled: enabled && Boolean(locationId),
    refetchInterval,
  });
  useToastOnError(query.error, 'Failed to fetch recent events');
  return query;
}

interface CreateEventVariables {
  title: string;
  type: 'lore' | 'duel' | 'quest';
  locationId: number;
  description?: string;
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<{ success: boolean }, unknown, CreateEventVariables>({
    mutationFn: (vars) => eventsService.createEvent(vars),
    onSuccess: (_result, vars) => {
      showSuccess('Event created successfully');
      queryClient.invalidateQueries({
        queryKey: eventsQueryKeys.location(String(vars.locationId)),
      });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to create event'));
    },
  });
}

interface EventLocationVariables {
  eventId: number;
  locationId: string;
}

export function useCloseEvent() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<{ success: boolean }, unknown, EventLocationVariables>({
    mutationFn: ({ eventId }) => eventsService.closeEvent(eventId),
    onSuccess: (_result, { locationId }) => {
      showSuccess('Event closed successfully');
      queryClient.invalidateQueries({
        queryKey: eventsQueryKeys.location(locationId),
      });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to close event'));
    },
  });
}

export function useFreezeEvent() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<{ success: boolean }, unknown, EventLocationVariables>({
    mutationFn: ({ eventId }) => eventsService.freezeEvent(eventId),
    onSuccess: (_result, { locationId }) => {
      showSuccess('Event frozen successfully');
      queryClient.invalidateQueries({
        queryKey: eventsQueryKeys.location(locationId),
      });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to freeze event'));
    },
  });
}

export function useUnfreezeEvent() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation<{ success: boolean }, unknown, EventLocationVariables>({
    mutationFn: ({ eventId }) => eventsService.unfreezeEvent(eventId),
    onSuccess: (_result, { locationId }) => {
      showSuccess('Event unfrozen successfully');
      queryClient.invalidateQueries({
        queryKey: eventsQueryKeys.location(locationId),
      });
    },
    onError: (err) => {
      showError(getErrorMessage(err, 'Failed to unfreeze event'));
    },
  });
}
