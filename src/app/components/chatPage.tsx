'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../utils/AuthContext'; // Assumes AuthContext provides the user info
import { useRouter } from 'next/router';

const ChatPage = ({ params }: { params: { locationId: string } }) => {
  const { user } = useAuth(); // Retrieve the logged-in user
  const router = useRouter();
  const [messages, setMessages] = useState<{ username: string; createdAt: string; message: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const ws = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection for a specific location (WebSocket room)
  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:5001?locationId=${params.locationId}`);
    ws.current.onopen = () => console.log(`WebSocket connection established for location: ${params.locationId}`);
    ws.current.onclose = () => console.log(`WebSocket connection closed for location: ${params.locationId}`);
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]); // Add the new message to the chat
    };

    return () => {
      ws.current?.close(); // Clean up the WebSocket connection on unmount
    };
  }, [params.locationId]);

  // Fetch existing messages for the location
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/chat/${params.locationId}`, { credentials: 'include' });
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setErrorMessage('Failed to load chat messages.');
      }
    };

    fetchMessages();
  }, [params.locationId]);

  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must be logged in to send messages.');
      return;
    }

    if (ws.current && newMessage.trim() !== '') {
      const message = {
        locationId: params.locationId,
        userId: user.id, // User ID from AuthContext
        username: user.username, // Username from AuthContext
        message: newMessage,
        createdAt: new Date().toISOString(),
      };
      ws.current.send(JSON.stringify(message)); // Send message via WebSocket
      setNewMessage(''); // Clear the input field
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <strong>{msg.username}</strong> - <em>{new Date(msg.createdAt).toLocaleString()}:</em>
            <p>{msg.message}</p>
          </div>
        ))}
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
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
};

export default ChatPage;
