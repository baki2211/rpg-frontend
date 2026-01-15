import { api } from './apiClient';

export interface GameEvent {
  id: number;
  title: string;
  type: 'lore' | 'duel' | 'quest';
  description?: string;
  status: 'active' | 'closed';
  createdAt: string;
  closedAt?: string;
  eventData?: {
    totalRounds: number;
    resolvedRounds: number;
    cancelledRounds: number;
    totalActions: number;
  };
  session?: {
    status: 'frozen' | 'open';
  };
}

interface CreateEventData {
  title: string;
  type: 'lore' | 'duel' | 'quest';
  description?: string;
  locationId: number;
}

class EventsService {
  /**
   * Get the active event for a location
   */
  async getActiveEvent(locationId: string): Promise<GameEvent | null> {
    const response = await api.get<{ event: GameEvent }>(
      `/events/active/${locationId}`
    );
    return response.data.event;
  }

  /**
   * Get recent events for a location
   */
  async getRecentEvents(locationId: string, limit = 5): Promise<GameEvent[]> {
    const response = await api.get<{ events: GameEvent[] }>(
      `/events/location/${locationId}?limit=${limit}`
    );
    return response.data.events || [];
  }

  /**
   * Create a new event
   */
  async createEvent(data: CreateEventData): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/events', data);
    return response.data;
  }

  /**
   * Close an active event
   */
  async closeEvent(eventId: number): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(
      `/events/${eventId}/close`,
      {}
    );
    return response.data;
  }

  /**
   * Freeze an active event and its session
   */
  async freezeEvent(eventId: number): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(
      `/events/${eventId}/freeze`,
      {}
    );
    return response.data;
  }

  /**
   * Unfreeze an event and restore its session
   */
  async unfreezeEvent(eventId: number): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(
      `/events/${eventId}/unfreeze`,
      {}
    );
    return response.data;
  }
}

export const eventsService = new EventsService();
