import { api } from './apiClient';

export interface CombatRound {
  id: number;
  roundNumber: number;
  status: string;
  resolvedAt?: string;
  resolutionData?: {
    summary?: {
      totalActions: number;
      clashCount: number;
      independentCount: number;
    };
  };
  actions?: CombatAction[];
}

export interface CombatAction {
  id: number;
  characterData: { name: string };
  skillData: { name: string; target: string };
  targetData?: { name: string };
  finalOutput: number;
  rollQuality: string;
}

interface CreateCombatRoundData {
  locationId: number;
  eventId: number;
}

class CombatRoundsService {
  /**
   * Get the active combat round for a location
   */
  async getActiveCombatRound(locationId: string): Promise<CombatRound | null> {
    const response = await api.get<{ round: CombatRound }>(
      `/combat/rounds/active/${locationId}`
    );
    return response.data.round;
  }

  /**
   * Get resolved combat rounds for a location
   */
  async getResolvedCombatRounds(locationId: string, limit = 5): Promise<CombatRound[]> {
    const response = await api.get<{ rounds: CombatRound[] }>(
      `/combat/rounds/resolved/${locationId}?limit=${limit}`
    );
    return response.data.rounds || [];
  }

  /**
   * Create a new combat round
   */
  async createCombatRound(data: CreateCombatRoundData): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/combat/rounds', data);
    return response.data;
  }

  /**
   * Resolve an active combat round
   */
  async resolveCombatRound(roundId: number): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(
      `/combat/rounds/${roundId}/resolve`,
      {}
    );
    return response.data;
  }

  /**
   * Cancel an active combat round
   */
  async cancelCombatRound(roundId: number): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(
      `/combat/rounds/${roundId}/cancel`,
      {}
    );
    return response.data;
  }
}

export const combatRoundsService = new CombatRoundsService();
