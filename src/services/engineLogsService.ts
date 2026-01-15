import { api } from './apiClient';

export interface EngineLog {
  id: string;
  timestamp: Date;
  type: 'skill_use' | 'clash' | 'damage' | 'effect';
  actor: string;
  target?: string;
  skill?: string;
  damage?: number;
  effects?: string[];
  details: string;
}

interface RawEngineLog {
  id: string;
  type: 'skill_use' | 'clash' | 'damage' | 'effect';
  actor: string;
  target?: string;
  skill?: string;
  damage?: number;
  effects?: string[];
  details: string;
  createdAt: string;
}

class EngineLogsService {
  /**
   * Get engine logs for a specific location
   */
  async getLogsByLocation(locationId: string): Promise<EngineLog[]> {
    const response = await api.get<{ success: boolean; logs: RawEngineLog[] }>(
      `/engine-logs/location/${locationId}`
    );

    if (response.data.success) {
      // Transform raw logs to EngineLog format with Date objects
      return response.data.logs.map((log) => ({
        ...log,
        timestamp: new Date(log.createdAt)
      }));
    }

    return [];
  }
}

export const engineLogsService = new EngineLogsService();
