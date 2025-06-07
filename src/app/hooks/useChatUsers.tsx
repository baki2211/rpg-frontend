import { useState, useEffect } from 'react';

export interface ChatUser {
  userId: string;
  username: string;
  characterName?: string;
}

export const useChatUsers = (locationId: string) => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatUsers = async () => {
      if (!locationId) return;

      try {
        setLoading(true);
        // This would ideally be an API endpoint that returns users in a specific location
        // For now, we'll use the presence WebSocket to get all online users and filter
        const response = await fetch(`http://localhost:5001/api/sessions/location/${locationId}/participants`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          // Fallback: if no session API, we'll connect to presence WebSocket
          const ws = new WebSocket(`ws://localhost:5001/ws/presence`);
          
          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'onlineUsers') {
                // Filter users by current location
                const currentLocation = `Chat ${locationId}`;
                const locationUsers = data.users
                  .filter((user: { location: string; userId?: string; id?: string; username: string; characterName?: string }) => user.location === currentLocation)
                  .map((user: { location: string; userId?: string; id?: string; username: string; characterName?: string }) => ({
                    userId: user.userId || user.id || '',
                    username: user.username,
                    characterName: user.characterName
                  }));
                setUsers(locationUsers);
              }
            } catch (error) {
              console.error('Error parsing presence data:', error);
            }
          };

          ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'getOnlineUsers' }));
          };

          // Cleanup WebSocket after getting initial data
          setTimeout(() => {
            ws.close();
          }, 2000);
        }
      } catch (error) {
        console.error('Failed to fetch chat users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChatUsers();
  }, [locationId]);

  return { users, loading };
}; 