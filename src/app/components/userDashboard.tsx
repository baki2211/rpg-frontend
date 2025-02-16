'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import CharacterCard from './character/characterCard';

const Dashboard = () => {
  const router = useRouter();
  
  interface UserData {
    username: string;
    role: string;
  }

  interface Character {
    id: number;
    name: string;
    surname: string;
    age: number;
    gender: string;
    race: string;
    isActive: boolean;
    imageUrl?: string;
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/user/dashboard', {
          withCredentials: true,
        });
        setUserData(response.data.user);
        setMessage(response.data.message);
      } catch (error) {
        setMessage('You are not authorized to view this page. Redirecting...');
        setTimeout(() => router.push('/pages/login'), 2000);
      }
    };
    const fetchCharacters = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/characters', {
          withCredentials: true,
        });
        const formattedCharacters = response.data.map((char: any) => ({
          id: char.id,
          name: char.name,
          surname: char.surname || 'Unknown', // Adjust if class is missing
          age: char.age || 0, // Adjust if age is missing
          gender: char.gender || 'Unknown', // Adjust 
          race: char.race.name || 'Unknown', // Adjust based on API structure
          isActive: char.isActive,
          imageUrl: char.image || '/placeholder.jpg', // Adjust based on API response
        }));
  
        setCharacters(formattedCharacters);
      } catch (err) {
        setError('Failed to fetch characters');
      } finally {
        setLoading(false);
      }
    };
  
    fetchCharacters();

    fetchDashboard();
  }, [router]);

  if (!userData) {
    return <p>{message || 'Loading your dashboard...'}</p>;
  }
  const activeCharacter = characters.find((character) => character.isActive);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', padding: '2rem' }}>
      {/* User Info & Active Characters */}
      <div>
        <h3>Active Characters</h3>
        {characters.some((char) => char.isActive) ? (
  <div>
    {characters.filter((char) => char.isActive).map((character) => (
      <CharacterCard key={character.id} character={character} isCharacterPanel={false} />
    ))}
  </div>
        ) : (
        <p>No Active character, activate one <a href="/pages/characters" style={{ marginRight: "1rem" }}>here</a></p>
        )}
      </div>

      {/* Current Games */}
      <div>
        <h3>Current Games</h3>
        <p>Feature coming soon...</p>
      </div>

      {/* Online Users */}
      <div>
        <h3>Online</h3>
        {onlineUsers.length > 0 ? (
          <ul>
            {onlineUsers.map((user, index) => (
              <li key={index}>{user}</li>
            ))}
          </ul>
        ) : (
          <p>No users online</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
