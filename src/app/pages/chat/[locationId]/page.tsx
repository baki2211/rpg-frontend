'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../utils/AuthContext';
import { useParams } from 'next/navigation';
import { WebSocketService } from '../../../services/webSocketService';

const ChatPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const locationId = params?.locationId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<{ username: string; createdAt: string; message: string; formattedMessage?: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const webSocketServiceRef = useRef<WebSocketService | null>(null);

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
        // Add formattedMessage to each message
        const formatted = data.map((msg: { username: string; createdAt: string; message: string }) => ({
          ...msg,
          formattedMessage: `${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${msg.username}`,
        }));
        setMessages(formatted);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();

    // Initialize WebSocket connection
    const wsUrl = `ws://localhost:5001/ws/chat?locationId=${locationId}`;
    webSocketServiceRef.current = new WebSocketService({
      url: wsUrl,
      onMessage: (message) => {
        const typedMessage = message as unknown as { username: string; createdAt: string; message: string };
        const formattedMessage = {
          ...typedMessage,
          formattedMessage: `${new Date(typedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${typedMessage.username}`,
        };
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
  const formatMessage = (message: string) => {
    return message.split(/(«[^»]+»|"[^"]+")/).map((part, i) => {
      if (part.startsWith('«') && part.endsWith('»')) {
        return <span key={i} className="speech-text">{part}</span>;
      } else if (part.startsWith('"') && part.endsWith('"')) {
        return <span key={i} className="thought-text">{part}</span>;
      }
      return part;
    });
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
    } as unknown as JSON;

    webSocketServiceRef.current?.sendMessage(message);
    setNewMessage('');
    setCharCount(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#b7abab' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <strong>{msg.formattedMessage || `${msg.username} - ${new Date(msg.createdAt).toLocaleString()}`}</strong>
            <p>{formatMessage(msg.message)}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '1rem', borderTop: '1px solid #ccc' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            setCharCount(e.target.value.length);
          }}
          placeholder="Type a message..."
          style={{ flex: 1, marginRight: '1rem' }}
          required
        />
        <button type="submit">Send</button>
      </form>
      <div style={{ textAlign: 'right', padding: '0.5rem', color: 'gray' }}>
        {charCount} characters
      </div>
    </div>
  );
};

export default ChatPage;