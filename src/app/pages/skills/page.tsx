'use client';

import React, { useState, useEffect } from 'react';
import { SkillCard } from '@/app/components/skills/SkillCard';
import { useCharacters, type Skill } from '@/app/hooks/useCharacter';
import './skills.css';
import { API_URL } from '../../../config/api';

export default function SkillsPage() {
  const { characters, fetchCharacters } = useCharacters();
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [acquiredSkills, setAcquiredSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the active character
  const activeCharacter = characters.find(char => char.isActive);

  useEffect(() => {
    const fetchSkills = async () => {
      if (!activeCharacter) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Fetch available skills
        const availableSkillsResponse = await fetch(`${API_URL}/character-skills/${activeCharacter.id}/available-skills?include=branch,type`, {
          credentials: 'include'
        });
        if (!availableSkillsResponse.ok) throw new Error('Failed to fetch available skills');
        const available = await availableSkillsResponse.json();
        setAvailableSkills(available);

        // Fetch acquired skills
        const acquiredSkillsResponse = await fetch(`${API_URL}/character-skills/${activeCharacter.id}/acquired-skills?include=branch,type`, {
          credentials: 'include'
        });
        if (!acquiredSkillsResponse.ok) throw new Error('Failed to fetch acquired skills');
        const acquired = await acquiredSkillsResponse.json();
        setAcquiredSkills(acquired);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [activeCharacter?.id]);

  const acquireSkill = async (skillId: number) => {
    if (!activeCharacter) return;
    
    try {
      const response = await fetch(`${API_URL}/character-skills/${skillId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to acquire skill' }));
        throw new Error(errorData.message || 'Failed to acquire skill');
      }

      // Refresh character data
      await fetchCharacters();
      
      // Fetch both available and acquired skills again
      const [availableSkillsResponse, acquiredSkillsResponse] = await Promise.all([
        fetch(`${API_URL}/character-skills/${activeCharacter.id}/available-skills?include=branch,type`, {
          credentials: 'include'
        }),
        fetch(`${API_URL}/character-skills/${activeCharacter.id}/acquired-skills?include=branch,type`, {
          credentials: 'include'
        })
      ]);

      if (!availableSkillsResponse.ok) throw new Error('Failed to fetch updated available skills');
      if (!acquiredSkillsResponse.ok) throw new Error('Failed to fetch updated acquired skills');

      const [updatedAvailable, updatedAcquired] = await Promise.all([
        availableSkillsResponse.json(),
        acquiredSkillsResponse.json()
      ]);

      setAvailableSkills(updatedAvailable);
      setAcquiredSkills(updatedAcquired);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acquire skill');
    }
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
          <h3>🎭 No Active Character</h3>
          <p>You need an active character to browse and acquire skills.</p>
          <div className="warning-actions">
            {characters.length > 0 ? (
              <>
                <p>You have {characters.length} character{characters.length > 1 ? 's' : ''} available. Please activate one to continue:</p>
                <a href="/pages/characters" className="btn btn-primary">
                  🏛️ Manage Characters
                </a>
              </>
            ) : (
              <>
                <p>Create your first character to start learning skills and abilities:</p>
                <a href="/pages/characters" className="btn btn-primary">
                  ✨ Create Character
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
                    onAcquire={acquireSkill}
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