import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/app/contexts/ToastContext';
import { useChatUsers } from '@/app/hooks/queries/useChatUsers';
import { useEngineLogsByLocation } from '@/app/hooks/queries/useEngineLogs';
import {
  useActiveCombatRound,
  useResolvedCombatRounds,
  useCreateCombatRound,
  useResolveCombatRound,
  useCancelCombatRound,
} from '@/app/hooks/queries/useCombatRounds';
import {
  useActiveEvent,
  useRecentEvents,
  useCreateEvent,
  useCloseEvent,
  useFreezeEvent,
  useUnfreezeEvent,
} from '@/app/hooks/queries/useEvents';
import {
  HEALTH_COLOR,
  STATUS_EFFECTS,
  TABS,
  type StatusEffect,
  type TabKey,
} from './constants';
import { TabBar } from './components/TabBar';
import { CharacterSelect } from './components/CharacterSelect';
import { LogEntry } from './components/LogEntry';
import { useCharacterHP } from './hooks/useCharacterHP';
import './MasterPanel.css';


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
  const { showSuccess, showError, showWarning } = useToast();
  const { users: chatUsers } = useChatUsers(locationId);
  const locationIdNum = parseInt(locationId);
  const [activeTab, setActiveTab] = useState<TabKey>('logs');

  // Combat tab polls every 5s while open; mutations invalidate the
  // location key, so non-polled tabs still see fresh data on next mount.
  const isCombatTabActive = isOpen && activeTab === 'combat';
  const { data: activeCombatRound = null } = useActiveCombatRound(locationId, {
    enabled: isCombatTabActive,
    refetchInterval: isCombatTabActive ? 5000 : false,
  });
  const { data: resolvedCombatRounds = [] } = useResolvedCombatRounds(locationId, 5, {
    enabled: isCombatTabActive,
    refetchInterval: isCombatTabActive ? 5000 : false,
  });
  const roundActions = activeCombatRound?.actions ?? [];

  const createCombatRoundMutation = useCreateCombatRound();
  const resolveCombatRoundMutation = useResolveCombatRound();
  const cancelCombatRoundMutation = useCancelCombatRound();

  const isLogsTabActive = isOpen && activeTab === 'logs';
  const { data: engineLogs = [], refetch: refetchEngineLogs } = useEngineLogsByLocation(locationId, {
    enabled: isLogsTabActive,
  });

  // Events tab gates Combat round creation on activeEvent — keep activeEvent
  // enabled whenever the panel is open. Mutations + WS invalidation keep
  // data fresh; no polling needed.
  const isEventsTabActive = isOpen && activeTab === 'events';
  const { data: activeEvent = null } = useActiveEvent(locationId, {
    enabled: isOpen,
  });
  const { data: recentEvents = [] } = useRecentEvents(locationId, 5, {
    enabled: isEventsTabActive,
  });

  const createEventMutation = useCreateEvent();
  const closeEventMutation = useCloseEvent();
  const freezeEventMutation = useFreezeEvent();
  const unfreezeEventMutation = useUnfreezeEvent();

  const { characterHP, applyDelta } = useCharacterHP(chatUsers, {
    onApplyDamage,
    onApplyHealing,
  });
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [damageAmount, setDamageAmount] = useState<number>(0);
  const [healingAmount, setHealingAmount] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusDuration, setStatusDuration] = useState<number>(1);

  const [eventForm, setEventForm] = useState({
    title: '',
    type: 'lore' as 'lore' | 'duel' | 'quest',
    description: ''
  });

  // Check if user has master permissions
  const isMaster = user?.role === 'master' || user?.role === 'admin';

  const createNewRound = () => {
    if (!activeEvent) {
      showWarning('You must have an active event to create combat rounds');
      return;
    }
    createCombatRoundMutation.mutate({
      locationId: locationIdNum,
      eventId: activeEvent.id,
    });
  };

  const resolveRound = () => {
    if (!activeCombatRound) return;
    resolveCombatRoundMutation.mutate(
      { roundId: activeCombatRound.id, locationId },
      {
        onSuccess: () => {
          // Engine logs tab subscribes via its own query; refresh it
          // immediately so the resolved-round logs show up without waiting
          // for the next poll.
          if (activeTab === 'logs') {
            refetchEngineLogs();
          }
        },
      }
    );
  };

  const cancelRound = () => {
    if (!activeCombatRound) return;
    cancelCombatRoundMutation.mutate({
      roundId: activeCombatRound.id,
      locationId,
    });
  };

  const createNewEvent = () => {
    if (!eventForm.title || !eventForm.type) {
      showError('Please fill in title and type');
      return;
    }

    createEventMutation.mutate(
      {
        title: eventForm.title,
        type: eventForm.type,
        locationId: locationIdNum,
        description: eventForm.description,
      },
      {
        onSuccess: () => setEventForm({ title: '', type: 'lore', description: '' }),
      }
    );
  };

  const closeEvent = () => {
    if (!activeEvent) return;
    closeEventMutation.mutate({ eventId: activeEvent.id, locationId });
  };

  const freezeEvent = () => {
    if (!activeEvent) return;
    freezeEventMutation.mutate(
      { eventId: activeEvent.id, locationId },
      {
        onSuccess: () =>
          showSuccess('🧊 Event frozen! Session state has been saved and cleared.'),
      }
    );
  };

  const unfreezeEvent = () => {
    if (!activeEvent) return;
    unfreezeEventMutation.mutate(
      { eventId: activeEvent.id, locationId },
      {
        onSuccess: () => showSuccess('Event unfrozen! Session state has been restored.'),
      }
    );
  };

  const handleApplyDamage = () => {
    if (!selectedCharacter || damageAmount <= 0) return;
    applyDelta(selectedCharacter, -damageAmount);
    setDamageAmount(0);
  };

  const handleApplyHealing = () => {
    if (!selectedCharacter || healingAmount <= 0) return;
    applyDelta(selectedCharacter, healingAmount);
    setHealingAmount(0);
  };

  const handleApplyStatus = () => {
    if (selectedCharacter && selectedStatus) {
      const status = STATUS_EFFECTS.find(s => s.id === selectedStatus);
      if (status) {
        const statusWithDuration = { ...status, duration: statusDuration };
        onApplyStatus?.(selectedCharacter, statusWithDuration);
        setSelectedStatus('');
        setStatusDuration(1);
      }
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

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

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
                      <LogEntry key={log.id} log={log} />
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
                          backgroundColor: HEALTH_COLOR[character.status]
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
              <CharacterSelect
                characters={characterHP}
                value={selectedCharacter}
                onChange={setSelectedCharacter}
              />

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
              <CharacterSelect
                characters={characterHP}
                value={selectedCharacter}
                onChange={setSelectedCharacter}
              />

              <div className="control-group">
                <label>Status Effect:</label>
                <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">Select status...</option>
                  {STATUS_EFFECTS.map((status) => (
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
                {STATUS_EFFECTS.map((status) => (
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
                      disabled={resolveCombatRoundMutation.isPending || roundActions.length === 0}
                      className="resolve-button"
                    >
                      {resolveCombatRoundMutation.isPending ? 'Resolving...' : 'Resolve Round'}
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
                      disabled={createCombatRoundMutation.isPending}
                      className="create-round-button"
                    >
                      {createCombatRoundMutation.isPending ? 'Creating...' : 'Start New Round'}
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
                        disabled={unfreezeEventMutation.isPending}
                        className="unfreeze-event-button"
                        title="Unfreeze event and session"
                      >
                        {unfreezeEventMutation.isPending ? 'Unfreezing...' : 'Unfreeze'}
                      </button>
                    ) : (
                      <button
                        onClick={freezeEvent}
                        disabled={freezeEventMutation.isPending}
                        className="freeze-event-button"
                        title="Freeze event and session"
                      >
                        {freezeEventMutation.isPending ? 'Freezing...' : 'Freeze'}
                      </button>
                    )}
                    <button
                      onClick={closeEvent}
                      disabled={closeEventMutation.isPending}
                      className="close-event-button"
                    >
                      {closeEventMutation.isPending ? 'Closing...' : 'Close Event'}
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
                    disabled={createEventMutation.isPending || !eventForm.title}
                    className="create-event-button"
                  >
                    {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
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