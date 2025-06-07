import React from 'react';
import { Skill } from '@/app/hooks/useCharacter';
import './SkillRow.css';

interface MiniSkillRowProps {
  skill: Skill & { 
    selectedTarget?: { characterName?: string; username: string };
    output?: number;
    roll?: string;
  };
}

export const MiniSkillRow: React.FC<MiniSkillRowProps> = ({ skill }) => {
  return (
    <div className="mini-skill-row">
      <div className="skill-info">
        <span className="skill-name">{skill.name}</span>
        <span className="skill-branch">({skill.branch?.name})</span>
        {skill.selectedTarget && (
          <span className="skill-target">
            → {skill.selectedTarget.characterName || skill.selectedTarget.username}
          </span>
        )}
      </div>
      {(skill.output || skill.roll) && (
        <div className="skill-output">
          {skill.output && <span className="output-value">Output: {skill.output}</span>}
          {skill.roll && <span className="roll-result">Roll: {skill.roll}</span>}
        </div>
      )}
    </div>
  );
}; 