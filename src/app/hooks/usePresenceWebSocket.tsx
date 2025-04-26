import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthenticatedWebSocket } from './useAuthenticatedWebSocket';

interface PresenceUser {
  username: string;
  location: string;
}

const usePresenceWebSocket = (
  userId: string,
  username: string,
  onUpdate: (users: PresenceUser[]) => void
) => {
  const pathname = usePathname();

  const deriveLocation = (path: string) => {
    if (path.startsWith('/map')) return 'Map';
    if (path.startsWith('/chat/')) return `Chat ${path.split('/chat/')[1]}`;
    return 'Dashboard';
  };

  const wsRef = useAuthenticatedWebSocket(
    `ws://localhost:5001/ws/presence?userId=${userId}&username=${encodeURIComponent(username)}`,
    (event, socket) => {
      socket.send(
        JSON.stringify({
          type: 'updateLocation',
          location: deriveLocation(pathname),
        })
      );
    },
    (event, socket) => {
      const data = JSON.parse(event.data);
      if (data.type === 'onlineUsers') {
        onUpdate(data.users);
      }
    }
  );

  useEffect(() => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'updateLocation', location: deriveLocation(pathname) }));
    }
  }, [pathname]);

  return wsRef;
};

export default usePresenceWebSocket;
