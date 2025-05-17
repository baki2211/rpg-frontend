import React from 'react';
import { usePresence } from '../../contexts/PresenceContext';

interface UserCardProps {
  username: string;
  location: string;
  isCurrentUser: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ username, location, isCurrentUser }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem',
      marginBottom: '0.5rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      borderLeft: isCurrentUser ? '4px solid rgb(0, 0, 1)' : '4px solid transparent'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#ddd',
        marginRight: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <span style={{ fontSize: '18px', color: '#666' }}>
          {username.charAt(0).toUpperCase()}
        </span>
      </div>
      <div>
        <div style={{ fontWeight: isCurrentUser ? '600' : '500' }}>
          {username}{isCurrentUser && ' (You)'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
          {location}
        </div>
      </div>
    </div>
  );
};

const OnlineUsers: React.FC = () => {
  const { onlineUsers, currentUser } = usePresence();

  return (
    <div>
      <h3>Online Users ({onlineUsers.length})</h3>
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <div style={{
          border: '1px solid #e3e6f0',
          borderRadius: '0 0 8px 8px',
          padding: '0.5rem'
        }}>
          {onlineUsers.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center' }}>No users online</div>
          ) : (
            onlineUsers.map((user) => (
              <UserCard
                key={user.username}
                username={user.username}
                location={user.location}
                isCurrentUser={user.username === currentUser?.username}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineUsers; 