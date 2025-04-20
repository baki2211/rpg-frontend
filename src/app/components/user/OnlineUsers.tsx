'use client';

import React from 'react';
import UserCard from './OnlineUsersCard';

interface OnlineUser {
  username: string;
  location: string;
}

interface OnlineUsersProps {
  onlineUsers: OnlineUser[];
  currentUsername?: string;
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({ onlineUsers, currentUsername }) => {
  return (
    <>
    <h3>Online Users ({onlineUsers.length})</h3>
    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <div style={{
        border: '1px solid #e3e6f0',
        borderRadius: '0 0 8px 8px',
        padding: '0.5rem'
      }}>
        {onlineUsers.length > 0 ? (
          onlineUsers.map((user) => (
            <UserCard
              key={user.username}
              username={user.username}
              location={user.location}
              isCurrentUser={user.username === currentUsername} />
          ))
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center' }}>No users online</div>
        )}
      </div>
    </div></>
  );
};

export default OnlineUsers;
