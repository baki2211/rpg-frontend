import { useState, useEffect } from "react";
import axios from "axios";

export interface Race {
  id: number;
  name: string;
  description: string;
  baseHp: number;
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
      const response = await axios.get("http://localhost:5001/api/characters", { withCredentials: true });
      setCharacters(response.data);
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
      await axios.delete(`http://localhost:5001/api/characters/${characterId}/delete`, {
        withCredentials: true,
      });
      setCharacters(prev => prev.filter(char => char.id !== characterId));
    } catch (error) {
      console.error("Failed to delete character:", error);
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
