import { api } from './apiClient';

export interface NPC {
  id: number;
  name: string;
  surname: string;
  background?: string;
  imageUrl?: string;
  rank: number;
  experience: number;
  skillPoints: number;
  race: {
    id: number;
    name: string;
  };
}

export interface ActiveCharacter {
  id: number;
  name: string;
  surname: string;
  isNPC?: boolean;
  isActive?: boolean;
}

class NPCService {
  async getAvailableNPCs(): Promise<NPC[]> {
    const response = await api.get<NPC[]>('/characters/npcs/available');
    return response.data;
  }

  async getActiveCharacter(): Promise<ActiveCharacter | null> {
    const response = await api.get<ActiveCharacter[]>('/characters/');
    const activeChar = response.data.find((char) => char.isActive);
    return activeChar || null;
  }

  async activateNPC(npcId: number): Promise<void> {
    await api.post(`/characters/npcs/${npcId}/activate`, {});
  }

  async deactivateNPC(characterId: number): Promise<void> {
    await api.post(`/characters/npcs/${characterId}/deactivate`, {});
  }
}

export const npcService = new NPCService();
