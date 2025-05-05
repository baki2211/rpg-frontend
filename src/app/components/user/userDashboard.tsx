'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import CharacterCard from '../character/characterCard';
import OnlineUsers from './OnlineUsers';
import usePresenceWebSocket from '../../hooks/usePresenceWebSocket';


const Dashboard = () => {
  const router = useRouter();
  
  interface UserData {
    id: string;
    username: string;
    role: string;
  }

  interface PresenceUser {
    username: string;
    location: string;
  }

  interface Character {
    id: number;
    userId: number;
    name: string;
    surname: string;
    age: number;
    gender: string;
    race: {
      name: string;
    };
    isActive: boolean;
    imageUrl?: string;
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState('');
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
        console.error('Error fetching dashboard:', error);
        setTimeout(() => router.push('/pages/login'), 2000);
      }
    };

    const fetchCharacters = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/characters', {
          withCredentials: true,
        });
        const formattedCharacters = response.data.map((char: Character) => ({
          id: char.id,
          name: char.name,
          surname: char.surname || 'Unknown', // Adjust if class is missing
          age: char.age || 0, // Adjust if age is missing
          gender: char.gender || 'Unknown', // Adjust 
          race: char.race.name || 'Unknown', // Adjust based on API structure
          isActive: char.isActive,
          imageUrl: char.imageUrl || '/uploads/placeholder.jpg', // Adjust based on API response
        }));
  
        setCharacters(formattedCharacters);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setMessage('Error fetching characters. Please try again later.');
        console.error('Error fetching characters:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchCharacters();
    fetchDashboard();
  }, [router]);

  usePresenceWebSocket(userData?.id || '', userData?.username || '', setOnlineUsers);
  console.log('Online Users:', onlineUsers);

  if (!userData) {
    return <p>{message || 'Loading your dashboard...'}</p>;
  }
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
        <OnlineUsers onlineUsers={onlineUsers} currentUsername={userData?.username}/>
      </div>
    </div>
  );
};

export default Dashboard;
