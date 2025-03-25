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
  const [messages, setMessages] = useState<{ username: string; createdAt: string; message: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const webSocketServiceRef = useRef<WebSocketService | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!locationId) return;

    // Fetch messages from the database
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/chat/${locationId}`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setError('Failed to load messages. Please try again later.');
      }
    };

    fetchMessages();

    // Initialize WebSocket connection
    const wsUrl = `ws://localhost:5002?locationId=${locationId}`;
    webSocketServiceRef.current = new WebSocketService({
      url: wsUrl,
      onMessage: (message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Trying to reconnect...');
        setConnectionStatus('error');
      },
      onClose: (event) => {
        console.warn('WebSocket connection closed:', event);
        setError('Connection lost. Attempting to reconnect...');
        setConnectionStatus('closed');
      },
      onOpen: (event) => {
        console.log('WebSocket connection opened:', event);
        setConnectionStatus('open');
      },
    });

    // Cleanup on unmount
    return () => {
      webSocketServiceRef.current?.close();
    };
  }, [locationId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    const message = {
      locationId,
      userId: user.id,
      username: user.username,
      message: newMessage,
      createdAt: new Date().toISOString(),
    };

    webSocketServiceRef.current?.sendMessage(message);
    setNewMessage('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#b7abab' }}>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {connectionStatus === 'connecting' && <div>Connecting to chat...</div>}
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <strong>{msg.username}</strong> - <em>{new Date(msg.createdAt).toLocaleString()}:</em>
            <p>{msg.message}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '1rem', borderTop: '1px solid #ccc' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, marginRight: '1rem' }}
          required
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatPage;