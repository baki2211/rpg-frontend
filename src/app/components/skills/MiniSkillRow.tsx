import React from 'react';
import { Skill } from '@/app/hooks/useCharacter';
import './SkillRow.css';

interface ExtendedSkill extends Skill {
  uses?: number;
  scalingStats?: string[];
}

interface MiniSkillRowProps {
  skill: ExtendedSkill & { 
    selectedTarget?: { characterName?: string; username: string };
    output?: number;
    roll?: string;
  };
}

// Calculate skill rank based on uses (same logic as SkillEngine)
const calculateSkillRank = (uses: number = 0): { rank: string; level: number } => {
  if (uses < 20) return { rank: 'I', level: 1 };
  if (uses < 35) return { rank: 'II', level: 2 };
  if (uses < 60) return { rank: 'III', level: 3 };
  if (uses < 100) return { rank: 'IV', level: 4 };
  return { rank: 'V', level: 5 };
};

export const MiniSkillRow: React.FC<MiniSkillRowProps> = ({ skill }) => {
  const skillRank = calculateSkillRank(skill.uses || 0);
  const scalingStatsText = skill.scalingStats && skill.scalingStats.length > 0 
    ? skill.scalingStats.join(', ') 
    : 'None';

  return (
    <div className="mini-skill-row" title={skill.description || 'No description available'}>
      <div className="mini-skill-header">
        <span className="mini-skill-name">{skill.name}</span>
        <div className="mini-skill-badges">
          <span className={`mini-skill-rank rank-${skillRank.level}`}>Rank {skillRank.rank}</span>
          <span className="mini-skill-type">{skill.type?.name || 'Unknown'}</span>
        </div>
      </div>
      
      <div className="mini-skill-details">
        <div className="mini-skill-info-row">
          <span className="mini-skill-label">Branch:</span>
          <span className="mini-skill-branch">{skill.branch?.name || 'Unknown'}</span>
        </div>
        
        <div className="mini-skill-info-row">
          <span className="mini-skill-label">Scaling:</span>
          <span className="mini-skill-scaling">{scalingStatsText}</span>
        </div>
        
        {skill.selectedTarget && (
          <div className="mini-skill-info-row">
            <span className="mini-skill-label">Target:</span>
            <span className="skill-target">
              {skill.selectedTarget.characterName || skill.selectedTarget.username}
            </span>
          </div>
        )}
      </div>

      {/* Show final result only if skill.target !== 'other' */}
      {skill.target !== 'other' && (skill.output || skill.roll) && (
        <div className="mini-skill-output">
          {skill.output && <span className="output-value">Final Output: {skill.output}</span>}
          {skill.roll && <span className="roll-result">Roll: {skill.roll}</span>}
        </div>
      )}
    </div>
  );
}; 