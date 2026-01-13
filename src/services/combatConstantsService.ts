import { api } from './apiClient';

export interface CombatConstant {
  id: number;
  constantKey: string;
  displayName: string;
  description: string;
  value: number;
  category: 'hp_system' | 'aether_system' | 'damage_system' | 'mastery_system' | 'outcome_system';
  minValue?: number;
  maxValue?: number;
  isPercentage: boolean;
  isActive: boolean;
}

export interface ConstantsByCategory {
  hp_system: CombatConstant[];
  aether_system: CombatConstant[];
  damage_system: CombatConstant[];
  mastery_system: CombatConstant[];
  outcome_system: CombatConstant[];
}

class CombatConstantsService {
  async getConstantsByCategory(): Promise<ConstantsByCategory> {
    const response = await api.get<ConstantsByCategory>('/combat-constants/categories');
    return response.data;
  }

  async updateConstant(id: number, value: number): Promise<CombatConstant> {
    const response = await api.put<CombatConstant>(`/combat-constants/${id}`, { value });
    return response.data;
  }

  async initializeDefaults(): Promise<{ createdConstants: number }> {
    const response = await api.post<{ createdConstants: number }>('/combat-constants/initialize');
    return response.data;
  }
}

export const combatConstantsService = new CombatConstantsService();
