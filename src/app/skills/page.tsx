'use client';

import React from 'react';
import { SkillCard } from '@/app/components/skills/SkillCard';
import { useCharacters } from '@/app/hooks/queries/useCharacters';
import { useActiveCharacter } from '@/app/contexts/ActiveCharacterContext';
import {
  useAcquiredSkills,
  useAvailableSkills,
  useAcquireSkill,
} from '@/app/hooks/queries/useSkills';
import { getErrorMessage } from '@/utils/errorHandling';
import './skills.css';

export default function SkillsPage() {
  const { data: characters = [] } = useCharacters();
  const activeCharacter = useActiveCharacter();
  const characterId = activeCharacter?.id;

  const acquiredQuery = useAcquiredSkills(characterId, 'branch,type');
  const availableQuery = useAvailableSkills(characterId, 'branch,type');
  const acquireMutation = useAcquireSkill(characterId);

  const acquiredSkills = acquiredQuery.data ?? [];
  const availableSkills = availableQuery.data ?? [];
  const loading =
    !!characterId && (acquiredQuery.isLoading || availableQuery.isLoading);
  const queryError = acquiredQuery.error ?? availableQuery.error;
  const error = queryError
    ? getErrorMessage(queryError, 'Failed to fetch skills')
    : null;

  const handleAcquireSkill = (skillId: number) => {
    if (!characterId) return;
    acquireMutation.mutate(skillId);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!activeCharacter) {
    return (
      <div className="warning-container">
        <div className="warning-message">
          <h3>No Active Character</h3>
          <p>You need an active character to browse and acquire skills.</p>
          <div className="warning-actions">
            {characters.length > 0 ? (
              <>
                <p>You have {characters.length} character{characters.length > 1 ? 's' : ''} available. Please activate one to continue:</p>
                <a href="/characters" className="btn btn-primary">
                  Manage Characters
                </a>
              </>
            ) : (
              <>
                <p>Create your first character to start learning skills and abilities:</p>
                <a href="/characters" className="btn btn-primary">
                  Create Character
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="skills-page">
      <div className="skills-container">
        <div className="skills-header">
          <h1>Skills</h1>
          <div className="character-info">
            <span>Character: {activeCharacter.name}</span>
            <span className="separator">•</span>
            <span>Available Points: {activeCharacter.skillPoints}</span>
          </div>
        </div>

        {/* Acquired Skills Section */}
        <div className="skills-section">
          <h2>Acquired Skills</h2>
          <div className="skills-grid">
            {acquiredSkills.length > 0 ? (
              acquiredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isAcquired={true}
                  canAcquire={false}
                  onAcquire={() => {}}
                />
              ))
            ) : (
              <p className="no-skills-message">No skills acquired yet.</p>
            )}
          </div>
        </div>

        {/* Available Skills Section */}
        <div className="skills-section">
          <h2>Available Skills</h2>
          <div className="skills-grid">
            {availableSkills.length > 0 ? (
              availableSkills.map((skill) => {
                const canAcquire = (activeCharacter?.skillPoints || 0) >= skill.skillPointCost;

                return (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isAcquired={false}
                    canAcquire={canAcquire}
                    onAcquire={handleAcquireSkill}
                  />
                );
              })
            ) : (
              <p className="no-skills-message">No more skills available to acquire.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
