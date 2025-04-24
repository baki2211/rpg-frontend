import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PresenceUser {
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

  const deriveLocation = (path: string) => {
    if (path.startsWith('/map')) return 'Map';
    if (path.startsWith('/chat/')) return `Chat ${path.split('/chat/')[1]}`;
    return 'Dashboard';
  };

  useEffect(() => {
    if (!userId) return;

     const ws = new WebSocket(`ws://localhost:5001/ws/presence?userId=${userId}&username=${encodeURIComponent(username)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to presence WebSocket as ${userId}`);
      ws.send(
        JSON.stringify({
          type: 'updateLocation',
          location: deriveLocation(pathname),
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'onlineUsers') {
        onUpdate(data.users); 
      }
    };

    ws.onclose = () => {
      console.log('Presence WebSocket closed');
    };

    ws.onerror = (err) => {
      console.error('Presence WebSocket error', err);
    };

    return () => {
      ws?.close();
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
