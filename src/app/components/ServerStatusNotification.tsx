'use client';

import React from 'react';
import { usePresence } from '@/app/contexts/PresenceContext';
import Icon from '@/app/components/common/Icon';
import './ServerStatusNotification.css';

const ServerStatusNotification: React.FC = () => {
  const { connectionStatus, serverMessage, resetConnection } = usePresence();

  if (!serverMessage || connectionStatus === 'connected') {
    return null;
  }

  const handleRetry = () => {
    resetConnection();
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
        return 'generic-sync';
      case 'error':
        return 'generic-x-circle';
      case 'disconnected':
        return 'generic-warning';
      default:
        return 'generic-info';
    }
  };

  return (
    <div className={`server-status-notification ${getStatusClass()}`}>
      <span className="status-icon">
        <Icon name={getStatusIcon()} size={16} />
      </span>
      <span className="status-message">{serverMessage}</span>
      {connectionStatus === 'error' && (
        <button
          onClick={handleRetry}
          className="retry-button"
          title="Refresh page to retry connection"
        >
          <Icon name="generic-reload" size={14} /> Retry
        </button>
      )}
    </div>
  );
};

export default ServerStatusNotification; 