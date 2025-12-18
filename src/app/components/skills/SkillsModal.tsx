import React, { useState, useEffect, useMemo } from 'react';
import { useCharacters } from '@/app/hooks/useCharacter';
import { SkillRow } from './SkillRow';
import { Skill } from '@/app/hooks/useCharacter';
import { useChatUsers, ChatUser } from '@/app/hooks/useChatUsers';
import { useAuth } from '@/app/utils/AuthContext';
import { api } from '../../../services/apiClient';
import './SkillsModal.css';

interface SkillWithTarget extends Skill {
  selectedTarget?: ChatUser;
}

interface CombatRound {
  id: number;
  roundNumber: number;
  status: string;
}

interface ActiveEvent {
  id: number;
  title: string;
  type: string;
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
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  
  const { users: chatUsers, loading: usersLoading } = useChatUsers(locationId || '');

  const activeCharacter = characters.find(char => char.isActive);

  // Filter out current user from target list for "other" target skills
  // For "any" target skills, include all users (including self)
  const availableTargets = useMemo(() => {
    if (!user) return chatUsers;
    
    // For "any" target skills, include all users (self and others)
    if (currentlySelectedSkill?.target === 'any') {
      return chatUsers;
    }
    
    // For "other" target skills, exclude current user
    return chatUsers.filter(chatUser => chatUser.username !== user.username);
  }, [chatUsers, user, currentlySelectedSkill?.target]);

  // Filter skills based on event status - only allow non-"other" skills when no event is active
  const availableSkills = useMemo(() => {
    if (!activeEvent) {
      // Outside of events, only allow "self", "none", and "any" target skills
      return skills.filter(skill => skill.target !== 'other');
    }
    // During events, all skills are available
    return skills;
  }, [skills, activeEvent]);

  useEffect(() => {
    const fetchSkills = async () => {
      if (!activeCharacter) return;

      try {
        const response = await api.get(`/character-skills/${activeCharacter.id}/acquired-skills?include=branch,type`);
        setSkills(response.data as Skill[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch skills');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSkills();
    }
  }, [isOpen, activeCharacter]);

  // Check for active combat round
  useEffect(() => {
    const fetchActiveRound = async () => {
      if (!locationId) return;
      
      try {
        const response = await api.get(`/combat/rounds/active/${locationId}`);
        setActiveRound((response.data as { round: CombatRound }).round);
      } catch {
        console.error('Error fetching active round');
        setActiveRound(null);
      }
    };

    if (isOpen && locationId) {
      fetchActiveRound();
    }
  }, [isOpen, locationId]);

  // Check for active event
  useEffect(() => {
    const fetchActiveEvent = async () => {
      if (!locationId) return;
      
      try {
        const response = await api.get(`/events/active/${locationId}`);
        setActiveEvent((response.data as { event: ActiveEvent }).event);
      } catch {
        console.error('Error fetching active event');
        setActiveEvent(null);
      }
    };

    if (isOpen && locationId) {
      fetchActiveEvent();
    }
  }, [isOpen, locationId]);

  const handleSkillClick = (skill: Skill) => {
    // Check if skill is restricted outside of events
    if (!activeEvent && skill.target === 'other') {
      alert('Skills that target others can only be used during active events. Please wait for an event to start.');
      return;
    }

    setCurrentlySelectedSkill(skill);
    setSelectedTarget(null);
    
    if (skill.target === 'other' || skill.target === 'any') {
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
          <div className="combat-notice">
            <div className="combat-info">
              <span className="combat-icon"></span>
              <span>Combat Round {activeRound.roundNumber} is active! Selected skills will be submitted to combat when you send your message.</span>
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
                <p><strong>Target required:</strong> {currentlySelectedSkill.target === 'any' ? 'This skill can target yourself or other players' : 'This skill targets other players'}</p>
                
                {usersLoading ? (
                  <div className="loading">Loading players...</div>
                ) : availableTargets.length === 0 ? (
                  <div className="no-targets">No players available to target in this chat.</div>
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
                          {targetUser.username === user?.username ? ' (You)' : ''}
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
              
              {currentlySelectedSkill.target === 'other' || currentlySelectedSkill.target === 'any' ? (
                <button 
                  onClick={handleTargetSelection}
                  disabled={!selectedTarget}
                  className="confirm-button"
                >
                  Use Skill on Target
                </button>
              ) : (
                <button 
                  onClick={() => {
                    onSelectSkill({
                      ...currentlySelectedSkill,
                      selectedTarget: selectedTarget || undefined
                    });
                    handleClearSelection();
                  }}
                  className="confirm-button"
                >
                  Use Skill
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="skills-list">
            {availableSkills.map((skill) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                onLaunch={() => handleSkillClick(skill)}
                onUnselect={() => onUnselectSkill()}
                isSelected={externalSelectedSkill?.id === skill.id}
              />
            ))}
            
            {!activeEvent && skills.length > availableSkills.length && (
              <div className="restricted-skills-notice">
                <div className="notice-icon"></div>
                <div className="notice-text">
                  <strong>Some skills are restricted</strong>
                  <p>Skills that target others are only available during active events.</p>
                  <p>Restricted skills: {skills.length - availableSkills.length}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 