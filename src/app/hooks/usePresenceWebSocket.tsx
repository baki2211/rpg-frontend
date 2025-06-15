import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { WS_URL } from '../../config/api';

export interface PresenceUser {
  username: string;
  location: string;
}

const usePresenceWebSocket = (
  userId: string,
  username: string,
  onUpdate: (users: PresenceUser[]) => void
) => {
  const wsRef = useRef<WebSocket | null>(null);
  const pathname = usePathname();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const baseDelay = 1000; // 1 second

  const deriveLocation = (path: string) => {
    if (path.startsWith('/map')) return 'Map';
    if (path.startsWith('/chat/')) return `Chat ${path.split('/chat/')[1]}`;
    return 'Dashboard';
  };

  const connect = () => {
    if (!userId || !username) return;

    try {
      const ws = new WebSocket(`${WS_URL}/ws/presence?userId=${userId}&username=${encodeURIComponent(username)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`Connected to presence WebSocket as ${userId}`);
        retryCountRef.current = 0; // Reset retry count on successful connection
        ws.send(
          JSON.stringify({
            type: 'updateLocation',
            location: deriveLocation(pathname),
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'onlineUsers') {
            onUpdate(data.users);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Presence WebSocket closed');
        handleReconnect();
      };

      ws.onerror = (err) => {
        console.error('Presence WebSocket error', err);
        // Don't handle reconnection here, let onclose handle it
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      handleReconnect();
    }
  };

  const handleReconnect = () => {
    if (retryCountRef.current >= maxRetries) {
      console.error('Max retry attempts reached. Unable to reconnect WebSocket.');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(baseDelay * Math.pow(2, retryCountRef.current), 30000); // Max 30 seconds
    console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      retryCountRef.current += 1;
      connect();
    }, delay);
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, username]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const newLoc = deriveLocation(pathname);
    ws.send(JSON.stringify({ type: 'updateLocation', location: newLoc }));
  }, [pathname]);
};

export default usePresenceWebSocket;
