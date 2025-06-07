'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../utils/AuthContext';
import { useParams } from 'next/navigation';
import { WebSocketService } from '../../../services/webSocketService';
import { SkillsModal } from '@/app/components/skills/SkillsModal';
import { MiniSkillRow } from '@/app/components/skills/MiniSkillRow';
import { Skill } from '@/app/hooks/useCharacter';
import { ChatUser } from '@/app/hooks/useChatUsers';
import './chat.css';

const ChatPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const locationId = params?.locationId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<{ username: string; createdAt: string; message: string; formattedMessage?: string; skill?: Skill }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const webSocketServiceRef = useRef<WebSocketService | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<(Skill & { selectedTarget?: ChatUser }) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    let hasAttemptedFirstConnect = false;
    
    if (!locationId) return;

    // Fetch messages from the database
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/chat/${locationId}`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        console.log('Fetched messages from database:', data);
        // Add formattedMessage to each message
        const formatted = data.map((msg: { username: string; createdAt: string; message: string; skill?: Skill }) => {
          console.log('Processing message:', msg);
          return {
            ...msg,
            formattedMessage: `${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${msg.username}`,
          };
        });
        console.log('Formatted messages:', formatted);
        setMessages(formatted);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();

    // Set up interval to periodically check for restored messages (when session is unfrozen)
    const messageCheckInterval = setInterval(fetchMessages, 10000); // Check every 10 seconds

    // Initialize WebSocket connection
    const wsUrl = `ws://localhost:5001/ws/chat?locationId=${locationId}`;
    webSocketServiceRef.current = new WebSocketService({
      url: wsUrl,
      onMessage: (message) => {
        console.log('Received WebSocket message:', message);
        const typedMessage = message as unknown as { 
          username: string; 
          createdAt: string; 
          message: string;
          skill?: Skill;
        };
        const formattedMessage = {
          ...typedMessage,
          formattedMessage: `${new Date(typedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${typedMessage.username}`,
        };
        console.log('Formatted message with skill:', formattedMessage);
        setMessages((prev) => [...prev, formattedMessage]);
        scrollToBottom();
      },
      onError: (error) => {
        if (!hasAttemptedFirstConnect) {
          hasAttemptedFirstConnect = true;
          console.warn('Initial WebSocket connection failed. Retrying silently...');
          return; 
        }
        if (error instanceof Event) {
          console.warn('WebSocket connection error (might be expected during reconnect):', error.type);
        } else {
          console.error('WebSocket error:', JSON.stringify(error));
        }
      },
      onClose: (event) => {
        console.warn('WebSocket connection closed:', event);
      },
      onOpen: (event) => {
        console.log('WebSocket connection opened:', event);
      },
    });

    // Cleanup on unmount
    return () => {
      webSocketServiceRef.current?.close();
      clearInterval(messageCheckInterval);
      hasAttemptedFirstConnect = false;
    };
  }, [locationId]);

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
  }, []);

  // Function to format the message after sanitization
  const formatMessage = (message: string, skill?: Skill) => {
    console.log('Formatting message with skill:', { message, skill });
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    const sanitizedMessage = sanitizeMessage(newMessage);
    console.log('Selected skill before sending:', selectedSkill);
    
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
    
    console.log('Sending message with skill data:', message);
    webSocketServiceRef.current?.sendMessage(message as unknown as JSON);
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
    </div>
  );
};

export default ChatPage;