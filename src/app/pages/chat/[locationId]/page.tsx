'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../utils/AuthContext';
import { useParams } from 'next/navigation';
import { WebSocketService } from '../../../services/webSocketService';
import { SkillsModal } from '@/app/components/skills/SkillsModal';
import { MiniSkillRow } from '@/app/components/skills/MiniSkillRow';
import { MasterPanel } from '@/app/components/master/MasterPanel';
import { Skill } from '@/app/hooks/useCharacter';
import { ChatUser, useChatUsers } from '@/app/hooks/useChatUsers';
import { useToast } from '@/app/contexts/ToastContext';
import { usePresence } from '@/app/contexts/PresenceContext';
import './chat.css';
import { WS_URL, API_CONFIG } from '../../../../config/api';
import { api } from '../../../../services/apiClient';

interface SkillEngineLogMessage {
  type: 'skill_engine_log';
  locationId: string;
  log: {
    id: string;
    timestamp: string;
    type: 'skill_use' | 'clash' | 'damage' | 'effect';
    actor: string;
    target?: string;
    skill?: string;
    damage?: number;
    effects?: string[];
    details: string;
  };
}

interface ChatMessage {
  username: string;
  createdAt: string;
  message: string;
  skill?: Skill;
  formattedMessage?: string;
}

interface CombatRound {
  id: number;
  roundNumber: number;
}

interface CombatRoundResponse {
  round: CombatRound | null;
}

