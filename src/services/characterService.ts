import { api } from './apiClient';
import { Character } from '../types/character';

class CharacterService {
  async getCharacters(): Promise<Character[]> {
    const response = await api.get<Character[]>('/characters?include=skills,race');
    return response.data;
  }

  async getCharacterById(characterId: number): Promise<Character> {
    const response = await api.get<Character>(`/characters/${characterId}?include=skills,race`);
    return response.data;
  }

  async getActiveNPC(): Promise<Character | null> {
    const response = await api.get<Character>('/characters/active-npc');
    return response.data;
  }

  async createCharacter(formData: FormData): Promise<Character> {
    const response = await api.post<Character>('/characters/new', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async activateCharacter(characterId: number): Promise<void> {
    const response = await api.put<void>(`/characters/${characterId}/activate`, {});
    return response.data;
  }

  async deleteCharacter(characterId: number): Promise<void> {
    const response = await api.delete<void>(`/characters/${characterId}/delete`);
    return response.data;
  }

  async updateCharacter(characterId: number, characterData: Partial<Character>): Promise<Character> {
    const response = await api.put<Character>(`/characters/${characterId}`, characterData);
    return response.data;
  }
}

export const characterService = new CharacterService();
