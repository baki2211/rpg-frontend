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
    <div className="user-online-users-container">
      <div className="user-online-users-border">
        {onlineUsers.length > 0 ? (
          onlineUsers.map((user) => (
            <UserCard
              key={user.username}
              username={user.username}
              location={user.location}
              isCurrentUser={user.username === currentUsername} />
          ))
        ) : (
          <div className="user-no-users-text">No users online</div>
        )}
      </div>
    </div></>
  );
};

export default OnlineUsers;
