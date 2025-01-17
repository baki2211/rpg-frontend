'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  role: string;
}

interface Race {
  id: number;
  name: string;
  description: string;
  baseHp: number;
}

interface Character {
  id: number;
  name: string;
  surname: string;
  age: number;
  gender: string;
  race: Race;
  isActive: boolean;
}

const CharacterPanel = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [races, setRaces] = useState<Race[]>([]); // Initialize as an array
  const [user, setUser] = useState<User | null>(null);
  const [characterData, setCharacterData] = useState({
    userId: null as number | null,
    name: '',
    surname: '',
    age: 0,
    gender: '',
    raceId: null as number | null, // Ensure raceId is of type number or null
    stats: {
      STR: 0,
      DEX: 0,
      RES: 0,
      MN: 0,
      CHA: 0,
    },
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUser();
    fetchCharacters();
    fetchRaces();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/user/', { withCredentials: true });
      const fetchedUser = response.data;
      setUser(fetchedUser);
      setCharacterData((prev) => ({
        ...prev,
        userId: fetchedUser.id, // Attach userId to characterData
      }));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setErrorMessage('Failed to fetch user');
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/characters', { withCredentials: true });
      setCharacters(response.data);
    } catch (error) {
      console.error('Failed to fetch characters:', error);
      setErrorMessage('Failed to fetch characters');
    }
  };

  const fetchRaces = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/races', { withCredentials: true });
      setRaces(response.data); // Ensure races is an array
    } catch (error) {
      console.error('Failed to fetch races:', error);
      setErrorMessage('Failed to fetch races');
    }
  };

  const handleCharacterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!user || !characterData.userId) {
      console.error('User or userId not found');
      setErrorMessage('You must be logged in to create a character');
      return;
    }
  
    if (!characterData.raceId) {
      console.error('RaceId not selected');
      setErrorMessage('Please select a race');
      return;
    }
  
    const newCharacterData = { 
      ...characterData,
      userId: user.id, 
    };
    console.log('Submitting Character Data:', newCharacterData);
  
    try {
      await axios.post('http://localhost:5001/api/characters/new', newCharacterData, { withCredentials: true });
      setCharacterData({
        userId: user.id,
        name: '',
        surname: '',
        age: 0,
        gender: '',
        raceId: null,
        stats: { STR: 0, DEX: 0, RES: 0, MN: 0, CHA: 0 },
      });
      setSuccessMessage('Character created successfully');
      fetchCharacters();
    } catch (error) {
      console.error('Failed to create character:', error);
      setErrorMessage('Failed to create character');
    }
  };

  const handleActivateCharacter = async (characterId: number) => {
    try {
      await axios.put(`http://localhost:5001/api/characters/${characterId}/activate`, {}, { withCredentials: true });
      fetchCharacters();
    } catch (error) {
      console.error('Failed to activate character:', error);
      setErrorMessage('Failed to activate character');
    }
  };

  const handleDeleteCharacter = async (characterId: number) => {
    try {
      await axios.delete(`http://localhost:5001/api/characters/${characterId}`, { withCredentials: true });
      fetchCharacters();
    } catch (error) {
      console.error('Failed to delete character:', error);
      setErrorMessage('Failed to delete character');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Character Management</h2>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

      {/* Create Character Form */}
      <form onSubmit={handleCharacterSubmit}>
        <h3>Create New Character</h3>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={characterData.name}
            onChange={(e) => setCharacterData({ ...characterData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Surname:</label>
          <input
            type="text"
            value={characterData.surname}
            onChange={(e) => setCharacterData({ ...characterData, surname: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Age:</label>
          <input
            type="number"
            value={characterData.age}
            onChange={(e) => setCharacterData({ ...characterData, age: parseInt(e.target.value, 10) })}
            required
          />
        </div>
        <div>
          <label>Gender:</label>
          <select
            value={characterData.gender}
            onChange={(e) => setCharacterData({ ...characterData, gender: e.target.value })}
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label>Race:</label>
          <select
            value={characterData.raceId || ''}
            onChange={(e) => setCharacterData({ ...characterData, raceId: parseInt(e.target.value, 10) })}
            required
          >
            <option value="">Select Race</option>
    {races.length > 0 ? (
      races.map((race) => (
        <option key={race.id} value={race.id}>
          {race.name}
        </option>
      ))
    ) : (
      <option value="">No races available</option>
            )}
          </select>
        </div>
        <button type="submit">Create Character</button>
      </form>

      {/* Display Existing Characters */}
      <h3>Your Characters</h3>
      <ul>
    {characters.map((character) => (
      <li key={character.id}>
        <strong>{character.name} {character.surname}</strong> 
        (Race: {character.race?.name || 'Unknown'}) -{' '}
        <em>{character.isActive ? 'Active' : 'Not Active'}</em>
        <br />
        <button
          onClick={() => handleActivateCharacter(character.id)}
          disabled={character.isActive}
        >
          {character.isActive ? 'Active' : 'Activate'}
        </button>
        <button onClick={() => handleDeleteCharacter(character.id)}>Delete</button>
      </li>
    ))}
  </ul>

    </div>
  );
};

export default CharacterPanel;
