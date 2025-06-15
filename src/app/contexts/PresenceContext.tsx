import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '../../services/apiClient';
import { WS_URL } from '../../config/api';
import { useAuth } from '../utils/AuthContext';

interface PresenceUser {
  username: string;
  characterName?: string;
  location: string;
}

// Helper function to get location from pathname
const getLocationFromPath = async (pathname: string): Promise<string> => {
  if (pathname.startsWith('/pages/chat/')) {
    const locationId = pathname.split('/pages/chat/')[1];
    try {
      const response = await api.get(`/location/${locationId}`);
      return (response.data as { name: string }).name || `Location ${locationId}`;
    } catch {
      return `Location ${locationId}`;
    }
  }
  if (pathname.startsWith('/pages/map')) return 'Map';
  if (pathname.startsWith('/pages/dashboard')) return 'Dashboard';
  return 'Unknown';
};

interface PresenceContextType {
  onlineUsers: PresenceUser[];
  currentUser: {
    id: string;
    username: string;
  } | null;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: [],
  currentUser: null,
});

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const pathname = usePathname();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const { user, isAuthenticated } = useAuth();

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback((userId: string, username: string) => {
    // Clear any existing connection
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const ws = new WebSocket(`${WS_URL}/ws/presence?userId=${userId}&username=${encodeURIComponent(username)}`);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('Presence WebSocket connected');
        retryCountRef.current = 0; // Reset retry count on successful connection
        
        const location = await getLocationFromPath(pathname);
        ws.send(JSON.stringify({ type: 'updateLocation', location }));
        
        // Request initial online users list
        ws.send(JSON.stringify({ type: 'getOnlineUsers' }));
        
        // Set up a fallback to request online users again if we don't get them
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'getOnlineUsers' }));
          }
        }, 1000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'onlineUsers') {
            setOnlineUsers(data.users || []);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('Presence WebSocket closed', event.code, event.reason);
        wsRef.current = null;
        
        // Only attempt reconnection if we're still authenticated and haven't exceeded retry limit
        if (isAuthenticated && retryCountRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000); // Exponential backoff, max 10s
          retryCountRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isAuthenticated && currentUser) {
              console.log(`Attempting to reconnect presence WebSocket (attempt ${retryCountRef.current})`);
              initializeWebSocket(currentUser.id, currentUser.username);
            }
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('Presence WebSocket error:', error);
      };

      return ws;
    } catch (error) {
      console.error('Error creating presence WebSocket:', error);
    }
  }, [isAuthenticated, currentUser, pathname]);

  // Initialize user data and WebSocket when authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // Use user data from AuthContext if available
      const userData = {
        id: user.id,
        username: user.username,
      };
      setCurrentUser(userData);
      initializeWebSocket(userData.id, userData.username);
    } else if (!isAuthenticated) {
      // Clear user data and close WebSocket when not authenticated
      setCurrentUser(null);
      setOnlineUsers([]);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, user, initializeWebSocket]);

  // Update location when pathname changes
  useEffect(() => {
    const updateLocation = async () => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !currentUser) return;

      const location = await getLocationFromPath(pathname);
      ws.send(JSON.stringify({ type: 'updateLocation', location }));
    };

    updateLocation();
  }, [pathname, currentUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return (
    <PresenceContext.Provider value={{ onlineUsers, currentUser }}>
      {children}
    </PresenceContext.Provider>
  );
}; 