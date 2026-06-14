import { api } from './apiClient';

export interface WikiSection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  position: number;
  isActive: boolean;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WikiEntry {
  id: number;
  sectionId: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  tags: string[];
  isPublished: boolean;
  position: number;
  viewCount: number;
  parentEntryId?: number;
  level: number;
  createdAt: string;
  updatedAt: string;
  section?: {
    name: string;
    slug: string;
  };
  children?: WikiEntry[];
}

export interface WikiStats {
  totalSections: number;
  activeSections: number;
  totalEntries: number;
  publishedEntries: number;
  totalViews: number;
  popularTags: Array<{ tag: string; count: number }>;
}

export interface WikiSectionPayload {
  name: string;
  description?: string;
  position: number;
  isActive: boolean;
}

export interface WikiEntryPayload {
  sectionId: number;
  title: string;
  content: string;
  tags: string[];
  isPublished: boolean;
  parentEntryId: number | null;
}

export interface SectionOrderItem {
  id: number;
  position: number;
}

export interface EntryOrderItem {
  id: number;
  position: number;
}

interface WikiEnvelope<T> {
  success: boolean;
  data: T;
}

class WikiService {
  async getSections(): Promise<WikiSection[]> {
    const response = await api.get<WikiEnvelope<WikiSection[]>>('/wiki/admin/sections');
    return response.data.data;
  }

  async getEntries(): Promise<WikiEntry[]> {
    const response = await api.get<WikiEnvelope<WikiEntry[]>>('/wiki/admin/entries');
    return response.data.data;
  }

  async getHierarchicalEntries(sectionId: number): Promise<WikiEntry[]> {
    const response = await api.get<WikiEnvelope<WikiEntry[]>>(
      `/wiki/admin/sections/${sectionId}/entries/hierarchical`
    );
    return response.data.data;
  }

  async getStats(): Promise<WikiStats> {
    const response = await api.get<WikiEnvelope<WikiStats>>('/wiki/admin/stats');
    return response.data.data;
  }

  async createSection(payload: WikiSectionPayload): Promise<void> {
    await api.post('/wiki/admin/sections', payload);
  }

  async updateSection(id: number, payload: WikiSectionPayload): Promise<void> {
    await api.put(`/wiki/admin/sections/${id}`, payload);
  }

  async deleteSection(id: number): Promise<void> {
    await api.delete(`/wiki/admin/sections/${id}`);
  }

  async reorderSections(sectionOrder: SectionOrderItem[]): Promise<void> {
    await api.put('/wiki/admin/sections/reorder', { sectionOrder });
  }

  async createEntry(payload: WikiEntryPayload): Promise<void> {
    await api.post('/wiki/admin/entries', payload);
  }

  async updateEntry(id: number, payload: WikiEntryPayload): Promise<void> {
    await api.put(`/wiki/admin/entries/${id}`, payload);
  }

  async deleteEntry(id: number): Promise<void> {
    await api.delete(`/wiki/admin/entries/${id}`);
  }

  async reorderEntries(sectionId: number, entryOrder: EntryOrderItem[]): Promise<void> {
    await api.put(`/wiki/admin/sections/${sectionId}/entries/reorder`, { entryOrder });
  }
}

export const wikiService = new WikiService();
