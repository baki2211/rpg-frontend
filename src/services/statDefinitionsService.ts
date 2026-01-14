import { api } from './apiClient';

export interface StatDefinition {
  internalName: string;
  displayName: string;
  description?: string;
  minValue: number;
  maxValue: number | null;
  defaultValue: number;
  category?: string;
}

class StatDefinitionsService {
  async getStatDefinitions(category?: string, activeOnly?: boolean): Promise<StatDefinition[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (activeOnly !== undefined) params.append('activeOnly', activeOnly.toString());

    const queryString = params.toString();
    const url = queryString ? `/stat-definitions?${queryString}` : '/stat-definitions';

    const response = await api.get<StatDefinition[]>(url);
    return response.data;
  }

  async getPrimaryStats(): Promise<StatDefinition[]> {
    return this.getStatDefinitions('primary_stat', true);
  }
}

export const statDefinitionsService = new StatDefinitionsService();
