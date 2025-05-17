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
  imageUrl?: string;
}

const CharacterCreationModalPanel = () => {
  const [, setCharacters] = useState<Character[]>([]);
  const [races, setRaces] = useState<Race[]>([]); // Initialize as an array
  const [user, setUser] = useState<User | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
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
  const totalPoints = 40;
  const allocatedPoints = Object.values(characterData.stats).reduce((sum, val) => sum + val, 0);
  const remainingPoints = totalPoints - allocatedPoints;

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

  const handleStatChange = (stat: keyof typeof characterData.stats, value: number) => {
    const newStats = { ...characterData.stats, [stat]: value };
    const newTotal = Object.values(newStats).reduce((sum, val) => sum + val, 0);
    if (newTotal > totalPoints) {
      setErrorMessage(`You have only ${remainingPoints} points remaining.`);
      return;
    }
    setCharacterData({ ...characterData, stats: newStats });
    setErrorMessage(''); 
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

    if (allocatedPoints > totalPoints) {
      setErrorMessage(`Allocated points exceed ${totalPoints}. Please adjust your stats.`);
      return;
    }
  
    // const newCharacterData = { 
    //   ...characterData,
    //   userId: user.id, 
    // };
    // console.log('Submitting Character Data:', newCharacterData);

    const formData = new FormData();
    formData.append('name', characterData.name);
    formData.append('surname', characterData.surname);
    formData.append('age', characterData.age.toString());
    formData.append('gender', characterData.gender);
    formData.append('raceId', characterData.raceId!.toString());
    formData.append('stats', JSON.stringify(characterData.stats));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    formData.append('userId', characterData.userId.toString());
  
    try {
      await axios.post('http://localhost:5001/api/characters/new', 
        formData, 
        { withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
         }
      );
      // setCharacterData({
      //   userId: user.id,
      //   name: '',
      //   surname: '',
      //   age: 0,
      //   gender: '',
      //   raceId: null,
      //   stats: { STR: 0, DEX: 0, RES: 0, MN: 0, CHA: 0 },
      // });
      setSuccessMessage('Character created successfully');
      fetchCharacters();
    } catch (error) {
      console.error('Failed to create character:', error);
      setErrorMessage('Failed to create character');
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
          <label>Character Image:</label>
          <input type="file" accept="image/*" onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setImageFile(e.target.files[0]);
            }
          }} />
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
        <div>
          <h4>Allocate Stat Points (Remaining: {remainingPoints})</h4>
          <label>STR:</label>
          <input
            type="number"
            value={characterData.stats.STR}
            onChange={(e) => handleStatChange('STR', parseInt(e.target.value, 10))}
            min="0"
            required
          />
          <br />
          <label>DEX:</label>
          <input
            type="number"
            value={characterData.stats.DEX}
            onChange={(e) => handleStatChange('DEX', parseInt(e.target.value, 10))}
            min="0"
            required
          />
          <br />
          <label>RES:</label>
          <input
            type="number"
            value={characterData.stats.RES}
            onChange={(e) => handleStatChange('RES', parseInt(e.target.value, 10))}
            min="0"
            required
          />
          <br />
          <label>MN:</label>
          <input
            type="number"
            value={characterData.stats.MN}
            onChange={(e) => handleStatChange('MN', parseInt(e.target.value, 10))}
            min="0"
            required
          />
          <br />
          <label>CHA:</label>
          <input
            type="number"
            value={characterData.stats.CHA}
            onChange={(e) => handleStatChange('CHA', parseInt(e.target.value, 10))}
            min="0"
            required
          />
        </div>
        <button type="submit">Create Character</button>
      </form>
    </div>
  );
};

export default CharacterCreationModalPanel;
