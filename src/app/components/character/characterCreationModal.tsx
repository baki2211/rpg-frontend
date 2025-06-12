'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './characterCreationModal.css';

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

interface StatDefinition {
  internalName: string;
  displayName: string;
  description?: string;
  minValue: number;
  maxValue: number | null;
  defaultValue: number;
}

interface CharacterForm {
  userId: number | null;
  name: string;
  surname: string;
  age: number;
  gender: string;
  raceId: number | null;
  stats: Record<string, number>;
}

interface CharacterCreationModalPanelProps {
  onSuccess?: () => void;
  createCharacter: (formData: FormData) => Promise<void>;
}

const CharacterCreationModalPanel: React.FC<CharacterCreationModalPanelProps> = ({ onSuccess, createCharacter }) => {
  const [, setCharacters] = useState<Character[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [characterData, setCharacterData] = useState<CharacterForm>({
    userId: null,
    name: '',
    surname: '',
    age: 0,
    gender: '',
    raceId: null,
    stats: {}
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [statDefinitions, setStatDefinitions] = useState<StatDefinition[]>([]);
  const TOTAL_POINTS = 45;
  const allocatedPoints = Object.values(characterData.stats).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  const remainingPoints = TOTAL_POINTS - allocatedPoints;

  useEffect(() => {
    fetchUser();
    fetchCharacters();
    fetchRaces();
    fetchStatDefinitions();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/user/', { withCredentials: true });
      const fetchedUser = response.data;
      setUser(fetchedUser);
      setCharacterData((prev) => ({
        ...prev,
        userId: fetchedUser.id,
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
      setRaces(response.data);
    } catch (error) {
      console.error('Failed to fetch races:', error);
      setErrorMessage('Failed to fetch races');
    }
  };

  const fetchStatDefinitions = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/stat-definitions?category=primary_stat&activeOnly=true', { withCredentials: true });
      const defs = response.data as StatDefinition[];
      setStatDefinitions(defs);

      setCharacterData(prev => ({
        ...prev,
        stats: Object.fromEntries(defs.map((d: StatDefinition) => [d.internalName, d.defaultValue]))
      }));
    } catch (err) {
      console.error('Failed to fetch stat definitions', err);
      setErrorMessage('Failed to fetch stat definitions');
    }
  };

  const handleStatChange = (stat: string, value: number) => {
    const cleanValue = isNaN(value) ? 0 : value;
    const newStats = { ...characterData.stats, [stat]: cleanValue };
    const newTotal = Object.values(newStats).reduce((sum, val) => sum + val, 0);
    if (newTotal > TOTAL_POINTS) {
      setErrorMessage(`You have only ${TOTAL_POINTS - newTotal} points remaining.`);
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

    if (allocatedPoints > TOTAL_POINTS) {
      setErrorMessage(`Allocated points exceed ${TOTAL_POINTS}. Please adjust your stats.`);
      return;
    }

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
      await createCharacter(formData);
      setSuccessMessage('Character created successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create character:', error);
      setErrorMessage('Failed to create character');
    }
  };
  
  return (
    <div className="character-creation-modal">
      <div className="character-creation-header">
        <h2>Create Your Character</h2>
        <p className="character-creation-subtitle">Design your unique hero for the adventure ahead</p>
      </div>

      {errorMessage && (
        <div className="character-alert error">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="character-alert success">{successMessage}</div>
      )}

      <form onSubmit={handleCharacterSubmit} className="character-creation-form">
        <div className="character-form-section">
          <h3>Basic Information</h3>
          <div className="character-form-grid">
            <div className="character-form-group">
              <label>First Name</label>
              <input
                type="text"
                value={characterData.name}
                onChange={(e) => setCharacterData({ ...characterData, name: e.target.value })}
                className="character-form-control"
                placeholder="Enter first name..."
                required
              />
            </div>

            <div className="character-form-group">
              <label>Surname</label>
              <input
                type="text"
                value={characterData.surname}
                onChange={(e) => setCharacterData({ ...characterData, surname: e.target.value })}
                className="character-form-control"
                placeholder="Enter surname..."
                required
              />
            </div>

            <div className="character-form-group">
              <label>Age</label>
              <input
                type="number"
                value={characterData.age || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                  setCharacterData({ ...characterData, age: isNaN(value) ? 0 : value });
                }}
                className="character-form-control"
                placeholder="Enter age..."
                min="16"
                max="100"
                required
              />
            </div>

            <div className="character-form-group">
              <label>Gender</label>
              <select
                value={characterData.gender}
                onChange={(e) => setCharacterData({ ...characterData, gender: e.target.value })}
                className="character-form-control"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="character-form-group">
              <label>Race</label>
              <select
                value={characterData.raceId || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                  setCharacterData({ ...characterData, raceId: isNaN(value!) ? null : value });
                }}
                className="character-form-control"
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

            <div className="character-form-group full-width">
              <label>Character Portrait</label>
              <div className="character-file-input">
                <label className="character-file-label">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }} 
                  />
                  {imageFile ? `Selected: ${imageFile.name}` : 'Click to upload character image (optional)'}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="character-form-section">
          <div className="stats-section">
            <div className="stats-header">
              <h3 className="stats-title">Allocate Stat Points</h3>
              <div className={`points-remaining ${remainingPoints < 0 ? 'warning' : ''}`}>
                Remaining: {remainingPoints}
              </div>
            </div>

            <div className="stats-grid">
              {statDefinitions.map((stat) => {
                const maxVal = stat.maxValue ?? 100;
                return (
                  <div key={stat.internalName} className="stat-item">
                    <div className="stat-label" title={stat.description || ''}>{stat.displayName}</div>
                    <input
                      type="number"
                      value={characterData.stats[stat.internalName] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? stat.minValue : parseInt(e.target.value, 10);
                        handleStatChange(stat.internalName, val);
                      }}
                      className="stat-input"
                      min={stat.minValue}
                      max={maxVal}
                      required
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="character-submit-button"
          disabled={remainingPoints < 0 || allocatedPoints === 0}
        >
          ✨ Create Character
        </button>
      </form>
    </div>
  );
};

export default CharacterCreationModalPanel;
