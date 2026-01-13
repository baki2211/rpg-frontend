'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { characterService } from '../../services/characterService';
import { raceService } from '../../services/raceService';
import { useToast } from './ToastContext';
import { useAuth } from '../utils/AuthContext';
import { Character, Race } from '../../types/character';
import { getErrorMessage } from '../../utils/errorHandling';

interface CharacterContextValue {
  // State
  characters: Character[];
  activeNPCs: Character[];
  allCharacters: Character[];
  activeCharacter: Character | null;
  races: Race[];
  loading: boolean;
  error: string | null;
  // Actions
  fetchCharacters: () => Promise<Character[]>;
  fetchActiveNPCs: () => Promise<Character[]>;
  fetchRaces: () => Promise<Race[]>;
  createCharacter: (formData: FormData) => Promise<Character>;
  activateCharacter: (characterId: number) => Promise<void>;
  deleteCharacter: (characterId: number) => Promise<void>;
  updateCharacter: (characterId: number, characterData: Partial<Character>) => Promise<Character>;
}

const CharacterContext = createContext<CharacterContextValue | undefined>(undefined);

interface CharacterProviderProps {
  children: ReactNode;
}

export const CharacterProvider: React.FC<CharacterProviderProps> = ({ children }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeNPCs, setActiveNPCs] = useState<Character[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchCharacters = useCallback(async (): Promise<Character[]> => {
    try {
      setLoading(true);
      setError(null);
      const data = await characterService.getCharacters();

      // Ensure skills array exists for each character and filter out NPCs
      const charactersWithSkills = data
        .filter((char) => !char.isNPC)
        .map((char) => ({
          ...char,
          skills: Array.isArray(char.skills) ? char.skills : [],
          skillPoints: char.skillPoints || 0,
          isNPC: false,
        }));

      setCharacters(charactersWithSkills);
      return charactersWithSkills;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch characters');
      setError(errorMsg);
      console.error('Failed to fetch characters:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveNPCs = useCallback(async (): Promise<Character[]> => {
    try {
      setError(null);
      const data = await characterService.getActiveNPC();

      if (data) {
        const npcWithSkills = {
          ...data,
          skills: Array.isArray(data.skills) ? data.skills : [],
          skillPoints: data.skillPoints || 0,
          isNPC: true,
        };
        setActiveNPCs([npcWithSkills]);
        return [npcWithSkills];
      } else {
        setActiveNPCs([]);
        return [];
      }
    } catch {
      // If no active NPC or error, just set empty array
      setActiveNPCs([]);
      return [];
    }
  }, []);

  const fetchRaces = useCallback(async (): Promise<Race[]> => {
    try {
      setError(null);
      const data = await raceService.getRaces();
      setRaces(data);
      return data;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch races');
      setError(errorMsg);
      console.error('Failed to fetch races:', err);
      throw err;
    }
  }, []);

  const createCharacter = useCallback(async (formData: FormData): Promise<Character> => {
    try {
      setLoading(true);
      setError(null);
      const newCharacter = await characterService.createCharacter(formData);
      setCharacters((prev) => [...prev, newCharacter]);
      showSuccess('Character created successfully');
      return newCharacter;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to create character');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const activateCharacter = useCallback(async (characterId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await characterService.activateCharacter(characterId);

      // Refresh both characters and NPCs to reflect the change
      await Promise.all([fetchCharacters(), fetchActiveNPCs()]);

      showSuccess('Character activated successfully');
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to activate character');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCharacters, fetchActiveNPCs, showSuccess, showError]);

  const deleteCharacter = useCallback(async (characterId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await characterService.deleteCharacter(characterId);

      // Only update state if the request was successful
      setCharacters((prev) => prev.filter((char) => char.id !== characterId));
      showSuccess('Character deleted successfully');
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to delete character');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const updateCharacter = useCallback(async (characterId: number, characterData: Partial<Character>): Promise<Character> => {
    try {
      setLoading(true);
      setError(null);
      const updatedCharacter = await characterService.updateCharacter(characterId, characterData);

      setCharacters((prev) =>
        prev.map((char) => (char.id === characterId ? updatedCharacter : char))
      );
      showSuccess('Character updated successfully');
      return updatedCharacter;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to update character');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  // Memoize all characters and NPCs combined to prevent unnecessary re-computations
  const allCharacters = useMemo(() => {
    const characterMap = new Map<string, Character>();

    characters.forEach((char) => {
      characterMap.set(`char-${char.id}`, char);
    });

    activeNPCs.forEach((npc) => {
      characterMap.set(`npc-${npc.id}`, npc);
    });

    return Array.from(characterMap.values());
  }, [characters, activeNPCs]);

  // Memoize the active character to prevent unnecessary re-computations
  const activeCharacter = useMemo(() => {
    return allCharacters.find((char) => char.isActive) || null;
  }, [allCharacters]);

  // Auto-fetch characters and races only when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchCharacters();
      fetchActiveNPCs();
      fetchRaces();
    }
  }, [isAuthenticated, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<CharacterContextValue>(() => ({
    // State
    characters,
    activeNPCs,
    allCharacters,
    activeCharacter,
    races,
    loading,
    error,
    // Actions
    fetchCharacters,
    fetchActiveNPCs,
    fetchRaces,
    createCharacter,
    activateCharacter,
    deleteCharacter,
    updateCharacter,
  }), [
    characters,
    activeNPCs,
    allCharacters,
    activeCharacter,
    races,
    loading,
    error,
    fetchCharacters,
    fetchActiveNPCs,
    fetchRaces,
    createCharacter,
    activateCharacter,
    deleteCharacter,
    updateCharacter,
  ]);

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacter = (): CharacterContextValue => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
};
