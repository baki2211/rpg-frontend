// components/OnlineUsersCard.tsx
'use client';

import React from 'react';

interface UserCardProps {
  username: string;
  isCurrentUser?: boolean;
  location?: string;
}

const UserCard: React.FC<UserCardProps> = ({ username, isCurrentUser = false, location = 'Online' }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem',
      marginBottom: '0.5rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      borderLeft: isCurrentUser ? '4px solid #4e73df' : '4px solid transparent'
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
          {username}
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

export default UserCard;