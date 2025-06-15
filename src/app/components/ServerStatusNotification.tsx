'use client';

import React from 'react';
import { usePresence } from '../contexts/PresenceContext';
import './ServerStatusNotification.css';

const ServerStatusNotification: React.FC = () => {
  const { connectionStatus, serverMessage } = usePresence();

  if (!serverMessage || connectionStatus === 'connected') {
    return null;
  }

  const handleRetry = () => {
    window.location.reload();
  };

  const getStatusClass = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'status-connecting';
      case 'error':
        return 'status-error';
      case 'disconnected':
        return 'status-warning';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connecting':
        return '🔄';
      case 'error':
        return '❌';
      case 'disconnected':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`server-status-notification ${getStatusClass()}`}>
      <span className="status-icon">{getStatusIcon()}</span>
      <span className="status-message">{serverMessage}</span>
      {connectionStatus === 'error' && (
        <button 
          onClick={handleRetry}
          className="retry-button"
          title="Refresh page to retry connection"
        >
          🔄 Retry
        </button>
      )}
    </div>
  );
};

export default ServerStatusNotification; 