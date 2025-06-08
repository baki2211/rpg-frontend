import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';

interface PresenceUser {
  username: string;
  characterName?: string;
  location: string;
}

interface Location {
  id: number;
  name: string;
  description: string;
  xCoordinate: number;
  yCoordinate: number;
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

const getLocationFromPath = async (path: string | null): Promise<string> => {
  if (!path) return 'Dashboard';
  
  if (path.includes('/pages/map')) return 'Map';
  if (path.includes('/pages/chat/')) {
    const locationId = path.split('/pages/chat/')[1];
    try {
      const response = await axios.get<{ locations: Location[] }>('http://localhost:5001/api/maps/main', {
        withCredentials: true
      });
      const location = response.data.locations.find((loc) => loc.id === parseInt(locationId));
      return location ? `Chat: ${location.name}` : `Chat ${locationId}`;
    } catch (error) {
      console.error('Error fetching location name:', error);
      // If we can't get the location name, just return the ID
      return `Chat ${locationId}`;
    }
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

    ws.onopen = async () => {
      const location = await getLocationFromPath(pathname);
      ws.send(JSON.stringify({ type: 'updateLocation', location }));
      // Request initial online users list
      ws.send(JSON.stringify({ type: 'getOnlineUsers' }));
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

    ws.onclose = () => {
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
          
          // Set up a fallback to request online users if we don't get them within 2 seconds
          setTimeout(() => {
            if (onlineUsers.length === 0 && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'getOnlineUsers' }));
            }
          }, 2000);
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
    const updateLocation = async () => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !currentUser) return;

      const location = await getLocationFromPath(pathname);
      ws.send(JSON.stringify({ type: 'updateLocation', location }));
    };

    updateLocation();
  }, [pathname, currentUser]);

  return (
    <PresenceContext.Provider value={{ onlineUsers, currentUser }}>
      {children}
    </PresenceContext.Provider>
  );
}; 