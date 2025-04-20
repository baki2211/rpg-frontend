// components/OnlineUsers.tsx
'use client';

import React from 'react';
import useOnlineUsers from '../../hooks/useOnlineUsers';
import UserCard from './OnlineUsersCard';

interface OnlineUsersProps {
  websocket: WebSocket | null;
  currentUsername: string;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ websocket, currentUsername }) => {
  const { onlineUsers, loading } = useOnlineUsers(websocket, currentUsername);

  return (
    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <h3 style={{ 
        padding: '0.75rem', 
        backgroundColor: '#4e73df', 
        color: 'white',
        borderRadius: '8px 8px 0 0',
        marginBottom: '0'
      }}>
        Online Users ({onlineUsers.length})
      </h3>
      <div style={{ 
        border: '1px solid #e3e6f0',
        borderRadius: '0 0 8px 8px',
        padding: '0.5rem'
      }}>
        {loading ? (
          <div style={{ padding: '1rem', textAlign: 'center' }}>Loading users...</div>
        ) : onlineUsers.length > 0 ? (
          onlineUsers.map((user) => (
            <UserCard
              key={user.username}
              username={user.username}
              location={user.location}
              isCurrentUser={user.username === currentUsername}
            />
          ))
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center' }}>No users online</div>
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;