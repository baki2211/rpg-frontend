import { useEffect, useRef } from 'react';

const usePresenceWebSocket = (
  userId: string,
  onUpdate: (users: { username: string; location: string }[]) => void
) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    ws.current = new WebSocket(`ws://localhost:5001/ws/presence?userId=${userId}`);

    ws.current.onopen = () => {
      console.log(`Connected to presence WebSocket as ${userId}`);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'onlineUsers') {
        const formattedUsers = data.users.map((username: string) => ({
          username,
          location: 'Dashboard',
        }));

        onUpdate(formattedUsers); 
      }
    };

    ws.current.onclose = () => {
      console.log('Presence WebSocket closed');
    };

    ws.current.onerror = (err) => {
      console.error('Presence WebSocket error', err);
    };

    return () => {
      ws.current?.close();
    };
  }, [userId]);
};

export default usePresenceWebSocket;
