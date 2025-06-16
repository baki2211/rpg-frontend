import { useEffect, useState, useRef } from 'react';
import { usePresence } from '../contexts/PresenceContext';
import type { PresenceUser } from '../contexts/PresenceContext';

type ChatUser = PresenceUser;

export const useChatUsers = (locationId: string | null) => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const { onlineUsers, connectionStatus } = usePresence();

  // Filter users by location whenever onlineUsers changes
  useEffect(() => {
    if (!mountedRef.current || !locationId) return;

    const filterUsersByLocation = (users: PresenceUser[]) => {
      try {
        // Filter users that are in this location
        const filteredUsers = users.filter(user => user.location === locationId);
        setUsers(filteredUsers);
        setLoading(false);
        setRefreshing(false);
      } catch (error) {
        console.error('Error filtering users by location:', error);
        setLoading(false);
        setRefreshing(false);
      }
    };

    filterUsersByLocation(onlineUsers);
  }, [onlineUsers, locationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshUsers = async () => {
    if (!mountedRef.current || !locationId) return;
    
    setRefreshing(true);
    try {
      // Use the presence context's online users
      const filteredUsers = onlineUsers.filter(user => user.location === locationId);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error refreshing users:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return {
    users,
    loading,
    refreshing,
    refreshUsers,
    connectionStatus
  };
}; 