import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { useChatUsers } from '../../hooks/useChatUsers';
import './MasterPanel.css';

interface SkillEngineLog {
  id: string;
  timestamp: Date;
  type: 'skill_use' | 'clash' | 'damage' | 'effect';
  actor: string;
  target?: string;
  skill?: string;
  damage?: number;
  effects?: string[];
  details: string;
}

interface CharacterHP {
  characterId: string;
  characterName: string;
  currentHP: number;
  maxHP: number;
  tempHP: number;
  status: 'healthy' | 'injured' | 'critical' | 'unconscious';
}

interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'condition';
  description: string;
  duration: number;
  effects: Record<string, number>;
}

interface MasterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  skillEngineLogs?: SkillEngineLog[];
  onApplyDamage?: (characterId: string, damage: number) => void;
  onApplyHealing?: (characterId: string, healing: number) => void;
  onApplyStatus?: (characterId: string, status: StatusEffect) => void;
}

export const MasterPanel: React.FC<MasterPanelProps> = ({
  isOpen,
  onClose,
  locationId,
  skillEngineLogs = [],
  onApplyDamage,
  onApplyHealing,
  onApplyStatus
}) => {
  const { user } = useAuth();
  const { users: chatUsers } = useChatUsers(locationId);
  const [activeTab, setActiveTab] = useState<'logs' | 'hp' | 'status'>('logs');
  const [characterHP, setCharacterHP] = useState<CharacterHP[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [damageAmount, setDamageAmount] = useState<number>(0);
  const [healingAmount, setHealingAmount] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusDuration, setStatusDuration] = useState<number>(1);

  // Check if user has master permissions
  const isMaster = user?.role === 'master' || user?.role === 'admin';

  // Initialize character HP data
  useEffect(() => {
    const initializeHP = () => {
      const hpData = chatUsers.map(chatUser => ({
        characterId: chatUser.userId,
        characterName: chatUser.characterName || chatUser.username,
        currentHP: 100, // Default values - these should come from backend
        maxHP: 100,
        tempHP: 0,
        status: 'healthy' as const
      }));
      setCharacterHP(hpData);
    };

    if (chatUsers.length > 0) {
      initializeHP();
    }
  }, [chatUsers]);

  // Predefined status effects
  const statusEffects: StatusEffect[] = [
    {
      id: 'blessed',
      name: 'Blessed',
      type: 'buff',
      description: 'Increased accuracy and damage',
      duration: 3,
      effects: { accuracy: 2, damage: 5 }
    },
    {
      id: 'cursed',
      name: 'Cursed',
      type: 'debuff',
      description: 'Decreased accuracy and damage',
      duration: 3,
      effects: { accuracy: -2, damage: -5 }
    },
    {
      id: 'poisoned',
      name: 'Poisoned',
      type: 'debuff',
      description: 'Takes damage over time',
      duration: 5,
      effects: { damagePerTurn: 3 }
    },
    {
      id: 'regenerating',
      name: 'Regenerating',
      type: 'buff',
      description: 'Heals over time',
      duration: 5,
      effects: { healingPerTurn: 5 }
    },
    {
      id: 'stunned',
      name: 'Stunned',
      type: 'condition',
      description: 'Cannot act for 1 turn',
      duration: 1,
      effects: { canAct: 0 }
    },
    {
      id: 'shielded',
      name: 'Shielded',
      type: 'buff',
      description: 'Reduced incoming damage',
      duration: 3,
      effects: { damageReduction: 50 }
    }
  ];

  const handleApplyDamage = () => {
    if (selectedCharacter && damageAmount > 0) {
      const character = characterHP.find(c => c.characterId === selectedCharacter);
      if (character) {
        const newHP = Math.max(0, character.currentHP - damageAmount);
        setCharacterHP(prev => prev.map(c => 
          c.characterId === selectedCharacter 
            ? { ...c, currentHP: newHP, status: getHealthStatus(newHP, c.maxHP) }
            : c
        ));
        onApplyDamage?.(selectedCharacter, damageAmount);
        setDamageAmount(0);
      }
    }
  };

  const handleApplyHealing = () => {
    if (selectedCharacter && healingAmount > 0) {
      const character = characterHP.find(c => c.characterId === selectedCharacter);
      if (character) {
        const newHP = Math.min(character.maxHP, character.currentHP + healingAmount);
        setCharacterHP(prev => prev.map(c => 
          c.characterId === selectedCharacter 
            ? { ...c, currentHP: newHP, status: getHealthStatus(newHP, c.maxHP) }
            : c
        ));
        onApplyHealing?.(selectedCharacter, healingAmount);
        setHealingAmount(0);
      }
    }
  };

  const handleApplyStatus = () => {
    if (selectedCharacter && selectedStatus) {
      const status = statusEffects.find(s => s.id === selectedStatus);
      if (status) {
        const statusWithDuration = { ...status, duration: statusDuration };
        onApplyStatus?.(selectedCharacter, statusWithDuration);
        setSelectedStatus('');
        setStatusDuration(1);
      }
    }
  };

  const getHealthStatus = (currentHP: number, maxHP: number): CharacterHP['status'] => {
    const percentage = (currentHP / maxHP) * 100;
    if (percentage <= 0) return 'unconscious';
    if (percentage <= 25) return 'critical';
    if (percentage <= 50) return 'injured';
    return 'healthy';
  };

  const getHealthBarColor = (status: CharacterHP['status']) => {
    switch (status) {
      case 'healthy': return '#4ade80';
      case 'injured': return '#fbbf24';
      case 'critical': return '#f87171';
      case 'unconscious': return '#6b7280';
      default: return '#4ade80';
    }
  };

  if (!isMaster) {
    return null; // Don't render for non-masters
  }

  return (
    <div className={`master-panel ${isOpen ? 'open' : ''}`}>
      <div className="master-panel-header">
        <h2>Master Panel</h2>
        <button onClick={onClose} className="close-button">
          ×
        </button>
      </div>

      <div className="master-panel-tabs">
        <button 
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Logs
        </button>
        <button 
          className={`tab ${activeTab === 'hp' ? 'active' : ''}`}
          onClick={() => setActiveTab('hp')}
        >
          ❤️ HP Manager
        </button>
        <button 
          className={`tab ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          ✨ Status Panel
        </button>
      </div>

      <div className="master-panel-content">
        {activeTab === 'logs' && (
          <div className="logs-section">
            <h3>Skill Engine Logs</h3>
            <div className="logs-container">
              {skillEngineLogs.length === 0 ? (
                <div className="no-logs">No skill activity yet</div>
              ) : (
                skillEngineLogs.map((log) => (
                  <div key={log.id} className={`log-entry ${log.type}`}>
                    <div className="log-timestamp">
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="log-content">
                      <div className="log-actor">{log.actor}</div>
                      {log.target && <div className="log-target">→ {log.target}</div>}
                      {log.skill && <div className="log-skill">&ldquo;{log.skill}&rdquo;</div>}
                      <div className="log-details">{log.details}</div>
                      {log.damage && (
                        <div className="log-damage">Damage: {log.damage}</div>
                      )}
                      {log.effects && log.effects.length > 0 && (
                        <div className="log-effects">
                          Effects: {log.effects.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'hp' && (
          <div className="hp-section">
            <h3>HP Manager</h3>
            
            <div className="character-hp-list">
              {characterHP.map((character) => (
                <div key={character.characterId} className="character-hp-card">
                  <div className="character-name">{character.characterName}</div>
                  <div className="hp-bar-container">
                    <div className="hp-numbers">
                      {character.currentHP}/{character.maxHP}
                      {character.tempHP > 0 && ` (+${character.tempHP})`}
                    </div>
                    <div className="hp-bar">
                      <div 
                        className="hp-fill"
                        style={{ 
                          width: `${(character.currentHP / character.maxHP) * 100}%`,
                          backgroundColor: getHealthBarColor(character.status)
                        }}
                      />
                    </div>
                    <div className={`status-indicator ${character.status}`}>
                      {character.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hp-controls">
              <h4>Apply Damage/Healing</h4>
              <div className="control-group">
                <label>Target Character:</label>
                <select 
                  value={selectedCharacter} 
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                >
                  <option value="">Select character...</option>
                  {characterHP.map((character) => (
                    <option key={character.characterId} value={character.characterId}>
                      {character.characterName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="damage-healing-controls">
                <div className="control-group">
                  <label>Damage:</label>
                  <input 
                    type="number" 
                    value={damageAmount} 
                    onChange={(e) => setDamageAmount(Number(e.target.value))}
                    min="0"
                  />
                  <button 
                    onClick={handleApplyDamage}
                    disabled={!selectedCharacter || damageAmount <= 0}
                    className="damage-button"
                  >
                    Apply Damage
                  </button>
                </div>

                <div className="control-group">
                  <label>Healing:</label>
                  <input 
                    type="number" 
                    value={healingAmount} 
                    onChange={(e) => setHealingAmount(Number(e.target.value))}
                    min="0"
                  />
                  <button 
                    onClick={handleApplyHealing}
                    disabled={!selectedCharacter || healingAmount <= 0}
                    className="healing-button"
                  >
                    Apply Healing
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="status-section">
            <h3>Status Panel</h3>
            
            <div className="status-controls">
              <div className="control-group">
                <label>Target Character:</label>
                <select 
                  value={selectedCharacter} 
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                >
                  <option value="">Select character...</option>
                  {characterHP.map((character) => (
                    <option key={character.characterId} value={character.characterId}>
                      {character.characterName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label>Status Effect:</label>
                <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">Select status...</option>
                  {statusEffects.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name} ({status.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label>Duration (turns):</label>
                <input 
                  type="number" 
                  value={statusDuration} 
                  onChange={(e) => setStatusDuration(Number(e.target.value))}
                  min="1"
                  max="10"
                />
              </div>

              <button 
                onClick={handleApplyStatus}
                disabled={!selectedCharacter || !selectedStatus}
                className="status-button"
              >
                Apply Status
              </button>
            </div>

            <div className="status-effects-reference">
              <h4>Available Status Effects</h4>
              <div className="status-grid">
                {statusEffects.map((status) => (
                  <div key={status.id} className={`status-card ${status.type}`}>
                    <div className="status-name">{status.name}</div>
                    <div className="status-type">{status.type}</div>
                    <div className="status-description">{status.description}</div>
                    <div className="status-effects">
                      {Object.entries(status.effects).map(([key, value]) => (
                        <span key={key} className="effect-tag">
                          {key}: {value > 0 ? '+' : ''}{value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 