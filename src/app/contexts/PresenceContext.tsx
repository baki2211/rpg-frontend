import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PresenceUser {
  username: string;
  location: string;
}

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

const getLocationFromPath = (path: string | null): string => {
  if (!path) return 'Dashboard';
  
  if (path.includes('/pages/map')) return 'Map';
  if (path.includes('/pages/chat/')) {
    const locationId = path.split('/pages/chat/')[1];
    return `Chat ${locationId}`;
  }
  if (path.includes('/pages/dashboard')) return 'Dashboard';
  if (path.includes('/pages/characters')) return 'Characters';
  if (path.includes('/pages/protected')) return 'Protected';
  
  return 'Dashboard';
};

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const pathname = usePathname();
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  const initializeWebSocket = (userId: string, username: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`ws://localhost:5001/ws/presence?userId=${userId}&username=${encodeURIComponent(username)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Presence WebSocket connected');
      const location = getLocationFromPath(pathname);
      ws.send(JSON.stringify({ type: 'updateLocation', location }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'onlineUsers') {
          console.log('Received online users:', data.users);
          setOnlineUsers(data.users);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Presence WebSocket closed');
      wsRef.current = null;
    };

    ws.onerror = (error) => {
      console.error('Presence WebSocket error:', error);
    };

    return ws;
  };

  // Fetch user data and initialize WebSocket
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/user/dashboard', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.user) {
          setCurrentUser({
            id: data.user.id,
            username: data.user.username,
          });
          initializeWebSocket(data.user.id, data.user.username);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  // Update location when pathname changes
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !currentUser) return;

    const location = getLocationFromPath(pathname);
    console.log('Updating location to:', location);
    ws.send(JSON.stringify({ type: 'updateLocation', location }));
  }, [pathname, currentUser]);

  return (
    <PresenceContext.Provider value={{ onlineUsers, currentUser }}>
      {children}
    </PresenceContext.Provider>
  );
}; 