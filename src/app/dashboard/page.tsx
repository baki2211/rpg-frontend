'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CharacterCard from '@/app/components/character/Card/CharacterCard';
import HeaderSection from '@/app/components/common/HeaderSection';
import OnlineUsers from '@/app/components/common/OnlineUsers';
import SessionList from '@/app/sessions/page';
import { useCharacters, useActivateCharacter, useDeleteCharacter } from '@/app/hooks/queries/useCharacters';
import { useDashboard } from '@/app/hooks/queries/useUser';
import { getErrorMessage } from '@/utils/errorHandling';
import { ROUTES } from '@/config/routes';

const Dashboard = () => {
  const router = useRouter();
  const { data: dashboardData, isLoading: userLoading, error: userError } = useDashboard();
  const user = dashboardData?.user ?? null;
  const { data: characters = [] } = useCharacters();
  const activateMutation = useActivateCharacter();
  const deleteMutation = useDeleteCharacter();

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
        <HeaderSection
          title={`Welcome back, ${user.username}!`}
          subtitle="Manage your characters, explore the world, and connect with other adventurers"
        />

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
                  onActivate={activateMutation.mutateAsync}
                  onDelete={deleteMutation.mutateAsync}
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
