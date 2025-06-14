'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import CharacterCard from '../character/characterCard';
import OnlineUsers from '../common/OnlineUsers';
import SessionList from '../sessions/SessionList';
import { useCharacters } from '../../hooks/useCharacter';
import { API_URL } from '../../../config/api';

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
        const response = await axios.get(`${API_URL}/user/dashboard`, {
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
    return (
      <div className="page-container">
        <div className="loading">{message || 'Loading your dashboard...'}</div>
      </div>
    );
  }

  const activeCharacters = characters.filter(char => char.isActive);

  return (
    <div className="dashboard-page">
      <div className="page-container">
        <div className="page-header">
          <h1>Welcome back, {userData.username}!</h1>
          <p>Manage your characters, explore the world, and connect with other adventurers</p>
        </div>

      <div className="dashboard-grid">
        {/* User Info & Active Characters */}
        <div className="dashboard-section">
          <h3>🏛️ Active Characters</h3>
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
            <div className="card">
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
                No active character found. Create or activate one to start your adventure!
              </p>
              <a href="/pages/characters" className="btn btn-primary">
                Manage Characters
              </a>
            </div>
          )}
        </div>

        {/* Current Games - Now showing actual session table */}
        <div className="dashboard-section">
          <h3>🎮 Active Sessions</h3>
          <div className="session-dashboard-container">
            <SessionList />
          </div>
        </div>

        {/* Online Users */}
        <div className="dashboard-section">
          <OnlineUsers />
        </div>
      </div>
    </div>
    </div>
  );
};

export default Dashboard;
