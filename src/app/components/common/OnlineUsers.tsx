import React from 'react';
import { usePresence } from '../../contexts/PresenceContext';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../config/api';

interface Location {
  id: number;
  name: string;
  description: string;
  xCoordinate: number;
  yCoordinate: number;
}

interface UserCardProps {
  username: string;
  location: string;
  isCurrentUser: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ username, location, isCurrentUser }) => {
  const router = useRouter();

  const handleLocationClick = () => {
    // Extract location ID from the location string (e.g., "Chat: Tavern" -> "1")
    if (location.startsWith('Chat:')) {
      const locationName = location.split('Chat: ')[1];
      // Find the location ID from the map data
      fetch(`${API_URL}/maps/main`, {
        credentials: 'include'
      })
        .then(response => response.json())
        .then(data => {
          const location = data.locations.find((loc: Location) => loc.name === locationName);
          if (location) {
            router.push(`/pages/chat/${location.id}`);
          }
        })
        .catch(error => console.error('Error fetching location:', error));
    } else if (location === 'Map') {
      router.push('/pages/map');
    } else if (location === 'Dashboard') {
      router.push('/pages/dashboard');
    }
  };

  return (
    <div className={`user-card ${isCurrentUser ? 'current-user' : ''}`}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        marginRight: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
        fontSize: '1.1rem'
      }}>
        {username.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: isCurrentUser ? '600' : '500',
          color: 'white',
          marginBottom: '0.25rem'
        }}>
          {username}{isCurrentUser && ' (You)'}
        </div>
        <div 
          style={{ 
            fontSize: '0.75rem', 
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
          onClick={handleLocationClick}
        >
          📍 {location}
        </div>
      </div>
    </div>
  );
};

const OnlineUsers: React.FC = () => {
  const { onlineUsers, currentUser } = usePresence();

  // Create a Map to ensure only one entry per unique user (by userId)
  // This will automatically handle duplicates by keeping the last entry
  const userMap = new Map();
  
  onlineUsers.forEach(user => {
    const key = String(user.userId); // Normalize to string to handle type mismatches
    const existing = userMap.get(key);
    
    // If no existing user or this user has a more recent lastSeen, update the entry
    if (!existing || new Date(user.lastSeen) > new Date(existing.lastSeen)) {
      userMap.set(key, user);
    }
  });
  
  // Convert Map back to array
  const uniqueUsers = Array.from(userMap.values());

  return (
    <div className="online-users">
      <h3>🌐 Online Users ({uniqueUsers.length})</h3>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {uniqueUsers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>No users online</p>
          </div>
        ) : (
          uniqueUsers.map((user, index) => (
            <UserCard
              key={`${user.userId}-${user.username}-${index}`}
              username={user.username}
              location={user.location}
              isCurrentUser={user.username === currentUser?.username}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default OnlineUsers; 