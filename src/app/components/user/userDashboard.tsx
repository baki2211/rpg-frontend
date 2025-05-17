'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import CharacterCard from '../character/characterCard';
import OnlineUsers from '../common/OnlineUsers';
import { useCharacters } from '../../hooks/useCharacter';

const Dashboard = () => {
  const router = useRouter();
  const { characters, activateCharacter, deleteCharacter } = useCharacters();
  
  interface UserData {
    id: string;
    username: string;
    role: string;
  }

  const [userData, setUserData] = useState<UserData | null>(null);
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

    fetchDashboard();
  }, [router]);

  if (!userData) {
    return <p>{message || 'Loading your dashboard...'}</p>;
  }

  const activeCharacters = characters.filter(char => char.isActive);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', padding: '2rem' }}>
      {/* User Info & Active Characters */}
      <div>
        <h3>Active Characters</h3>
        {activeCharacters.length > 0 ? (
          <div>
            {activeCharacters.map((character) => (
              <CharacterCard 
                key={character.id} 
                character={character} 
                isCharacterPanel={false}
                onActivate={activateCharacter}
                onDelete={deleteCharacter}
              />
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
        <OnlineUsers />
      </div>
    </div>
  );
};

export default Dashboard;
