'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { eventsService, GameEvent } from '@/services/eventsService';
import { useToast } from './ToastContext';

interface EventsContextValue {
  activeEvent: GameEvent | null;
  recentEvents: GameEvent[];
  loading: boolean;
  error: string | null;
  fetchActiveEvent: (locationId: string) => Promise<GameEvent | null>;
  fetchRecentEvents: (locationId: string, limit?: number) => Promise<GameEvent[]>;
  createEvent: (title: string, type: 'lore' | 'duel' | 'quest', locationId: number, description?: string) => Promise<void>;
  closeEvent: (eventId: number) => Promise<void>;
  freezeEvent: (eventId: number) => Promise<void>;
  unfreezeEvent: (eventId: number) => Promise<void>;
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

export const useEvents = (): EventsContextValue => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};

interface EventsProviderProps {
  children: ReactNode;
}

const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return defaultMessage;
};

export const EventsProvider: React.FC<EventsProviderProps> = ({ children }) => {
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchActiveEvent = useCallback(async (locationId: string): Promise<GameEvent | null> => {
    try {
      setLoading(true);
      setError(null);
      const event = await eventsService.getActiveEvent(locationId);
      setActiveEvent(event);
      return event;
    } catch (err: unknown) {
      console.error('Error fetching active event:', err);
      setActiveEvent(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentEvents = useCallback(async (locationId: string, limit = 5): Promise<GameEvent[]> => {
    try {
      setLoading(true);
      setError(null);
      const events = await eventsService.getRecentEvents(locationId, limit);
      setRecentEvents(events);
      return events;
    } catch (err: unknown) {
      console.error('Error fetching recent events:', err);
      setRecentEvents([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (
    title: string,
    type: 'lore' | 'duel' | 'quest',
    locationId: number,
    description?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await eventsService.createEvent({ title, type, description, locationId });
      if (result.success) {
        showSuccess('Event created successfully');
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to create event');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const closeEvent = useCallback(async (eventId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await eventsService.closeEvent(eventId);
      if (result.success) {
        showSuccess('Event closed successfully');
        setActiveEvent(null);
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to close event');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const freezeEvent = useCallback(async (eventId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await eventsService.freezeEvent(eventId);
      if (result.success) {
        showSuccess('Event frozen successfully');
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to freeze event');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const unfreezeEvent = useCallback(async (eventId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await eventsService.unfreezeEvent(eventId);
      if (result.success) {
        showSuccess('Event unfrozen successfully');
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to unfreeze event');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const value: EventsContextValue = {
    activeEvent,
    recentEvents,
    loading,
    error,
    fetchActiveEvent,
    fetchRecentEvents,
    createEvent,
    closeEvent,
    freezeEvent,
    unfreezeEvent,
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};
