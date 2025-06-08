import { useState, useEffect } from "react";
import axios from "axios";

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
  target: 'self' | 'other' | 'none';
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
}

export const useCharacters = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchCharacters();
    fetchRaces();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/characters?include=skills,race", { 
        withCredentials: true 
      });
      // Ensure skills array exists for each character and is properly initialized
      const charactersWithSkills = response.data.map((char: Character) => ({
        ...char,
        skills: Array.isArray(char.skills) ? char.skills : [],
        skillPoints: char.skillPoints || 0
      }));
      setCharacters(charactersWithSkills);
    } catch (error) {
      console.error("Failed to fetch characters:", error);
      setError("Failed to fetch characters");
    } finally {
      setLoading(false);
    }
  };

  const fetchRaces = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/races", { withCredentials: true });
      setRaces(response.data);
    } catch (error) {
      console.error("Failed to fetch races:", error);
      setError("Failed to fetch races");
    }
  };

  const createCharacter = async (formData: FormData) => {
    try {
      const response = await axios.post("http://localhost:5001/api/characters/new", formData, { 
        withCredentials: true,
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

  const activateCharacter = async (characterId: number, userId: number) => {
    console.log('Activating character:', characterId);

    try {
      await axios.put(
        `http://localhost:5001/api/characters/${characterId}/activate`,
        { userId },
        { withCredentials: true }
      );
      await fetchCharacters();
    } catch (error) {
      console.error("Failed to activate character:", error);
    }
  };

  const deleteCharacter = async (characterId: number) => {
    try {
      const response = await axios.delete(`http://localhost:5001/api/characters/${characterId}/delete`, {
        withCredentials: true,
      });
      
      // Only update state if the request was successful
      if (response.status === 204) {
        setCharacters(prev => prev.filter(char => char.id !== characterId));
      }
    } catch (error) {
      console.error("Failed to delete character:", error);
      
      // Check if it's an authentication error
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setError("Authentication required. Please log in again.");
        } else if (error.response?.status === 403) {
          setError("You don't have permission to delete this character.");
        } else if (error.response?.status === 404) {
          setError("Character not found.");
        } else {
          setError(error.response?.data?.error || "Failed to delete character");
        }
      } else {
        setError("Network error. Please try again.");
      }
      throw error; // Re-throw so the component can handle it if needed
    }
  };
  

  return {
    characters,
    races,
    loading,
    error,
    fetchCharacters,
    fetchRaces,
    createCharacter,
    activateCharacter,
    deleteCharacter,
  };
};
