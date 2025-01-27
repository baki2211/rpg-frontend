'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../utils/AuthContext'; // Adjust the path as needed
import { useParams } from 'next/navigation';
import useWebSocket from '../../../utils/web-socket'; // Import the WebSocket logic

const ChatPage = () => {
  const { user } = useAuth(); // Retrieve the logged-in user
  const params = useParams(); // Use `useParams` to get the `locationId`
  const locationId = params?.locationId as string; // Extract locationId

  const [messages, setMessages] = useState<{ username: string; createdAt: string; message: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const { connectionStatus, sendMessage, errorMessage } = useWebSocket({
    locationId,
    onMessage: (message) => {
      setMessages((prev) => [...prev, message]); // Add the new message to the chat
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onClose: (event) => {
      console.warn('WebSocket connection closed:', event);
    },
  });

  // Fetch existing messages for the location
  useEffect(() => {
    if (!locationId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/chat/${locationId}`, { credentials: 'include' });
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [locationId]);

  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      console.error('You must be logged in to send messages.');
      return;
    }

    const message = {
      locationId,
      userId: user.id, // User ID from AuthContext
      username: user.username, // Username from AuthContext
      message: newMessage,
      createdAt: new Date().toISOString(),
    };
    sendMessage(message); // Use the `sendMessage` function
    setNewMessage(''); // Clear the input field
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#b7abab' }}>
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
      </form>
      {connectionStatus === 'error' && <p style={{ color: 'red' }}>WebSocket connection failed.</p>}
    </div>
  );
};

export default ChatPage;
