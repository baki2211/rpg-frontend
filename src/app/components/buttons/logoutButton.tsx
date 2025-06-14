'use client';

import React from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
import { useAuth } from "../../utils/AuthContext";
import { usePresence } from "../../contexts/PresenceContext";
import { API_URL, WS_URL } from '../../../config/api';

const LogoutButton: React.FC = () => {
  const router = useRouter();
  const { setIsAuthenticated, setUser } = useAuth(); // Add setUser to clear user data
  const { currentUser } = usePresence();

  const handleLogout = async () => {
    try {
      // Send logout message to WebSocket server
      if (currentUser) {
        const ws = new WebSocket(`${WS_URL}/ws/presence?userId=${currentUser.id}&username=${encodeURIComponent(currentUser.username)}`);
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'logout' }));
          ws.close();
        };
      }

      await axios.post(`${API_URL}/auth/logout`, {}, {
        withCredentials: true,
      });

      setIsAuthenticated(false); // Update global authentication state
      setUser(null); // Clear user data
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
