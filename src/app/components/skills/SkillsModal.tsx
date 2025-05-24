import React, { useState, useEffect } from 'react';
import  Modal  from '@/app/components/common/Modal';
import { SkillRow } from './SkillRow';
import { Skill } from '@/app/hooks/useCharacter';
import { useCharacters } from '@/app/hooks/useCharacter';
import './SkillsModal.css';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchSkill: (skillId: number) => void;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({ isOpen, onClose, onLaunchSkill }) => {
  const { characters } = useCharacters();
  const [acquiredSkills, setAcquiredSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCharacter = characters.find(char => char.isActive);

  useEffect(() => {
    const fetchAcquiredSkills = async () => {
      if (!activeCharacter) return;
      
      try {
        const response = await fetch(`http://localhost:5001/api/character-skills/${activeCharacter.id}/acquired-skills?include=branch,type`, {
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to fetch acquired skills');
        
        const skills = await response.json();
        setAcquiredSkills(skills);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && activeCharacter) {
      fetchAcquiredSkills();
    }
  }, [isOpen, activeCharacter?.id]);

  const handleLaunchSkill = (skillId: number) => {
    onLaunchSkill(skillId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Launch Skills">
      <div className="skills-modal-content">
        {loading ? (
          <div className="loading-spinner" />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : !activeCharacter ? (
          <div className="warning-message">No active character selected</div>
        ) : acquiredSkills.length === 0 ? (
          <div className="no-skills-message">No skills acquired yet</div>
        ) : (
          <div className="skills-list">
            {acquiredSkills.map((skill) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                onLaunch={handleLaunchSkill}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}; 