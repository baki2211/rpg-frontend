import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../utils/AuthContext';

export interface ChatUser {
  userId: string;
  username: string;
  characterName?: string;
}

interface ExtendedWebSocket extends WebSocket {
  pingInterval?: NodeJS.Timeout;
}

export const useChatUsers = (locationId: string) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const wsRef = useRef<ExtendedWebSocket | null>(null);
  const mountedRef = useRef(true);

  const refreshUsers = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setRefreshing(true);
      console.log('🔄 Manual refresh requested');
      
      // Send refresh character request first
      wsRef.current.send(JSON.stringify({ type: 'refreshCharacter' }));
      
      // Then request user list with delays
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'getOnlineUsers' }));
          console.log('🔄 Manual refresh - requested user list (1st)');
        }
      }, 300);
      
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'getOnlineUsers' }));
          console.log('🔄 Manual refresh - requested user list (2nd)');
        }
      }, 1500);
      
      // Reset refreshing state after a delay
      setTimeout(() => {
        if (mountedRef.current) {
          setRefreshing(false);
        }
      }, 3000);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Helper function to filter users by location
  const filterUsersByLocation = async (allUsers: { 
    location: string; 
    userId?: string; 
    id?: string; 
    username: string; 
    characterName?: string;
  }[], expectedLocationId: string) => {
    let expectedLocation = `Chat ${expectedLocationId}`;
    try {
      const response = await fetch('http://localhost:5001/api/maps/main', {
        credentials: 'include'
      });
      const mapData = await response.json();
      const location = mapData.locations?.find((loc: { id: number; name: string }) => 
        loc.id === parseInt(expectedLocationId)
      );
      if (location) {
        expectedLocation = `Chat: ${location.name}`;
      }
    } catch (error) {
      console.log('Could not fetch location for filtering:', error);
    }
    
    console.log('🔍 Filtering users for location:', expectedLocation);
    console.log('👥 All users received:', allUsers);
    
    const locationUsers = allUsers
      .filter((user: { 
        location: string; 
        userId?: string; 
        id?: string; 
        username: string; 
        characterName?: string;
      }) => {
        const isMatch = user.location === expectedLocation || user.location === `Chat ${expectedLocationId}`;
        if (isMatch) {
          console.log('✅ Found matching user:', user.username, 'in location:', user.location);
        } else {
          console.log('❌ User not in location:', user.username, 'is in:', user.location);
        }
        return isMatch;
      })
      .map((user: { 
        location: string; 
        userId?: string; 
        id?: string; 
        username: string; 
        characterName?: string;
      }) => ({
        userId: user.userId || user.id || user.username,
        username: user.username,
        characterName: user.characterName || user.username
      }))
      // Remove duplicates based on username (more reliable than userId)
      .filter((user: ChatUser, index: number, array: ChatUser[]) => 
        array.findIndex((u: ChatUser) => u.username === user.username) === index
      );
    
    console.log('✨ Final filtered location users:', locationUsers);
    return locationUsers;
  };

  // Effect to manage WebSocket connection (runs when currentUser changes)
  useEffect(() => {
    if (!currentUser || !mountedRef.current) return;

    console.log(`🔌 Setting up presence WebSocket for user: ${currentUser.id}`);
    
    const connectWebSocket = () => {
      const wsUrl = `ws://localhost:5001/ws/presence?userId=${currentUser.id}&username=${encodeURIComponent(currentUser.username)}`;
      const ws = new WebSocket(wsUrl) as ExtendedWebSocket;

      ws.onopen = () => {
        console.log(`✅ Presence WebSocket connected for user ${currentUser.id}`);
        wsRef.current = ws;
        
        // Send initial location update after connection is confirmed
        if (locationId && mountedRef.current) {
          setTimeout(() => {
            console.log(`📍 Sending initial location update for ${locationId} after connection`);
            sendLocationUpdate(locationId);
          }, 200);
        }
        
        // Set up periodic ping to maintain connection and get updates
        const pingInterval = setInterval(() => {
          if (mountedRef.current && wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
        
        // Store interval for cleanup
        ws.pingInterval = pingInterval;
      };

      ws.onmessage = async (event) => {
        if (!mountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          console.log(`📨 Received presence message: ${data.type}`, data);
          
          if (data.type === 'onlineUsers' && Array.isArray(data.users)) {
            const filteredUsers = await filterUsersByLocation(data.users, locationId);
            setUsers(filteredUsers);
            setLoading(false);
            setRefreshing(false); // Reset refreshing state when we get new data
          } else if (data.type === 'pong') {
            console.log('🏓 Received pong from presence server');
          }
        } catch (error) {
          console.error('Error parsing presence message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log(`❌ Presence WebSocket closed for user ${currentUser.id}:`, event.code, event.reason);
        
        // Clear ping interval
        if (ws.pingInterval) {
          clearInterval(ws.pingInterval);
        }
        
        wsRef.current = null;
        
        // Reconnect if the component is still mounted and close wasn't intentional
        if (mountedRef.current && event.code !== 1000) {
          console.log('🔄 Attempting to reconnect presence WebSocket...');
          setTimeout(() => {
            if (mountedRef.current) {
              connectWebSocket();
            }
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error(`💥 Presence WebSocket error for user ${currentUser.id}:`, error);
      };
      
      // Set loading to false after timeout even if no data received
      setTimeout(() => {
        if (mountedRef.current) {
          setLoading(false);
        }
      }, 3000);
    };

    connectWebSocket();

    return () => {
      console.log(`🧹 Cleaning up presence WebSocket for user ${currentUser.id}`);
      if (wsRef.current) {
        // Clear ping interval
        if (wsRef.current.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [currentUser]);

  // Helper function to send location updates
  const sendLocationUpdate = async (locId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('⚠️ Cannot send location update - WebSocket not ready');
      return;
    }

    try {
      console.log(`🎯 Sending location update for locationId: ${locId}`);
      
      // Get location name
      const response = await fetch('http://localhost:5001/api/maps/main', {
        credentials: 'include'
      });
      const data = await response.json();
      const location = data.locations?.find((loc: { id: number; name: string }) => 
        loc.id === parseInt(locId)
      );
      const chatLocation = location ? `Chat: ${location.name}` : `Chat ${locId}`;
      
      console.log(`📍 Updating presence location to: ${chatLocation}`);
      
      // Send location update
      wsRef.current.send(JSON.stringify({ type: 'updateLocation', location: chatLocation }));
      
      // Force character refresh to ensure character data is current
      wsRef.current.send(JSON.stringify({ type: 'refreshCharacter' }));
      
      // Request fresh user list with staggered requests
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'getOnlineUsers' }));
          console.log('🔄 Requested fresh user list (1st)');
        }
      }, 500);
      
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'getOnlineUsers' }));
          console.log('🔄 Requested fresh user list (2nd)');
        }
      }, 2000);
      
    } catch (error) {
      console.log('Could not fetch location name, using fallback:', error);
      const fallbackLocation = `Chat ${locId}`;
      
      console.log(`📍 Sending fallback location update: ${fallbackLocation}`);
      wsRef.current.send(JSON.stringify({ type: 'updateLocation', location: fallbackLocation }));
      wsRef.current.send(JSON.stringify({ type: 'refreshCharacter' }));
      
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'getOnlineUsers' }));
        }
      }, 500);
    }
  };

  // Separate effect to handle location changes without recreating the connection
  useEffect(() => {
    if (!locationId || !currentUser || !mountedRef.current) return;

    console.log(`🗺️ Location changed to: ${locationId}, WebSocket ready: ${wsRef.current?.readyState === WebSocket.OPEN}`);
    
    // If WebSocket is ready, send update immediately
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendLocationUpdate(locationId);
    } else {
      // If WebSocket not ready, wait and retry
      console.log('⏳ WebSocket not ready for location update, waiting...');
      
      const waitForConnection = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN && mountedRef.current) {
          sendLocationUpdate(locationId);
        } else if (mountedRef.current) {
          console.log('⏳ Still waiting for WebSocket connection...');
          setTimeout(waitForConnection, 500);
        }
      };
      
      setTimeout(waitForConnection, 500);
    }
  }, [locationId, currentUser]);

  return { users, loading, refreshing, refreshUsers };
}; 