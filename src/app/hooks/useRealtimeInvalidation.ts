'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { eventsQueryKeys } from './queries/useEvents';
import { engineLogsQueryKeys } from './queries/useEngineLogs';

const EVENT_INVALIDATING_TYPES = new Set([
  'event_created',
  'event_closed',
  'event_frozen',
  'event_unfrozen',
  'event_updated',
]);

interface RealtimeMessage {
  type?: string;
  locationId?: string | number;
}

export function useRealtimeInvalidation(locationId: string) {
  const queryClient = useQueryClient();

  return useCallback(
    (message: unknown) => {
      if (!message || typeof message !== 'object') return;
      const { type, locationId: msgLocationId } = message as RealtimeMessage;
      if (!type) return;

      // If the WS message carries its own locationId, only invalidate when
      // it matches the page we're mounted on. Otherwise assume same location.
      if (
        msgLocationId !== undefined &&
        String(msgLocationId) !== locationId
      ) {
        return;
      }

      if (EVENT_INVALIDATING_TYPES.has(type)) {
        queryClient.invalidateQueries({
          queryKey: eventsQueryKeys.location(locationId),
        });
      }

      if (type === 'skill_engine_log') {
        queryClient.invalidateQueries({
          queryKey: engineLogsQueryKeys.byLocation(locationId),
        });
      }
    },
    [locationId, queryClient]
  );
}
