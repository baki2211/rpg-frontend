'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../utils/AuthContext'; 
import { useParams } from 'next/navigation';
import useWebSocket from '../../../utils/web-socket'; 

const ChatPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const locationId = params?.locationId as string; 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<{ username: string; createdAt: string; message: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { connectionStatus, sendMessage, errorMessage } = useWebSocket({
    locationId,
    onMessage: (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Trying to reconnect...');
    },
    onClose: (event) => {
      console.warn('WebSocket connection closed:', event);
      setError('Connection lost. Attempting to reconnect...');
    },
  });

  useEffect(() => {
    if (!locationId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/chat/${locationId}`, {
          credentials: 'include'
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
  }, [locationId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error('You must be logged in to send messages.');
      return;
      }
    if (!newMessage.trim()) return;

    const message = {
      locationId,
      userId: user.id, 
      username: user.username,
      message: newMessage,
      createdAt: new Date().toISOString(),
    };

    sendMessage(message);
    setNewMessage('');
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#b7abab' }}>
      {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        
        {connectionStatus === 'connecting' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
            Connecting to chat...
          </div>
        )}
          {Array.isArray(messages) && messages.length > 0 ? (
        messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <strong>{msg.username}</strong> - <em>{new Date(msg.createdAt).toLocaleString()}:</em>
            <p>{msg.message}</p>
          </div>
        ))
      ) : (
        <p>No messages yet...</p>
      )}
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
        {connectionStatus === 'error' && (
          <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
        )}
      </form>
      {connectionStatus === 'error' && <p style={{ color: 'red' }}>WebSocket connection failed.</p>}
    </div>
  );
};

export default ChatPage;
