'use client';

import React, { useState, useEffect } from 'react';
import { SkillCard } from '@/app/components/SkillCard';
import { useCharacters, type Skill } from '@/app/hooks/useCharacter';
import './skills.css';

export default function SkillsPage() {
  const { characters, fetchCharacters } = useCharacters();
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the active character
  const activeCharacter = characters.find(char => char.isActive);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const skillsResponse = await fetch('http://localhost:5001/api/skills', {
          credentials: 'include'
        });
        if (!skillsResponse.ok) throw new Error('Failed to fetch skills');
        const skills = await skillsResponse.json();
        setAvailableSkills(skills);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  const acquireSkill = async (skillId: number) => {
    if (!activeCharacter) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/characters/characters/skills/${skillId}`, {
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
      
      // Remove the acquired skill from the available skills list
      setAvailableSkills(prevSkills => prevSkills.filter(skill => skill.id !== skillId));
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
          <h3>No Active Character</h3>
          <p>Please select or create a character to view available skills.</p>
        </div>
      </div>
    );
  }

  // Filter out already acquired skills
  const filteredSkills = availableSkills.filter(skill => 
    !activeCharacter.skills?.some(acquiredSkill => acquiredSkill.id === skill.id)
  );

  return (
    <div className="skills-page">
      <div className="skills-container">
        <div className="skills-header">
          <h1>Skill Acquisition</h1>
          <div className="character-info">
            <span>Character: {activeCharacter.name}</span>
            <span className="separator">•</span>
            <span>Available Points: {activeCharacter.skillPoints}</span>
          </div>
        </div>
        
        <div className="skills-grid">
          {filteredSkills.map((skill) => {
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
          })}
        </div>
      </div>
    </div>
  );
} 