import React, { useState, useEffect, useMemo } from 'react';
import { useCharacters } from '@/app/hooks/useCharacter';
import { SkillRow } from './SkillRow';
import { Skill } from '@/app/hooks/useCharacter';
import { useChatUsers, ChatUser } from '@/app/hooks/useChatUsers';
import { useAuth } from '@/app/utils/AuthContext';
import axios from 'axios';
import './SkillsModal.css';

interface SkillWithTarget extends Skill {
  selectedTarget?: ChatUser;
}

interface CombatRound {
  id: number;
  roundNumber: number;
  status: string;
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
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlySelectedSkill, setCurrentlySelectedSkill] = useState<Skill | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<ChatUser | null>(null);
  const [showTargetSelection, setShowTargetSelection] = useState(false);
  const [activeRound, setActiveRound] = useState<CombatRound | null>(null);
  const [submitMode, setSubmitMode] = useState<'chat' | 'combat'>('chat');
  const [isSubmittingToCombat, setIsSubmittingToCombat] = useState(false);
  
  const { users: chatUsers, loading: usersLoading } = useChatUsers(locationId || '');

  const activeCharacter = characters.find(char => char.isActive);

  // Filter out current user from target list for "other" target skills
  const availableTargets = useMemo(() => {
    if (!user) return chatUsers;
    return chatUsers.filter(chatUser => chatUser.username !== user.username);
  }, [chatUsers, user]);

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

  // Check for active combat round
  useEffect(() => {
    const fetchActiveRound = async () => {
      if (!locationId) return;
      
      try {
        const response = await axios.get(`http://localhost:5001/api/combat/rounds/active/${locationId}`, {
          withCredentials: true
        });
        setActiveRound(response.data.round);
      } catch (error) {
        console.error('Error fetching active round:', error);
        setActiveRound(null);
      }
    };

    if (isOpen && locationId) {
      fetchActiveRound();
    }
  }, [isOpen, locationId]);

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

  const handleSubmitToCombat = async () => {
    if (!currentlySelectedSkill || !activeRound) return;
    
    setIsSubmittingToCombat(true);
    try {
      // Find target character ID if needed
      let targetId = null;
      if (currentlySelectedSkill.target === 'other' && selectedTarget) {
        // For now, we'll use the userId as characterId - this might need adjustment
        // based on your character/user relationship
        targetId = selectedTarget.userId;
      }

      const response = await axios.post(`http://localhost:5001/api/combat/rounds/${activeRound.id}/actions`, {
        skillId: currentlySelectedSkill.id,
        targetId
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        alert('Action submitted to combat round successfully!');
        onClose();
      }
    } catch (error: unknown) {
      console.error('Error submitting to combat:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'error' in error.response.data
        ? String(error.response.data.error)
        : 'Failed to submit action to combat round';
      alert(errorMessage);
    } finally {
      setIsSubmittingToCombat(false);
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

        {activeRound && !currentlySelectedSkill && (
          <div className="combat-mode-selector">
            <div className="combat-notice">
              <span className="combat-icon">⚔️</span>
              <span>Combat Round {activeRound.roundNumber} is active!</span>
            </div>
            <div className="mode-buttons">
              <button 
                className={`mode-button ${submitMode === 'chat' ? 'active' : ''}`}
                onClick={() => setSubmitMode('chat')}
              >
                Use in Chat
              </button>
              <button 
                className={`mode-button ${submitMode === 'combat' ? 'active' : ''}`}
                onClick={() => setSubmitMode('combat')}
              >
                Submit to Combat
              </button>
            </div>
          </div>
        )}

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
                ) : availableTargets.length === 0 ? (
                  <div className="no-targets">No other players available to target in this chat.</div>
                ) : (
                  <div className="target-list">
                    <h4>Select Target:</h4>
                    {availableTargets.map((targetUser) => (
                      <div 
                        key={targetUser.userId}
                        className={`target-option ${selectedTarget?.userId === targetUser.userId ? 'selected' : ''}`}
                        onClick={() => setSelectedTarget(targetUser)}
                      >
                        <span className="target-name">
                          {targetUser.characterName || targetUser.username}
                        </span>
                        <span className="target-username">({targetUser.username})</span>
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
              
              {submitMode === 'combat' && activeRound ? (
                <button 
                  onClick={handleSubmitToCombat}
                  disabled={isSubmittingToCombat || (currentlySelectedSkill.target === 'other' && !selectedTarget)}
                  className="combat-submit-button"
                >
                  {isSubmittingToCombat ? 'Submitting...' : '⚔️ Submit to Combat'}
                </button>
              ) : currentlySelectedSkill.target === 'other' ? (
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