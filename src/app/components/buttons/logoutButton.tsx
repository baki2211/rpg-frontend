'use client';

import React from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "../../utils/AuthContext";
import { usePresence } from "../../contexts/PresenceContext";
import { api } from '../../../services/apiClient';
import { WS_URL } from '../../../config/api';
import { tokenService } from '../../../services/tokenService';

const LogoutButton: React.FC = () => {
  const router = useRouter();
  const { setIsAuthenticated, setUser } = useAuth();
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

      // Clear token and user data from localStorage
      tokenService.clearAuth();
      
      // Update global state
      setIsAuthenticated(false);
      setUser(null);
      
      // Redirect to login page
      router.push('/pages/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if the API call fails, clear local state
      tokenService.clearAuth();
      setIsAuthenticated(false);
      setUser(null);
      router.push('/pages/login');
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
