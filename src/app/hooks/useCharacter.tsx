import { useState, useEffect } from "react";
import { api } from "../../services/apiClient";

export interface Race {
  id: number;
  name: string;
  description: string;
  baseHp: number;
}

export interface Skill {
  id: number;
  name: string;
  description: string;
  skillPointCost: number;
  branchId: number;
  typeId: number;
  rank: number;
  isPassive: boolean;
  target: 'self' | 'other' | 'none' | 'any';
  branch: {
    name: string;
  };
  type: {
    name: string;
  };
}

export interface Character {
  id: number;
  userId: number;
  name: string;
  surname: string;
  age: number;
  gender: string;
  race: Race;
  isActive: boolean;
  imageUrl?: string;
  skills: Skill[];
  skillPoints: number;
  isNPC?: boolean;
}

export interface ActiveCharacterStatus {
  userCharacters: Character[];
  assignedNPCs: Character[];
  activeCount: number;
  hasConflict: boolean;
}

export const useCharacters = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeNPCs, setActiveNPCs] = useState<Character[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchCharacters();
    fetchActiveNPCs();
    fetchRaces();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await api.get<Character[]>('/characters?include=skills,race');
      // Ensure skills array exists for each character and is properly initialized
      // Filter out any NPCs that might be included (they should only come from fetchActiveNPCs)
      const charactersWithSkills = response.data
        .filter((char: Character) => !char.isNPC) // Only include user's own characters
        .map((char: Character) => ({
          ...char,
          skills: Array.isArray(char.skills) ? char.skills : [],
          skillPoints: char.skillPoints || 0,
          isNPC: false
        }));
      setCharacters(charactersWithSkills);
    } catch (error) {
      console.error("Failed to fetch characters:", error);
      setError("Failed to fetch characters");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveNPCs = async () => {
    try {
      // This endpoint should return any NPCs currently assigned to the user
      const response = await api.get<Character>('/characters/active-npc');
      
      if (response.data) {
        const npcWithSkills = {
          ...response.data,
          skills: Array.isArray(response.data.skills) ? response.data.skills : [],
          skillPoints: response.data.skillPoints || 0,
          isNPC: true
        };
        setActiveNPCs([npcWithSkills]);
      } else {
        setActiveNPCs([]);
      }
    } catch {
      // If no active NPC or error, just set empty array
      setActiveNPCs([]);
    }
  };

  const fetchRaces = async () => {
    try {
      const response = await api.get<Race[]>('/races');
      setRaces(response.data);
    } catch (error) {
      console.error("Failed to fetch races:", error);
      setError("Failed to fetch races");
    }
  };

  const createCharacter = async (formData: FormData) => {
    try {
      const response = await api.post<Character>('/characters/new', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setCharacters(prev => [...prev, response.data]);
    } catch (error) {
      console.error("Failed to create character:", error);
      setError("Failed to create character");
      throw error; // Re-throw to handle in the component
    }
  };

  const activateCharacter = async (characterId: number) => {
    console.log('Activating character:', characterId);

    try {
      await api.put(`/characters/${characterId}/activate`, {});
      // Refresh both characters and NPCs to reflect the change
      await fetchCharacters();
      await fetchActiveNPCs();
    } catch (error) {
      console.error("Failed to activate character:", error);
      throw error; // Re-throw so the component can handle it
    }
  };

  const deleteCharacter = async (characterId: number) => {
    try {
      const response = await api.delete(`/characters/${characterId}/delete`);
      
      // Only update state if the request was successful
      if (response.status === 204) {
        setCharacters(prev => prev.filter(char => char.id !== characterId));
      }
    } catch (error) {
      console.error("Failed to delete character:", error);
      setError("Failed to delete character");
      throw error; // Re-throw so the component can handle it if needed
    }
  };

  // Get all characters and NPCs combined for display
  const getAllCharactersAndNPCs = () => {
    // Create a map to prevent duplicates based on ID and type
    const characterMap = new Map();
    
    // Add regular characters
    characters.forEach(char => {
      characterMap.set(`char-${char.id}`, char);
    });
    
    // Add NPCs (they should have different IDs, but just in case)
    activeNPCs.forEach(npc => {
      characterMap.set(`npc-${npc.id}`, npc);
    });
    
    return Array.from(characterMap.values());
  };

  // Get only the active character/NPC
  const getActiveCharacter = () => {
    const allCharacters = getAllCharactersAndNPCs();
    return allCharacters.find(char => char.isActive) || null;
  };

  return {
    characters,
    activeNPCs,
    allCharacters: getAllCharactersAndNPCs(),
    activeCharacter: getActiveCharacter(),
    races,
    loading,
    error,
    fetchCharacters,
    fetchActiveNPCs,
    fetchRaces,
    createCharacter,
    activateCharacter,
    deleteCharacter,
  };
};
