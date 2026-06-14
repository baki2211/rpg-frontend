import { useEffect, useState, useRef } from 'react';
import { usePresence, PresenceUser } from '@/app/contexts/PresenceContext';
import { useLocation } from './useLocations';

// Export ChatUser type as an alias for PresenceUser
export type ChatUser = PresenceUser;

export const useChatUsers = (locationId: string | null) => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const { onlineUsers, connectionStatus } = usePresence();
  const { data: location, isError: locationError } = useLocation(locationId);

  const locationName = locationId
    ? location?.name ?? (locationError ? `Location ${locationId}` : null)
    : null;

  // Filter users by location whenever onlineUsers or locationName changes
  useEffect(() => {
    if (!mountedRef.current || !locationId || !locationName) return;

    const filterUsersByLocation = (users: PresenceUser[]) => {
      try {
        // Filter users that are in this location
        // Match by resolved location name, location ID, or "Location X" format
        const filteredUsers = users.filter(user => {
          return user.location === locationName || // Match by resolved location name
                 user.location === locationId || // Direct ID match
                 user.location === `Location ${locationId}` || // "Location X" format
                 (user.location && user.location.toLowerCase().includes(locationId.toLowerCase())); // Partial match
        });

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
  }, [onlineUsers, locationId, locationName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshUsers = async () => {
    if (!mountedRef.current || !locationId || !locationName) return;

    setRefreshing(true);
    try {
      // Use the presence context's online users with location name matching
      const filteredUsers = onlineUsers.filter(user => {
        return user.location === locationName || // Match by resolved location name
               user.location === locationId || // Direct ID match
               user.location === `Location ${locationId}` || // "Location X" format
               (user.location && user.location.toLowerCase().includes(locationId.toLowerCase())); // Partial match
             });
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
    connectionStatus,
    locationName,
  };
};
