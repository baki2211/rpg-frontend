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
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  serverMessage?: string;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: [],
  currentUser: null,
  connectionStatus: 'disconnected',
});

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [serverMessage, setServerMessage] = useState<string | undefined>();
  const pathname = usePathname();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const { user, isAuthenticated } = useAuth();

  const createWebSocketConnection = useCallback((userId: string, username: string) => {
    try {
      setConnectionStatus('connecting');
      setServerMessage(undefined);
      
      const ws = new WebSocket(`${WS_URL}/ws/presence?userId=${userId}&username=${encodeURIComponent(username)}`);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('Presence WebSocket connected');
        setConnectionStatus('connected');
        setServerMessage(undefined);
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
        setConnectionStatus('disconnected');
        
        // Handle specific error codes
        if (event.code === 1006) {
          console.warn('WebSocket closed abnormally - server may be experiencing resource issues');
          setServerMessage('Server is experiencing high load. Presence features may be limited.');
        }
        
        // Only attempt reconnection if we're still authenticated and haven't exceeded retry limit
        // Don't reconnect immediately on resource errors (1006) - wait longer
        if (isAuthenticated && retryCountRef.current < 3) { // Reduced retry attempts
          const baseDelay = event.code === 1006 ? 30000 : 1000; // 30s delay for resource errors
          const delay = Math.min(baseDelay * Math.pow(2, retryCountRef.current), 60000); // Max 60s
          retryCountRef.current++;
          
          console.log(`Will attempt to reconnect presence WebSocket in ${delay/1000}s (attempt ${retryCountRef.current})`);
          setServerMessage(`Reconnecting in ${Math.ceil(delay/1000)}s... (${retryCountRef.current}/3)`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isAuthenticated && currentUser) {
              console.log(`Attempting to reconnect presence WebSocket (attempt ${retryCountRef.current})`);
              createWebSocketConnection(currentUser.id, currentUser.username);
            }
          }, delay);
        } else if (retryCountRef.current >= 3) {
          console.warn('Max reconnection attempts reached for presence WebSocket. Server may be overloaded.');
          setConnectionStatus('error');
          setServerMessage('Unable to connect to server. Please refresh the page or try again later.');
        }
      };

      ws.onerror = (error) => {
        console.error('Presence WebSocket error:', error);
        setConnectionStatus('error');
        // Don't immediately try to reconnect on error - let onclose handle it
      };

      return ws;
    } catch (error) {
      console.error('Error creating presence WebSocket:', error);
      setConnectionStatus('error');
      setServerMessage('Failed to establish connection to server.');
    }
  }, [pathname, isAuthenticated, currentUser]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback((userId: string, username: string) => {
    // Clear any existing connection
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Add a small delay to ensure previous connection is fully closed
    setTimeout(() => {
      createWebSocketConnection(userId, username);
    }, 100);
  }, [createWebSocketConnection]);

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
    <PresenceContext.Provider value={{ onlineUsers, currentUser, connectionStatus, serverMessage }}>
      {children}
    </PresenceContext.Provider>
  );
}; 