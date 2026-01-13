import React from 'react';
import { Skill } from '@/types/character';
import './SkillRow.css';

interface ExtendedSkill extends Skill {
  uses?: number;
  scalingStats?: string[];
  selectedTarget?: { characterName?: string; username: string };
  output?: number;
  roll?: string;
}

// Simplified skill structure from chat messages
interface SimplifiedSkill {
  id: number;
  name: string;
  branch?: string | { name: string };
  type?: string | { name: string };
  target?: string;
  description?: string;
  scalingStats?: string[];
  uses?: number;
  selectedTarget?: { characterName?: string; username: string };
  output?: number;
  roll?: string;
}

interface MiniSkillRowProps {
  skill: ExtendedSkill | SimplifiedSkill;
}

// Calculate skill rank based on uses (same logic as SkillEngine)
const calculateSkillRank = (uses: number = 0): { rank: string; level: number } => {
  if (uses < 20) return { rank: 'I', level: 1 };
  if (uses < 35) return { rank: 'II', level: 2 };
  if (uses < 60) return { rank: 'III', level: 3 };
  if (uses < 100) return { rank: 'IV', level: 4 };
  return { rank: 'V', level: 5 };
};

// Helper function to safely get branch name
const getBranchName = (branch?: string | { name: string }): string => {
  if (!branch) return 'Unknown';
  if (typeof branch === 'string') return branch;
  return branch.name || 'Unknown';
};

// Helper function to safely get type name
const getTypeName = (type?: string | { name: string }): string => {
  if (!type) return 'Unknown';
  if (typeof type === 'string') return type;
  return type.name || 'Unknown';
};

// Helper function to format the result
const formatResult = (skill: ExtendedSkill | SimplifiedSkill): string => {
  if (skill.output !== undefined) {
    return `Output: ${skill.output}`;
  }
  if (skill.roll) {
    return `Roll: ${skill.roll}`;
  }
  return 'Ready';
};

export const MiniSkillRow: React.FC<MiniSkillRowProps> = ({ skill }) => {
  const skillRank = calculateSkillRank(skill.uses || 0);
  const branchName = getBranchName(skill.branch);
  const typeName = getTypeName(skill.type);
  const result = formatResult(skill);

  return (
    <div className="mini-skill-row" title={skill.description || 'No description available'}>
      <div className="mini-skill-content">
        <span className="mini-skill-name">{skill.name}</span>
        <span className="mini-skill-separator"> - </span>
        <span className="mini-skill-branch">{branchName}</span>
        <span className="mini-skill-separator"> - </span>
        <span className={`mini-skill-rank rank-${skillRank.level}`}>Rank {skillRank.rank}</span>
        <span className="mini-skill-separator"> - </span>
        <span className="mini-skill-type">{typeName}</span>
        <span className="mini-skill-separator"> - </span>
        <span className="mini-skill-result">{result}</span>
      </div>
    </div>
  );
}; 