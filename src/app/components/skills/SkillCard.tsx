import React from 'react';
import './SkillCard.css';

interface Skill {
  id: number;
  name: string;
  description: string;
  skillPointCost: number;
  branchId: number;
  typeId: number;
  rank: number;
  isPassive: boolean;
  branch: {
    name: string;
  };
  type: {
    name: string;
  };
}

interface SkillCardProps {
  skill: Skill;
  isAcquired: boolean;
  canAcquire: boolean;
  onAcquire: (skillId: number) => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  isAcquired,
  canAcquire,
  onAcquire,
}) => {
  return (
    <div className="skill-card">
      <div className="skill-card-content">
        <div className="skill-header">
          <h3>{skill.name}</h3>
          <span className="skill-rank">Rank {skill.rank}</span>
        </div>
        
        <p className="skill-description">{skill.description}</p>
        
        <div className="skill-details">
          <div className="skill-detail">
            <span className="detail-label">Cost:</span>
            <span className="detail-value">{skill.skillPointCost} points</span>
          </div>
          <div className="skill-detail">
            <span className="detail-label">Branch:</span>
            <span className="detail-value">{skill.branchId}</span>
          </div>
          <div className="skill-detail">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{skill.typeId}</span>
          </div>
        </div>

        {isAcquired ? (
          <button 
            disabled 
            className="skill-button acquired"
          >
            Acquired
          </button>
        ) : (
          <button
            onClick={() => onAcquire(skill.id)}
            disabled={!canAcquire}
            className={`skill-button ${canAcquire ? 'available' : 'unavailable'}`}
          >
            {canAcquire ? 'Acquire Skill' : 'Not enough points'}
          </button>
        )}
      </div>
    </div>
  );
}; 