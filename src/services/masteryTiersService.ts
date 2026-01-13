import { api } from './apiClient';

export interface MasteryTier {
  id: number;
  tier: number;
  tierName: string;
  usesRequired: number;
  multiplier: number;
  description?: string;
  isActive: boolean;
}

class MasteryTiersService {
  async getTiers(): Promise<MasteryTier[]> {
    const response = await api.get<MasteryTier[]>('/admin/mastery-tiers');
    return response.data;
  }

  async createTier(tierData: Partial<MasteryTier>): Promise<MasteryTier> {
    const response = await api.post<MasteryTier>('/admin/mastery-tiers', tierData);
    return response.data;
  }

  async updateTier(id: number, updateData: Partial<MasteryTier>): Promise<MasteryTier> {
    const response = await api.put<MasteryTier>(`/admin/mastery-tiers/${id}`, updateData);
    return response.data;
  }

  async deleteTier(id: number): Promise<void> {
    await api.delete(`/admin/mastery-tiers/${id}`);
  }

  async initializeDefaults(): Promise<{ createdTiers: number }> {
    const response = await api.post<{ createdTiers: number }>('/admin/mastery-tiers/initialize');
    return response.data;
  }
}

export const masteryTiersService = new MasteryTiersService();
