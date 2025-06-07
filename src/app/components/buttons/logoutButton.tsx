'use client';

import React from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
import { useAuth } from "../../utils/AuthContext";
import { usePresence } from "../../contexts/PresenceContext";

const LogoutButton: React.FC = () => {
  const router = useRouter();
  const { setIsAuthenticated } = useAuth(); // Use AuthContext to update state
  const { currentUser } = usePresence();

  const handleLogout = async () => {
    try {
      // Send logout message to WebSocket server
      if (currentUser) {
        const ws = new WebSocket(`ws://localhost:5001/ws/presence?userId=${currentUser.id}&username=${encodeURIComponent(currentUser.username)}`);
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'logout' }));
          ws.close();
        };
      }

      await axios.post('http://localhost:5001/api/auth/logout', {}, {
        withCredentials: true,
      });

      setIsAuthenticated(false); // Update global authentication state
      router.push('/pages/login'); // Redirect to login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="btn btn-secondary"
    >
      🚪 Logout
    </button>
  );
};

export default LogoutButton;
