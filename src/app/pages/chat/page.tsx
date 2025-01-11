'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ChatPage = ({ params }: { params: { locationId: string } }) => {
    const [messages, setMessages] = useState<{ username: string; createdAt: string; message: string }[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
  
    // Fetch messages for the location
    useEffect(() => {
      const fetchMessages = async () => {
        try {
          const response = await axios.get(`http://localhost:5001/api/chat/${params.locationId}`, { withCredentials: true });
          setMessages(response.data);
        } catch (error) {
          console.error('Failed to fetch messages:', error);
          setErrorMessage('Failed to load chat messages.');
        }
      };
  
      fetchMessages();
    }, [params.locationId]);
  
    // Handle sending a new message
    const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const userId = 1; // Replace with the actual logged-in user ID
        const username = 'TestUser'; // Replace with the actual logged-in username
        const response = await axios.post(
          `http://localhost:5001/api/chat/${params.locationId}`,
          { userId, username, message: newMessage },
          { withCredentials: true }
        );
        setMessages((prev) => [...prev, response.data]); // Append the new message
        setNewMessage(''); // Clear the input
      } catch (error) {
        console.error('Failed to send message:', error);
        setErrorMessage('Failed to send message.');
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