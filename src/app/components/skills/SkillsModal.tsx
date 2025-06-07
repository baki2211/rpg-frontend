import React, { useState, useEffect } from 'react';
import { useCharacters } from '@/app/hooks/useCharacter';
import { SkillRow } from './SkillRow';
import { Skill } from '@/app/hooks/useCharacter';
import { useChatUsers, ChatUser } from '@/app/hooks/useChatUsers';
import './SkillsModal.css';

interface SkillWithTarget extends Skill {
  selectedTarget?: ChatUser;
}

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkill: (skill: SkillWithTarget) => void;
  onUnselectSkill: () => void;
  selectedSkill?: Skill & { selectedTarget?: ChatUser };
  locationId?: string;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({ isOpen, onClose, onSelectSkill, onUnselectSkill, selectedSkill: externalSelectedSkill, locationId }) => {
  const { characters } = useCharacters();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlySelectedSkill, setCurrentlySelectedSkill] = useState<Skill | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<ChatUser | null>(null);
  const [showTargetSelection, setShowTargetSelection] = useState(false);
  
  const { users: chatUsers, loading: usersLoading } = useChatUsers(locationId || '');

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

  const handleSkillClick = (skill: Skill) => {
    setCurrentlySelectedSkill(skill);
    setSelectedTarget(null);
    
    if (skill.target === 'other') {
      setShowTargetSelection(true);
    } else {
      // For self/none target skills, immediately complete selection
      onSelectSkill(skill);
    }
  };

  const handleTargetSelection = () => {
    if (currentlySelectedSkill && selectedTarget) {
      onSelectSkill({
        ...currentlySelectedSkill,
        selectedTarget
      });
      handleClearSelection();
    }
  };

  const handleClearSelection = () => {
    setCurrentlySelectedSkill(null);
    setSelectedTarget(null);
    setShowTargetSelection(false);
  };

  const handleUseSelectedSkill = () => {
    if (currentlySelectedSkill) {
      if (currentlySelectedSkill.target === 'other' && !selectedTarget) {
        setShowTargetSelection(true);
      } else {
        onSelectSkill({
          ...currentlySelectedSkill,
          selectedTarget: selectedTarget || undefined
        });
        handleClearSelection();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            {showTargetSelection && currentlySelectedSkill ? 
              `Select Target for ${currentlySelectedSkill.name}` : 
              currentlySelectedSkill ? 
                `Selected: ${currentlySelectedSkill.name}` : 
                'Your Skills'
            }
          </h2>
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
        ) : currentlySelectedSkill ? (
          <div className="skill-selection">
            <div className="selected-skill-info">
              <h3>{currentlySelectedSkill.name}</h3>
              <p>{currentlySelectedSkill.description}</p>
              <div className="skill-details">
                <span className="skill-branch">{currentlySelectedSkill.branch?.name}</span>
                <span className="skill-type">{currentlySelectedSkill.type?.name}</span>
                <span className="skill-target">Target: {currentlySelectedSkill.target}</span>
              </div>
            </div>
            
            {showTargetSelection ? (
              <div className="target-selection">
                <p><strong>Target required:</strong> This skill targets other players</p>
                
                {usersLoading ? (
                  <div className="loading">Loading players...</div>
                ) : chatUsers.length === 0 ? (
                  <div className="no-targets">No other players found in this chat.</div>
                ) : (
                  <div className="target-list">
                    <h4>Select Target:</h4>
                    {chatUsers.map((user) => (
                      <div 
                        key={user.userId}
                        className={`target-option ${selectedTarget?.userId === user.userId ? 'selected' : ''}`}
                        onClick={() => setSelectedTarget(user)}
                      >
                        <span className="target-name">
                          {user.characterName || user.username}
                        </span>
                        <span className="target-username">({user.username})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            
            {selectedTarget && (
              <div className="selected-target">
                <p><strong>Selected Target:</strong> {selectedTarget.characterName || selectedTarget.username}</p>
              </div>
            )}
            
            <div className="selection-actions">
              <button onClick={handleClearSelection} className="clear-button">
                ← Back to Skills
              </button>
              
              {currentlySelectedSkill.target === 'other' ? (
                <button 
                  onClick={handleTargetSelection}
                  disabled={!selectedTarget}
                  className="confirm-button"
                >
                  Use Skill on Target
                </button>
              ) : (
                <button 
                  onClick={handleUseSelectedSkill}
                  className="confirm-button"
                >
                  Use Skill
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="skills-list">
            {skills.map((skill) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                onLaunch={() => handleSkillClick(skill)}
                onUnselect={() => onUnselectSkill()}
                isSelected={externalSelectedSkill?.id === skill.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 