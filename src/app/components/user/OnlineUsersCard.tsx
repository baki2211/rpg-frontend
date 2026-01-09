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
    <div className={`user-card-container ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="user-card-avatar-user">
        <span className="user-card-avatar-text">
          {username}
        </span>
      </div>
      <div>
        <div className={`user-card-username-text ${isCurrentUser ? 'current-user' : ''}`}>
          {username}{isCurrentUser && ' (You)'}
        </div>
        <div className="user-card-location-text">
          {location}
        </div>
      </div>
    </div>
  );
};

export default UserCard;