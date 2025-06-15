'use client';

import React from 'react';
import { usePresence } from '../contexts/PresenceContext';
import './PresenceIndicator.css';

const PresenceIndicator: React.FC = () => {
  const { onlineUsers, connectionStatus, isPresenceEnabled } = usePresence();

  if (!isPresenceEnabled) {
    return (
      <div className="presence-indicator disabled">
        <span className="presence-icon">👥</span>
        <span className="presence-text">Presence offline</span>
      </div>
    );
  }

  if (connectionStatus !== 'connected') {
    return (
      <div className="presence-indicator connecting">
        <span className="presence-icon">🔄</span>
        <span className="presence-text">Connecting...</span>
      </div>
    );
  }

  return (
    <div className="presence-indicator connected">
      <span className="presence-icon">👥</span>
      <span className="presence-text">
        {onlineUsers.length} online
      </span>
      {onlineUsers.length > 0 && (
        <div className="online-users-tooltip">
          {onlineUsers.map((user, index) => (
            <div key={index} className="online-user">
              <strong>{user.username}</strong>
              {user.characterName && <span> ({user.characterName})</span>}
              <span className="user-location"> - {user.location}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PresenceIndicator; 