import React from 'react';
import { Skill } from '@/app/hooks/useCharacter';
import './SkillRow.css';

interface SkillRowProps {
  skill: Skill;
  onLaunch: (skillId: number) => void;
}

export const SkillRow: React.FC<SkillRowProps> = ({ skill, onLaunch }) => {
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
        <button 
          className="launch-skill-button"
          onClick={() => onLaunch(skill.id)}
        >
          Launch
        </button>
      </div>
    </div>
  );
}; 