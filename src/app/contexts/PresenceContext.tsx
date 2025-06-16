import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../utils/AuthContext';
import { getLocationFromPath } from '../../utils/locationUtils';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface PresenceUser {
  userId: string;
  username: string;
  characterName: string | null;
  location: string;
}

interface PresenceContextType {
  onlineUsers: PresenceUser[];
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  serverMessage: string | null;
  isPresenceEnabled: boolean;
  setIsPresenceEnabled: (enabled: boolean) => void;
  refreshConnection: () => void;
  resetConnection: () => void;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isPresenceEnabled, setIsPresenceEnabled] = useState(true);
  const pathname = usePathname();
  const eventSourceRef = useRef<EventSource | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Update current user when auth changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setCurrentUser({ id: user.id, username: user.username });
    } else {
      setCurrentUser(null);
      setOnlineUsers([]);
      setConnectionStatus('disconnected');
    }
  }, [isAuthenticated, user]);

  // Connect to SSE endpoint
  const connect = useCallback(async (userId: string, username: string) => {
    if (!isPresenceEnabled) {
      console.log('Presence system is disabled');
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      console.log('Closing existing SSE connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear any existing heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    try {
      console.log(`Connecting to presence system for user ${userId}`);
      setConnectionStatus('disconnected');
      setServerMessage(null);

      const eventSource = new EventSource(`${BASE_URL}/api/presence/events?userId=${userId}&username=${encodeURIComponent(username)}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'onlineUsers') {
            setOnlineUsers(data.users);
            setConnectionStatus('connected');
            setServerMessage(null);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setConnectionStatus('disconnected');
        setServerMessage('Connection lost. Reconnecting...');
        
        // Close the connection
        eventSource.close();
        eventSourceRef.current = null;
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Try to reconnect after 5 seconds
        setTimeout(() => {
          if (isAuthenticated && currentUser && isPresenceEnabled) {
            console.log('Attempting to reconnect to presence system...');
            connect(currentUser.id, currentUser.username);
          }
        }, 5000);
      };

      // Set up heartbeat
      heartbeatIntervalRef.current = setInterval(async () => {
        if (isAuthenticated && currentUser) {
          try {
            const response = await fetch(`${BASE_URL}/api/presence/heartbeat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.id })
            });
            
            if (!response.ok) {
              throw new Error('Heartbeat failed');
            }
          } catch (error) {
            console.error('Heartbeat error:', error);
            // If heartbeat fails, try to reconnect
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }
            if (heartbeatIntervalRef.current) {
              clearInterval(heartbeatIntervalRef.current);
              heartbeatIntervalRef.current = null;
            }
            connect(currentUser.id, currentUser.username);
          }
        }
      }, 30000); // Every 30 seconds

      // Update location
      const location = await getLocationFromPath(pathname);
      await fetch(`${BASE_URL}/api/presence/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, username, location })
      });

    } catch (error) {
      console.error('Error connecting to presence system:', error);
      setServerMessage('Failed to connect. Will retry...');
      setConnectionStatus('disconnected');
    }
  }, [isAuthenticated, currentUser, pathname, isPresenceEnabled]);

  // Update location when path changes
  useEffect(() => {
    if (isAuthenticated && currentUser && connectionStatus === 'connected') {
      getLocationFromPath(pathname).then((location: string) => {
        fetch(`${BASE_URL}/api/presence/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: currentUser.id, 
            username: currentUser.username,
            location 
          })
        }).catch(error => {
          console.error('Error updating location:', error);
        });
      });
    }
  }, [pathname, isAuthenticated, currentUser, connectionStatus]);

  // Connect when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser && isPresenceEnabled) {
      connect(currentUser.id, currentUser.username);
    }
  }, [isAuthenticated, currentUser, isPresenceEnabled, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, []);

  // Manual refresh function
  const refreshConnection = useCallback(() => {
    if (isAuthenticated && currentUser && isPresenceEnabled) {
      console.log('Manually refreshing presence connection...');
      connect(currentUser.id, currentUser.username);
    }
  }, [isAuthenticated, currentUser, isPresenceEnabled, connect]);

  const resetConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnectionStatus('disconnected');
    setServerMessage(null);
    // The useEffect will handle reconnection
  }, []);

  const value = useMemo(() => ({
    onlineUsers,
    connectionStatus,
    serverMessage,
    isPresenceEnabled,
    setIsPresenceEnabled,
    refreshConnection,
    resetConnection
  }), [onlineUsers, connectionStatus, serverMessage, isPresenceEnabled, setIsPresenceEnabled, refreshConnection, resetConnection]);

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}; 