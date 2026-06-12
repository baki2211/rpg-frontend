'use client';

import React from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "../../contexts/AuthContext";
import { usePresence } from "../../contexts/PresenceContext";
import { authService } from '../../../services/authService';
import { WS_URL } from '../../../config/api';
import { ROUTES } from '../../../config/routes';

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

      await authService.logout();

      // Update global state
      setIsAuthenticated(false);
      setUser(null);

      // Redirect to login page
      router.push(ROUTES.login);
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if the API call fails, clear local state
      await authService.logout();
      setIsAuthenticated(false);
      setUser(null);
      router.push(ROUTES.login);
    }
  };

  return (
    <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
  );
};

export default LogoutButton;
