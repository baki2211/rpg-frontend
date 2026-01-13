import { api } from './apiClient';

export interface SkillValidationRule {
  id: number;
  skillType: string;
  skillSubtype: string;
  minBasePower: number;
  maxBasePower: number;
  minAetherCost: number;
  maxAetherCost: number;
  description?: string;
  isActive: boolean;
}

export interface SkillTypesByCategory {
  attack: SkillValidationRule[];
  defence: SkillValidationRule[];
  counter: SkillValidationRule[];
  buff_debuff: SkillValidationRule[];
  healing: SkillValidationRule[];
}

class SkillValidationService {
  async getRulesByCategory(): Promise<SkillTypesByCategory> {
    const response = await api.get<SkillTypesByCategory>('/skill-validation-rules/categories');
    return response.data;
  }

  async updateRule(id: number, updateData: Partial<SkillValidationRule>): Promise<SkillValidationRule> {
    const response = await api.put<SkillValidationRule>(`/skill-validation-rules/${id}`, updateData);
    return response.data;
  }

  async initializeDefaults(): Promise<{ createdRules: number }> {
    const response = await api.post<{ createdRules: number }>('/skill-validation-rules/initialize');
    return response.data;
  }
}

export const skillValidationService = new SkillValidationService();
