import React, { useState, useEffect } from 'react';
import { useCharacters } from '@/app/hooks/useCharacter';
import { SkillRow } from './SkillRow';
import { Skill } from '@/app/hooks/useCharacter';
import './SkillsModal.css';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkill: (skill: Skill) => void;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({ isOpen, onClose, onSelectSkill }) => {
  const { characters } = useCharacters();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCharacter = characters.find(char => char.isActive);

  useEffect(() => {
    const fetchSkills = async () => {
      if (!activeCharacter) return;

      try {
        const response = await fetch(
          `http://localhost:5001/api/character-skills/${activeCharacter.id}/acquired-skills?include=branch,type`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch skills');
        }

        const data = await response.json();
        setSkills(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch skills');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSkills();
    }
  }, [isOpen, activeCharacter?.id]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Your Skills</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading skills...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : !activeCharacter ? (
          <div className="no-skills">No active character selected.</div>
        ) : skills.length === 0 ? (
          <div className="no-skills">No skills acquired yet.</div>
        ) : (
          <div className="skills-list">
            {skills.map((skill) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                onLaunch={() => onSelectSkill(skill)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 