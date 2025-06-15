'use client';

import React from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "../../utils/AuthContext";
import { usePresence } from "../../contexts/PresenceContext";
import { api } from '../../../services/apiClient';
import { WS_URL } from '../../../config/api';

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

      await api.post('/auth/logout', {});

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
