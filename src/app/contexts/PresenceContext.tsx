import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '../../services/apiClient';
import { WS_URL, BASE_URL } from '../../config/api';
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
  isPresenceEnabled: boolean;
  resetConnection: () => void;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: [],
  currentUser: null,
  connectionStatus: 'disconnected',
  isPresenceEnabled: true,
  resetConnection: () => {},
});

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [serverMessage, setServerMessage] = useState<string | undefined>();
  const [isPresenceEnabled, setIsPresenceEnabled] = useState(true);
  const pathname = usePathname();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const { user, isAuthenticated } = useAuth();

  // Check server health before reconnecting
  const checkServerHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      const health = await response.json();
      return health.memory.usage_percent < 70 && health.connections.total < 8;
    } catch {
      return false;
    }
  }, []);

  const createWebSocketConnection = useCallback(async (userId: string, username: string) => {
    // Prevent connection overlaps with state tracking
    if (connectionState !== 'idle' && connectionState !== 'failed') {
      console.log('⚠️ WebSocket connection already in progress, skipping new connection attempt');
      return;
    }

    // Check if there's already an active connection
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('⚠️ WebSocket connection already exists, skipping new connection attempt');
      return;
    }

    try {
      console.log(`🔌 Attempting WebSocket connection for user ${userId} (${username})`);
      setConnectionState('connecting');
      setConnectionStatus('connecting');
      setServerMessage(undefined);
      
      const ws = new WebSocket(`${WS_URL}/ws/presence?userId=${userId}&username=${encodeURIComponent(username)}`);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('✅ Presence WebSocket connected successfully');
        setConnectionState('connected');
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

      ws.onclose = async (event) => {
        console.log(`🔌 Presence WebSocket closed - Code: ${event.code}, Reason: ${event.reason}`);
        wsRef.current = null;
        setConnectionState('failed');
        setConnectionStatus('disconnected');
        
        // Handle resource constraint errors (1006, 1013) with immediate graceful degradation
        if (event.code === 1006 || event.code === 1013) {
          console.warn('🚨 Server resource constraints detected - disabling real-time features');
          setServerMessage('Server is busy. Real-time features temporarily disabled. Core functionality remains available.');
          setIsPresenceEnabled(false);
          setConnectionStatus('error');
          
          // Don't retry automatically for resource errors - require manual reset
          // This prevents overwhelming the server
          return;
        }
        
        // Handle other error codes with conservative retry logic
        if (event.code === 1008) { // Policy violation (rate limit, missing params)
          console.warn('⚠️ Connection rejected by server - check parameters');
          setServerMessage('Connection rejected. Please refresh the page.');
          setConnectionStatus('error');
          return;
        }
        
        // Only attempt reconnection for normal disconnections if we're still authenticated
        // and haven't exceeded retry limit (reduced to 1 attempt)
        if (isAuthenticated && retryCountRef.current < 1) {
          // Check server health before attempting reconnection
          const serverHealthy = await checkServerHealth();
          
          if (!serverHealthy) {
            console.log('🏥 Server health check failed - postponing reconnection');
            setServerMessage('Server overloaded. Will retry when server capacity improves.');
            
            // Try again in 5 minutes if server is unhealthy
            reconnectTimeoutRef.current = setTimeout(async () => {
              if (isAuthenticated && currentUser) {
                console.log('🔄 Retrying connection after server health delay...');
                createWebSocketConnection(currentUser.id, currentUser.username);
              }
            }, 300000); // 5 minutes
            return;
          }
          
          const delay = 5000; // 5 second delay for normal disconnections
          retryCountRef.current++;
          
          console.log(`Will attempt to reconnect presence WebSocket in ${delay/1000}s (attempt ${retryCountRef.current}/1)`);
          setServerMessage(`Reconnecting in ${Math.ceil(delay/1000)}s...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isAuthenticated && currentUser) {
              console.log(`Attempting to reconnect presence WebSocket (attempt ${retryCountRef.current})`);
              setConnectionState('idle'); // Reset state for retry
              createWebSocketConnection(currentUser.id, currentUser.username);
            }
          }, delay);
        } else if (retryCountRef.current >= 1) {
          console.warn('🚫 Max reconnection attempts reached for presence WebSocket.');
          setConnectionStatus('error');
          setServerMessage('Connection failed. Real-time features disabled. Click "Retry Connection" to try again.');
          setIsPresenceEnabled(false);
        }
      };

      ws.onerror = (error) => {
        console.error('Presence WebSocket error:', error);
        setConnectionState('failed');
        setConnectionStatus('error');
        // Don't immediately try to reconnect on error - let onclose handle it
      };

      return ws;
    } catch (error) {
      console.error('Error creating presence WebSocket:', error);
      setConnectionState('failed');
      setConnectionStatus('error');
      setServerMessage('Failed to establish connection to server.');
    }
  }, [pathname, isAuthenticated, currentUser, connectionState, checkServerHealth]);

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

  // Polling fallback when WebSocket fails
  const startPollingFallback = useCallback(() => {
    if (!isAuthenticated || !currentUser) return;
    
    console.log('Starting polling fallback for presence data');
    const pollInterval = setInterval(async () => {
      try {
        // Only poll for basic user data, not real-time presence
        // This reduces server load while maintaining core functionality
        const response = await api.get('/auth/me');
        if (response.data) {
          // Just verify we're still authenticated, don't update presence
          console.log('Polling fallback: user still authenticated');
        }
      } catch (error) {
        console.error('Polling fallback failed:', error);
        clearInterval(pollInterval);
      }
    }, 60000); // Poll every minute instead of real-time updates

    return () => clearInterval(pollInterval);
  }, [isAuthenticated, currentUser]);

  // Start polling fallback when presence is disabled
  useEffect(() => {
    if (!isPresenceEnabled && isAuthenticated && currentUser) {
      const cleanup = startPollingFallback();
      return cleanup;
    }
  }, [isPresenceEnabled, isAuthenticated, currentUser, startPollingFallback]);

  // Reset connection function for manual retry
  const resetConnection = useCallback(() => {
    console.log('🔄 Manually resetting connection...');
    retryCountRef.current = 0;
    setConnectionState('idle');
    setIsPresenceEnabled(true);
    setConnectionStatus('disconnected');
    setServerMessage(undefined);
    
    if (currentUser) {
      initializeWebSocket(currentUser.id, currentUser.username);
    }
  }, [currentUser, initializeWebSocket]);

  return (
    <PresenceContext.Provider value={{ onlineUsers, currentUser, connectionStatus, serverMessage, isPresenceEnabled, resetConnection }}>
      {children}
    </PresenceContext.Provider>
  );
}; 