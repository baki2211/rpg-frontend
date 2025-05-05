'use client';

import { useEffect, useState } from 'react';

interface OnlineUser {
  username: string;
  location: string;
}

const useOnlineUsers = (websocket: WebSocket | null) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!websocket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'onlineUsers') {
          setOnlineUsers(data.users);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    websocket.addEventListener('message', handleMessage);

    // Request online users list periodically
    const intervalId = setInterval(() => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: 'getOnlineUsers' }));
      }
    }, 15000); // Refresh every 15 seconds

    // Initial request
    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({ type: 'getOnlineUsers' }));
    } else {
      websocket.addEventListener('open', () => {
        websocket.send(JSON.stringify({ type: 'getOnlineUsers' }));
      });
    }

    return () => {
      websocket.removeEventListener('message', handleMessage);
      clearInterval(intervalId);
    };
  }, [websocket]);

  return { onlineUsers, loading };
};

export default useOnlineUsers;