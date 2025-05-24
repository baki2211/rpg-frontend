import React from 'react';
import { Skill } from '@/app/hooks/useCharacter';
import './MiniSkillRow.css';

interface MiniSkillRowProps {
  skill: Skill;
}

export const MiniSkillRow: React.FC<MiniSkillRowProps> = ({ skill }) => {
  // Handle both nested and flat skill data structures
  const branchName = typeof skill.branch === 'string' ? skill.branch : skill.branch?.name || '';
  const typeName = typeof skill.type === 'string' ? skill.type : skill.type?.name || '';

  return (
    <div className="mini-skill-row">
      <div className="mini-skill-info">
        <span className="mini-skill-name">{skill.name}</span>
        <div className="mini-skill-details">
          <span className="mini-skill-branch">{branchName}</span>
          <span className="mini-skill-type">{typeName}</span>
        </div>
      </div>
    </div>
  );
}; 