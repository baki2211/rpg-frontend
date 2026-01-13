import { api } from './apiClient';
import { Race } from '../types/character';

class RaceService {
  async getRaces(): Promise<Race[]> {
    const response = await api.get<Race[]>('/races');
    return response.data;
  }

  async getRaceById(raceId: number): Promise<Race> {
    const response = await api.get<Race>(`/races/${raceId}`);
    return response.data;
  }

  async createRace(raceData: Omit<Race, 'id'>): Promise<Race> {
    const response = await api.post<Race>('/races', raceData);
    return response.data;
  }

  async updateRace(raceId: number, raceData: Partial<Omit<Race, 'id'>>): Promise<Race> {
    const response = await api.put<Race>(`/races/${raceId}`, raceData);
    return response.data;
  }

  async deleteRace(raceId: number): Promise<void> {
    const response = await api.delete<void>(`/races/${raceId}`);
    return response.data;
  }
}

export const raceService = new RaceService();
