'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CharacterCard from '../components/character/Card/CharacterCard';
import OnlineUsers from '../components/common/OnlineUsers';
import SessionList from '../sessions/page';
import { useCharacter } from '../contexts/CharacterContext';
import { useDashboard } from '../hooks/queries/useUser';
import { getErrorMessage } from '../../utils/errorHandling';
import { ROUTES } from '../../config/routes';

const Dashboard = () => {
  const router = useRouter();
  const { data: dashboardData, isLoading: userLoading, error: userError } = useDashboard();
  const user = dashboardData?.user ?? null;
  const { characters, activateCharacter, deleteCharacter } = useCharacter();

  useEffect(() => {
    if (userError) {
      const timeout = setTimeout(() => router.push(ROUTES.login), 2000);
      return () => clearTimeout(timeout);
    }
  }, [userError, router]);

  if (userLoading || !user) {
    return (
      <div className="page-container">
        <div className="loading">
          {userError ? getErrorMessage(userError, 'Failed to fetch dashboard') : 'Loading your dashboard...'}
        </div>
      </div>
    );
  }

  const activeCharacters = characters.filter(char => char.isActive);

  return (
    <div className="dashboard-page">
      <div className="page-container">
        <div className="page-header">
          <h1>Welcome back, {user.username}!</h1>
          <p>Manage your characters, explore the world, and connect with other adventurers</p>
        </div>

      <div className="dashboard-grid">
        {/* User Info & Active Characters */}
        <div className="dashboard-section">
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
            <div className="card">
              <p className="dashboard-no-characters">
                No active character found. Create or activate one to start your adventure!
              </p>
              <a href="/charactersDashboard" className="btn btn-primary">
                Manage Characters
              </a>
            </div>
          )}
        </div>

        {/* Current Games - Now showing actual session table */}
        <div className="dashboard-section">
          <h3>Active Sessions</h3>
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
