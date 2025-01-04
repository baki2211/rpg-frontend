'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Race {
  id: number;
  name: string;
  description: string;
  image: string;
  healthBonus: number;
  manaBonus: number;
  strengthBonus: number;
  agilityBonus: number;
  intelligenceBonus: number;
  speedBonus: number;
  armorBonus: number;
}

const RacePanel: React.FC = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [newRace, setNewRace] = useState<Partial<Race>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/admin/races', {
          withCredentials: true,
        });
        setRaces(response.data);
      } catch (error) {
        console.error('Error fetching races:', error);
      }
    };

    fetchRaces();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewRace({
      ...newRace,
      [e.target.name]: e.target.value,
    });
  };

  const addRace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/admin/races/new', newRace, {
        withCredentials: true,
      });
      setRaces([...races, response.data]);
      setNewRace({});
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add race');
    }
  };

  const deleteRace = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5001/api/admin/races/delete/${id}`, {
        withCredentials: true,
      });
      setRaces(races.filter((race) => race.id !== id));
    } catch (error) {
      console.error('Failed to delete race:', error);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Manage Races</h1>
      <form onSubmit={addRace}>
        <div>
          <label>Name:</label>
          <input type="text" name="name" value={newRace.name || ''} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea name="description" value={newRace.description || ''} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Image URL:</label>
          <input type="text" name="image" value={newRace.image || ''} onChange={handleInputChange} />
        </div>
        <div>
          <label>Health Bonus:</label>
          <input type="number" name="healthBonus" value={newRace.healthBonus || ''} onChange={handleInputChange} />
        </div>
        {/* Repeat for other bonuses */}
        <button type="submit">Add Race</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Existing Races</h2>
      <ul>
        {races.map((race) => (
          <li key={race.id}>
            <h3>{race.name}</h3>
            <p>{race.description}</p>
            <button onClick={() => deleteRace(race.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RacePanel;
