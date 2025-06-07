import React from 'react';
import { Skill } from '@/app/hooks/useCharacter';
import './SkillRow.css';

interface SkillRowProps {
  skill: Skill;
  onLaunch: (skillId: number) => void;
  onUnselect?: (skillId: number) => void;
  isSelected?: boolean;
}

export const SkillRow: React.FC<SkillRowProps> = ({ skill, onLaunch, onUnselect, isSelected = false }) => {
  return (
    <div className="skill-row">
      <div className="skill-info">
        <h3 className="skill-name">{skill.name}</h3>
        <div className="skill-details">
          <span className="skill-branch">{skill.branch?.name}</span>
          <span className="skill-type">{skill.type?.name}</span>
        </div>
      </div>
      <div className="skill-description">
        <p>{skill.description}</p>
      </div>
      <div className="skill-actions">
        {isSelected ? (
          <div className="selected-skill-actions">
            <span className="selected-indicator">Selected</span>
            <button 
              className="unselect-skill-button"
              onClick={() => onUnselect?.(skill.id)}
            >
              Unselect
            </button>
          </div>
        ) : (
          <button 
            className="select-skill-button"
            onClick={() => onLaunch(skill.id)}
          >
            Select
          </button>
        )}
      </div>
    </div>
  );
}; 