import { api } from './apiClient';
import { Skill } from '@/types/character';

export interface AcquiredSkill extends Skill {
  id: number;
  skillId: number;
  characterId: number;
  acquiredAt: string;
}

class SkillsService {
  /**
   * Get all acquired skills for a character
   */
  async getAcquiredSkills(characterId: number, include?: string): Promise<Skill[]> {
    const queryParams = include ? `?include=${include}` : '';
    const response = await api.get<Skill[]>(
      `/character-skills/${characterId}/acquired-skills${queryParams}`
    );
    return response.data;
  }

  /**
   * Get available skills that a character can acquire
   */
  async getAvailableSkills(characterId: number): Promise<Skill[]> {
    const response = await api.get<Skill[]>(
      `/character-skills/${characterId}/available-skills`
    );
    return response.data;
  }

  /**
   * Acquire a new skill for a character
   */
  async acquireSkill(skillId: number): Promise<void> {
    await api.post(`/character-skills/${skillId}`);
  }
}

export const skillsService = new SkillsService();