const ChatPage = () => {
  const { user } = useAuth();
  const { showError, showSuccess, showInfo } = useToast();
  const { currentUser } = usePresence();
  const params = useParams();
  const locationId = params?.locationId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<{ username: string; createdAt: string; message: string; formattedMessage?: string; skill?: Skill }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isMasterPanelOpen, setIsMasterPanelOpen] = useState(false);
  const [isPresencePanelOpen, setIsPresencePanelOpen] = useState(false);
  const webSocketServiceRef = useRef<WebSocketService | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<(Skill & { selectedTarget?: ChatUser }) | null>(null);

  // Fetch users in this location
  const { users: chatUsers, loading: usersLoading, refreshing: usersRefreshing, refreshUsers, locationName } = useChatUsers(locationId);

  // Check if user has master permissions
  const isMaster = user?.role === 'master' || user?.role === 'admin';

  // Track active combat round
  const [activeRound, setActiveRound] = useState<{ id: number; roundNumber: number } | null>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isPresencePanelOpen && !target.closest('.presence-dropdown')) {
        setIsPresencePanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPresencePanelOpen]);

  // Update presence location when entering chat
  useEffect(() => {
    const updateLocation = async () => {
      if (!locationId || !currentUser) {
        return;
      }

      try {
        // Get the location name from the API
        const response = await api.get(`/locations/byId/${locationId}`);
        
        const fetchedLocationName = (response.data as { location: { name: string } }).location?.name || 
                                   (response.data as { name: string }).name || 
                                   `Location ${locationId}`;

        // Update presence system with the specific location
        const presenceResponse = await fetch(`${API_CONFIG.baseUrl}/api/presence/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: currentUser.id, 
            username: currentUser.username,
            location: fetchedLocationName
          })
        });

        if (!presenceResponse.ok) {
          const errorText = await presenceResponse.text();
          console.error('Presence update failed:', { status: presenceResponse.status, error: errorText });
        }
        
        // The useChatUsers hook will now handle filtering properly with the location name
      } catch (error) {
        console.error('Error updating location for presence:', error);
        // Fallback to generic location name
        const fallbackName = `Location ${locationId}`;
        
        // Still try to update presence with fallback
        if (currentUser) {
          try {
            await fetch(`${API_CONFIG.baseUrl}/api/presence/location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userId: currentUser.id, 
                username: currentUser.username,
                location: fallbackName
              })
            });
          } catch (presenceError) {
            console.error('Failed to update presence with fallback location:', presenceError);
          }
        }
      }
    };

    updateLocation();
  }, [locationId, currentUser]);

  // Check for active combat round
  useEffect(() => {
    const fetchActiveRound = async () => {
      if (!locationId) return;
      
      try {
        const response = await api.get<CombatRoundResponse>(`/combat/rounds/active/${locationId}`);
        setActiveRound(response.data.round);
      } catch (error) {
        console.error('Error fetching active round:', error);
        setActiveRound(null);
      }
    };

    fetchActiveRound();
    const interval = setInterval(fetchActiveRound, 10000);
    return () => clearInterval(interval);
  }, [locationId]);

  // Submit skill to combat round
  const handleSubmitSkillToCombat = async (skill: Skill & { selectedTarget?: ChatUser }, round: { id: number; roundNumber: number }) => {
    try {
      // Find target character ID if needed
      let targetId = null;
      if ((skill.target === 'other' || skill.target === 'any') && skill.selectedTarget) {
        targetId = skill.selectedTarget.userId;
      }

      const response = await api.post(`/combat/rounds/${round.id}/actions`, {
        skillId: skill.id,
        targetId
      });

      if (response.status === 200 || response.status === 201) {
        console.log('Skill submitted to combat round successfully');
        showSuccess(`${skill.name} submitted to combat round ${round.roundNumber}!`);
      }
    } catch (error) {
      console.error('Error submitting skill to combat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`Failed to submit skill to combat round: ${errorMessage}`);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle incoming skill engine logs from WebSocket
  const handleSkillEngineLog = (logData: SkillEngineLogMessage) => {
    if (isMaster && logData.type === 'skill_engine_log') {
      // Master panel now fetches logs directly from API
      // This WebSocket message could trigger a refresh if needed
    }
  };

  useEffect(() => {
    let hasAttemptedFirstConnect = false;
    
    if (!locationId) return;

    const fetchMessages = async () => {
      try {
        const response = await api.get<ChatMessage[]>(`/chat/${locationId}`);
        const formatted = response.data.map(msg => ({
          ...msg,
          formattedMessage: `${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${msg.username}`,
        }));
        setMessages(formatted);
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
        showError('Failed to load chat messages');
      }
    };

    fetchMessages();
    const messageCheckInterval = setInterval(fetchMessages, 10000);

    const token = localStorage.getItem('auth_token');
    const wsUrl = `${WS_URL}/ws/chat?locationId=${locationId}&userId=${user?.id || ''}&username=${encodeURIComponent(user?.username || '')}&token=${token}`;
    
    webSocketServiceRef.current = new WebSocketService({
      url: wsUrl,
      onMessage: (message: JSON) => {
        const messageData = message as unknown as ChatMessage | SkillEngineLogMessage;
        
        if ('type' in messageData && messageData.type === 'skill_engine_log') {
          handleSkillEngineLog(messageData);
          return;
        }
        
        if (!('username' in messageData) || !('createdAt' in messageData) || !('message' in messageData)) {
          return;
        }
        
        const formattedMessage = {
          ...messageData,
          formattedMessage: `${new Date(messageData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${messageData.username}`,
        };
        setMessages(prev => [...prev, formattedMessage]);
        scrollToBottom();
      },
      onError: (error) => {
        if (!hasAttemptedFirstConnect) {
          hasAttemptedFirstConnect = true;
          return;
        }
        showError(error instanceof Event ? 'Chat connection interrupted, attempting to reconnect...' : 'Chat connection error');
      },
      onClose: (event) => {
        if (event.code !== 1000) {
          showInfo('Chat disconnected');
        }
      },
      onOpen: () => {
        showSuccess('Connected to chat');
      },
    });

    return () => {
      clearInterval(messageCheckInterval);
      if (webSocketServiceRef.current) {
        webSocketServiceRef.current.close();
      }
    };
  }, [locationId, user?.id, user?.username, showError, showInfo, showSuccess]);

  const sanitizeMessage = (message: string) => {
    // First, handle our special formatting
    let formatted = message;
    
    // Replace <text> with « text » for bold
    formatted = formatted.replace(/<([^<>]+)>/g, '« $1 »');
    
    // Replace "text" with italic text
    formatted = formatted.replace(/"([^"]+)"/g, '"$1"');
    
    // Then remove any remaining HTML or JavaScript
    formatted = formatted
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
      .replace(/javascript:/gi, ''); // Remove any javascript: protocol

    return formatted;
  };

  // Add styles for the formatted text
  const styles = `
    .speech-text {
      color: #4a90e2;
      font-weight: bold;
    }
    .thought-text {
      color: #666;
      font-style: italic;
    }
  `;

  // Add the styles to the component
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [styles]);

  // Function to format the message after sanitization
  const formatMessage = (message: string, skill?: Skill) => {
    // Remove debug logging
    if (!message || typeof message !== 'string') {
      return 'Invalid message';
    }
    
    // Handle messages with skills
    if (skill) {
      return (
        <div className="message-with-skill">
          <MiniSkillRow skill={skill} />
          <div className="message-text">
            {message.split(/(«[^»]+»|"[^"]+")/).map((part, i) => {
              if (part.startsWith('«') && part.endsWith('»')) {
                return <span key={i} className="speech-text">{part}</span>;
              } else if (part.startsWith('"') && part.endsWith('"')) {
                return <span key={i} className="thought-text">{part}</span>;
              }
              return part;
            })}
          </div>
        </div>
      );
    }

    // Handle regular messages
    return message.split(/(«[^»]+»|"[^"]+")/).map((part, i) => {
      if (part.startsWith('«') && part.endsWith('»')) {
        return <span key={i} className="speech-text">{part}</span>;
      } else if (part.startsWith('"') && part.endsWith('"')) {
        return <span key={i} className="thought-text">{part}</span>;
      }
      return part;
    });
  };

  const handleSelectSkill = (skill: Skill & { selectedTarget?: ChatUser }) => {
    setSelectedSkill(skill);
    setIsSkillsModalOpen(false);
  };

  const handleUnselectSkill = () => {
    setSelectedSkill(null);
    setIsSkillsModalOpen(false);
  };

  // Master Panel handlers
  const handleApplyDamage = (characterId: string, damage: number) => {
    console.log(`Applied ${damage} damage to character ${characterId}`);
  };

  const handleApplyHealing = (characterId: string, healing: number) => {
    console.log(`Applied ${healing} healing to character ${characterId}`);
  };

  const handleApplyStatus = (characterId: string, status: { id: string; name: string; type: string; duration: number; effects: Record<string, number> }) => {
    console.log(`Applied ${status.name} status effect to character ${characterId} for ${status.duration} turns`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    const sanitizedMessage = sanitizeMessage(newMessage);
    
    const message = {
      locationId,
      userId: user.id,
      username: user.username,
      message: sanitizedMessage,
      createdAt: new Date().toISOString(),
      skill: selectedSkill ? {
        id: selectedSkill.id,
        name: selectedSkill.name,
        branch: selectedSkill.branch,
        type: selectedSkill.type,
        target: selectedSkill.target,
        selectedTarget: selectedSkill.selectedTarget
      } : null
    };
    
    webSocketServiceRef.current?.sendMessage(message as unknown as JSON);
    
    // If there's an active round and a skill is selected, submit to combat as well
    if (selectedSkill && activeRound) {
      handleSubmitSkillToCombat(selectedSkill, activeRound);
    }
    
    setNewMessage('');
    setCharCount(0);
    setSelectedSkill(null); // Reset selected skill after sending
  };

  return (
    <div className="chat-page">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <div className="message-header">
              {msg.formattedMessage || `${msg.username} - ${new Date(msg.createdAt).toLocaleString()}`}
            </div>
            <div className="message-content">
              {formatMessage(msg.message, msg.skill)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        {/* Online Users Dropdown */}
        <div className="presence-dropdown">
          <button 
            type="button"
            className="presence-dropdown-toggle"
            onClick={() => setIsPresencePanelOpen(!isPresencePanelOpen)}
            title={`Online users in ${locationName || `Location ${locationId}`}`}
          >
            👥 {chatUsers.length}
          </button>
          {isPresencePanelOpen && (
            <div className="presence-dropdown-menu">
              <div className="presence-dropdown-header">
                <span>Online in {locationName || `Location ${locationId}`}</span>
                <button 
                  type="button"
                  onClick={refreshUsers}
                  className="refresh-users-btn"
                  disabled={usersRefreshing}
                  title="Refresh user list"
                >
                  {usersRefreshing ? '⏳' : '🔄'}
                </button>
              </div>
              <div className="presence-dropdown-list">
                {usersLoading ? (
                  <div className="dropdown-loading">Loading...</div>
                ) : chatUsers.length === 0 ? (
                  <div className="dropdown-no-users">No users here</div>
                ) : (
                  chatUsers.map((chatUser) => (
                    <div key={`${chatUser.username}-${chatUser.characterName}`} className="dropdown-user">
                      <div className="dropdown-user-avatar">
                        {(chatUser.characterName || chatUser.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="dropdown-user-info">
                        <div className="dropdown-user-character">
                          {chatUser.characterName || 'No character'}
                        </div>
                        <div className="dropdown-user-name">@{chatUser.username}</div>
                      </div>
                      {chatUser.username === user?.username && (
                        <div className="dropdown-you-indicator">You</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            setCharCount(e.target.value.length);
          }}
          placeholder={selectedSkill ? (
            selectedSkill.selectedTarget ? 
              `Using ${selectedSkill.name} on ${selectedSkill.selectedTarget.characterName || selectedSkill.selectedTarget.username}...` : 
              `Using ${selectedSkill.name}...`
          ) : "Type a message..."}
          className="message-input"
          required
        />
        <button 
          type="button"
          onClick={() => setIsSkillsModalOpen(true)}
          className={`skills-button ${selectedSkill ? 'active' : ''}`}
        >
          {selectedSkill ? selectedSkill.name : 'Skills'}
        </button>
        {isMaster && (
          <button 
            type="button"
            onClick={() => setIsMasterPanelOpen(true)}
            className="master-button"
            title="Master Panel"
          >
            🎭
          </button>
        )}
        <button 
          type="submit"
          className="send-button"
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>
      <div className="char-count">
        {charCount} characters
      </div>

      <SkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        onSelectSkill={handleSelectSkill}
        onUnselectSkill={handleUnselectSkill}
        selectedSkill={selectedSkill || undefined}
        locationId={locationId}
      />

      {isMaster && (
        <MasterPanel
          isOpen={isMasterPanelOpen}
          onClose={() => setIsMasterPanelOpen(false)}
          locationId={locationId}
          onApplyDamage={handleApplyDamage}
          onApplyHealing={handleApplyHealing}
          onApplyStatus={handleApplyStatus}
        />
      )}
    </div>
  );
};

export default ChatPage;