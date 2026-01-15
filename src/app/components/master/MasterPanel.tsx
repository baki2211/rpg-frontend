import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { useChatUsers } from '../../hooks/useChatUsers';
import { useEngineLogs } from '../../contexts/EngineLogsContext';
import { useCombatRounds } from '../../contexts/CombatRoundsContext';
import { useEvents } from '../../contexts/EventsContext';
import './MasterPanel.css';


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
  onApplyDamage?: (characterId: string, damage: number) => void;
  onApplyHealing?: (characterId: string, healing: number) => void;
  onApplyStatus?: (characterId: string, status: StatusEffect) => void;
}

export const MasterPanel: React.FC<MasterPanelProps> = ({
  isOpen,
  onClose,
  locationId,
  onApplyDamage,
  onApplyHealing,
  onApplyStatus
}) => {
  const { user } = useAuth();
  const { users: chatUsers } = useChatUsers(locationId);
  const { logs: engineLogs, fetchLogsByLocation } = useEngineLogs();
  const {
    activeCombatRound,
    resolvedCombatRounds,
    roundActions,
    fetchActiveCombatRound,
    fetchResolvedCombatRounds,
    createCombatRound,
    resolveCombatRound: resolveCombatRoundContext,
    cancelCombatRound: cancelCombatRoundContext
  } = useCombatRounds();
  const {
    activeEvent,
    recentEvents,
    fetchActiveEvent,
    fetchRecentEvents,
    createEvent: createEventContext,
    closeEvent: closeEventContext,
    freezeEvent: freezeEventContext,
    unfreezeEvent: unfreezeEventContext
  } = useEvents();

  const [activeTab, setActiveTab] = useState<'logs' | 'hp' | 'status' | 'combat' | 'events'>('logs');
  const [characterHP, setCharacterHP] = useState<CharacterHP[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [damageAmount, setDamageAmount] = useState<number>(0);
  const [healingAmount, setHealingAmount] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusDuration, setStatusDuration] = useState<number>(1);

  // Local loading states for UI feedback
  const [isCreatingRound, setIsCreatingRound] = useState(false);
  const [isResolvingRound, setIsResolvingRound] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isClosingEvent, setIsClosingEvent] = useState(false);
  const [isFreezingEvent, setIsFreezingEvent] = useState(false);
  const [isUnfreezingEvent, setIsUnfreezingEvent] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: '',
    type: 'lore' as 'lore' | 'duel' | 'quest',
    description: ''
  });

  // Check if user has master permissions
  const isMaster = user?.role === 'master' || user?.role === 'admin';

  // Load engine logs when the logs tab is active
  useEffect(() => {
    if (activeTab === 'logs' && isOpen) {
      fetchLogsByLocation(locationId);
      // Set up interval to refresh logs periodically
      const interval = setInterval(() => fetchLogsByLocation(locationId), 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab, isOpen, locationId, fetchLogsByLocation]);

  // No need for fetch functions - using context methods directly

  const createNewRound = async () => {
    if (!activeEvent) {
      alert('You must have an active event to create combat rounds');
      return;
    }

    setIsCreatingRound(true);
    try {
      await createCombatRound(parseInt(locationId), activeEvent.id);
      await fetchActiveCombatRound(locationId);
    } catch (error) {
      console.error('MASTER PANEL: Error creating round:', error);
      alert('Failed to create combat round');
    } finally {
      setIsCreatingRound(false);
    }
  };

  const resolveRound = async () => {
    if (!activeCombatRound) return;

    setIsResolvingRound(true);
    try {
      await resolveCombatRoundContext(activeCombatRound.id);
      // Refresh all combat data
      await Promise.all([
        fetchActiveCombatRound(locationId),
        fetchResolvedCombatRounds(locationId)
      ]);
      // Trigger a refresh of engine logs to pick up new logs
      if (activeTab === 'logs') {
        await fetchLogsByLocation(locationId);
      }
    } catch (error) {
      console.error('MASTER PANEL: Error resolving round:', error);
      alert('Failed to resolve combat round');
    } finally {
      setIsResolvingRound(false);
    }
  };

  const cancelRound = async () => {
    if (!activeCombatRound) return;

    try {
      await cancelCombatRoundContext(activeCombatRound.id);
      await fetchActiveCombatRound(locationId);
    } catch (error) {
      console.error('Error cancelling round:', error);
      alert('Failed to cancel combat round');
    }
  };

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

  // Load combat data
  useEffect(() => {
    if (activeTab === 'combat') {
      fetchActiveCombatRound(locationId);
      fetchResolvedCombatRounds(locationId);

      // Set up interval to refresh combat data periodically
      const interval = setInterval(() => {
        fetchActiveCombatRound(locationId);
        fetchResolvedCombatRounds(locationId);
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab, locationId, fetchActiveCombatRound, fetchResolvedCombatRounds]);

  // Load event data
  useEffect(() => {
    if (activeTab === 'events') {
      fetchActiveEvent(locationId);
      fetchRecentEvents(locationId);

      // Set up interval to refresh event data periodically
      const interval = setInterval(() => {
        fetchActiveEvent(locationId);
        fetchRecentEvents(locationId);
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab, locationId, fetchActiveEvent, fetchRecentEvents]);

  const createNewEvent = async () => {
    if (!eventForm.title || !eventForm.type) {
      alert('Please fill in title and type');
      return;
    }

    setIsCreatingEvent(true);
    try {
      await createEventContext(
        eventForm.title,
        eventForm.type,
        parseInt(locationId),
        eventForm.description
      );
      await fetchActiveEvent(locationId);
      setEventForm({ title: '', type: 'lore', description: '' });
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const closeEvent = async () => {
    if (!activeEvent) return;

    setIsClosingEvent(true);
    try {
      await closeEventContext(activeEvent.id);
      await fetchRecentEvents(locationId);
    } catch (error) {
      console.error('Error closing event:', error);
      alert('Failed to close event');
    } finally {
      setIsClosingEvent(false);
    }
  };

  const freezeEvent = async () => {
    if (!activeEvent) return;

    setIsFreezingEvent(true);
    try {
      await freezeEventContext(activeEvent.id);
      await fetchActiveEvent(locationId);
      alert('🧊 Event frozen! Session state has been saved and cleared.');
    } catch (error) {
      console.error('Error freezing event:', error);
      alert('Failed to freeze event');
    } finally {
      setIsFreezingEvent(false);
    }
  };

  const unfreezeEvent = async () => {
    if (!activeEvent) return;

    setIsUnfreezingEvent(true);
    try {
      await unfreezeEventContext(activeEvent.id);
      await fetchActiveEvent(locationId);
      alert('Event unfrozen! Session state has been restored.');
    } catch (error) {
      console.error('Error unfreezing event:', error);
      alert('Failed to unfreeze event');
    } finally {
      setIsUnfreezingEvent(false);
    }
  };

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
          Logs
        </button>
        <button 
          className={`tab ${activeTab === 'hp' ? 'active' : ''}`}
          onClick={() => setActiveTab('hp')}
        >
          HP Manager
        </button>
        <button 
          className={`tab ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          Status Panel
        </button>
        <button 
          className={`tab ${activeTab === 'combat' ? 'active' : ''}`}
          onClick={() => setActiveTab('combat')}
        >
          Combat
        </button>
        <button 
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
      </div>

      <div className="master-panel-content">
        {activeTab === 'logs' && (
          <div className="logs-section">
            <div className="logs-header">
              <h3>Skill Engine Logs</h3>
              <div className="logs-header-right">
                <div className="logs-count">{engineLogs.length} events</div>
              </div>
            </div>
            <div className="logs-container">
              {engineLogs.length === 0 ? (
                <div className="no-logs">
                  <div className="no-logs-icon"></div>
                  <div>No engine activity yet</div>
                  <div className="no-logs-hint">
                    Engine logs appear when:
                    <ul>
                      <li>• Players use skills in chat</li>
                      <li>• Combat rounds are initiated and resolved</li>
                      <li>• Skills clash during combat</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="logs-list">
                  {engineLogs
                    .slice()
                    .reverse() // Show newest first
                    .map((log) => (
                    <div key={log.id} className={`log-entry ${log.type}`}>
                      <div className="log-header">
                        <div className="log-timestamp">
                          {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className={`log-type-badge ${log.type}`}>
                          {log.type.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                      <div className="log-content">
                        {log.type === 'clash' ? (
                          <div className="clash-content">
                            <div className="log-main-line">
                              <span className="log-actor">{log.actor}</span>
                              <span className="clash-vs">VS</span>
                              <span className="log-actor">{log.target}</span>
                            </div>
                            
                            {log.skill && (
                              <div className="log-action">
                                <strong>Skills:</strong> {log.skill}
                              </div>
                            )}
                            
                            {log.effects && log.effects.length > 0 && (
                              <div className="log-effects">
                                {log.effects.map((effect, index) => (
                                  <span key={index} className="effect-tag">
                                    {effect}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {log.damage && log.damage > 0 && (
                              <div className="log-damage">
                                <span className="damage-label">Damage Dealt:</span> {log.damage}
                              </div>
                            )}
                            
                            <div className="log-details">{log.details}</div>
                          </div>
                        ) : (
                          <div className="regular-content">
                            <div className="log-main-line">
                              <span className="log-actor">{log.actor}</span>
                              {log.skill && (
                                <span className="log-action">
                                  used <span className="log-skill">{log.skill}</span>
                                </span>
                              )}
                              {log.target && log.target !== log.actor && (
                                <span className="log-target">on {log.target}</span>
                              )}
                            </div>
                            
                            {log.effects && log.effects.length > 0 && (
                              <div className="log-effects">
                                {log.effects.map((effect, index) => (
                                  <span key={index} className="effect-tag">
                                    {effect}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {log.damage && (
                              <div className="log-damage">
                                <span className="damage-label">Result:</span> {log.damage}
                              </div>
                            )}
                            
                            <div className="log-details">{log.details}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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

        {activeTab === 'combat' && (
          <div className="combat-section">
            <h3>Combat Manager</h3>
            
            {activeCombatRound ? (
              <div className="active-round">
                <div className="round-header">
                  <h4>Round {activeCombatRound.roundNumber} - Active</h4>
                  <div className="round-actions">
                    <button 
                      onClick={resolveRound}
                      disabled={isResolvingRound || roundActions.length === 0}
                      className="resolve-button"
                    >
                      {isResolvingRound ? 'Resolving...' : 'Resolve Round'}
                    </button>
                    <button 
                      onClick={cancelRound}
                      className="cancel-button"
                    >
                      Cancel Round
                    </button>
                  </div>
                </div>

                <div className="round-participants">
                  <h5>Submitted Actions ({roundActions.length})</h5>
                  {roundActions.length === 0 ? (
                    <div className="no-actions">No actions submitted yet</div>
                  ) : (
                    <div className="actions-list">
                      {roundActions.map((action, index) => (
                        <div key={action.id || index} className="action-card">
                          <div className="action-header">
                            <span className="character-name">{action.characterData?.name || 'Unknown'}</span>
                            <span className="skill-name">{action.skillData?.name || 'Unknown Skill'}</span>
                          </div>
                          <div className="action-details">
                            <span className="output">Output: {action.finalOutput}</span>
                            <span className="roll-quality">{action.rollQuality}</span>
                            <span className="target">
                              Target: {action.targetData?.name || (action.skillData?.target === 'self' ? 'Self' : 'Area')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-active-round">
                {activeEvent ? (
                  <>
                    <div className="no-round-message">
                      <h4>No Active Combat Round</h4>
                      <p>Create a new round for the current event: <strong>{activeEvent.title}</strong></p>
                    </div>
                    <button 
                      onClick={createNewRound}
                      disabled={isCreatingRound}
                      className="create-round-button"
                    >
                      {isCreatingRound ? 'Creating...' : 'Start New Round'}
                    </button>
                  </>
                ) : (
                  <div className="no-round-message">
                    <h4>No Active Event</h4>
                    <p>Combat rounds can only be created during active events. Start an event in the Events tab first.</p>
                    <div className="event-hint">
                      Go to the <strong>Events</strong> tab to create a new event before starting combat rounds.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="resolved-rounds">
              <h4>Recent Resolved Rounds</h4>
              {resolvedCombatRounds.length === 0 ? (
                <div className="no-resolved">No resolved rounds yet</div>
              ) : (
                <div className="resolved-list">
                  {resolvedCombatRounds.map((round) => (
                    <div key={round.id} className="resolved-round-card">
                      <div className="resolved-header">
                        <span className="round-number">Round {round.roundNumber}</span>
                        <span className="resolved-time">
                          {round.resolvedAt ? new Date(round.resolvedAt).toLocaleTimeString() : 'Unknown'}
                        </span>
                      </div>
                      {round.resolutionData && (
                        <div className="resolution-summary">
                          <span>Actions: {round.resolutionData.summary?.totalActions || 0}</span>
                          <span>Clashes: {round.resolutionData.summary?.clashCount || 0}</span>
                          <span>Independent: {round.resolutionData.summary?.independentCount || 0}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="events-section">
            <h3>Event Manager</h3>
            
            {activeEvent ? (
              <div className="active-event">
                <div className="event-header">
                  <h4>{activeEvent.title} - {activeEvent.type.toUpperCase()}</h4>
                  <div className="event-actions">
                    {activeEvent.session?.status === 'frozen' ? (
                      <button 
                        onClick={unfreezeEvent}
                        disabled={isUnfreezingEvent}
                        className="unfreeze-event-button"
                        title="Unfreeze event and session"
                      >
                        {isUnfreezingEvent ? 'Unfreezing...' : 'Unfreeze'}
                      </button>
                    ) : (
                      <button 
                        onClick={freezeEvent}
                        disabled={isFreezingEvent}
                        className="freeze-event-button"
                        title="Freeze event and session"
                      >
                        {isFreezingEvent ? 'Freezing...' : 'Freeze'}
                      </button>
                    )}
                    <button 
                      onClick={closeEvent}
                      disabled={isClosingEvent}
                      className="close-event-button"
                    >
                      {isClosingEvent ? 'Closing...' : 'Close Event'}
                    </button>
                  </div>
                </div>

                <div className="event-details">
                  {activeEvent.description && (
                    <p className="event-description">{activeEvent.description}</p>
                  )}
                  <div className="event-meta">
                    <span>Started: {new Date(activeEvent.createdAt).toLocaleString()}</span>
                    <span>Type: {activeEvent.type}</span>
                    <span>Status: {activeEvent.status}</span>
                  </div>
                </div>

                {activeEvent.eventData && (
                  <div className="event-stats">
                    <h5>Event Statistics</h5>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-label">Total Rounds:</span>
                        <span className="stat-value">{activeEvent.eventData.totalRounds}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Resolved:</span>
                        <span className="stat-value">{activeEvent.eventData.resolvedRounds}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Total Actions:</span>
                        <span className="stat-value">{activeEvent.eventData.totalActions}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-active-event">
                <div className="create-event-form">
                  <h4>Create New Event</h4>
                  <div className="form-group">
                    <label>Event Title:</label>
                    <input 
                      type="text" 
                      value={eventForm.title}
                      onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                      placeholder="Enter event title..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Event Type:</label>
                    <select 
                      value={eventForm.type}
                      onChange={(e) => setEventForm({...eventForm, type: e.target.value as 'lore' | 'duel' | 'quest'})}
                    >
                      <option value="lore">Lore Event</option>
                      <option value="duel">Duel Event</option>
                      <option value="quest">Quest Event</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Description (Optional):</label>
                    <textarea 
                      value={eventForm.description}
                      onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                      placeholder="Describe the event..."
                      rows={3}
                    />
                  </div>
                  
                  <button 
                    onClick={createNewEvent}
                    disabled={isCreatingEvent || !eventForm.title}
                    className="create-event-button"
                  >
                    {isCreatingEvent ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </div>
            )}

            <div className="recent-events">
              <h4>Recent Events</h4>
              {recentEvents.length === 0 ? (
                <div className="no-events">No events yet</div>
              ) : (
                <div className="events-list">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="event-card">
                      <div className="event-card-header">
                        <span className="event-title">{event.title}</span>
                        <span className={`event-status ${event.status}`}>{event.status}</span>
                      </div>
                      <div className="event-card-details">
                        <span className="event-type">{event.type.toUpperCase()}</span>
                        <span className="event-date">
                          {event.status === 'closed' && event.closedAt ? 
                            `Closed: ${new Date(event.closedAt).toLocaleDateString()}` :
                            `Started: ${new Date(event.createdAt).toLocaleDateString()}`
                          }
                        </span>
                      </div>
                      {event.eventData && (
                        <div className="event-summary">
                          <span>{event.eventData.totalRounds} rounds</span>
                          <span>{event.eventData.totalActions} actions</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 