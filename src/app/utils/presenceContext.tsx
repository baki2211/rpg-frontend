'use client';

import React, { createContext, useContext, useState } from 'react';
import usePresenceWebSocket from '../hooks/usePresenceWebSocket';

interface PresenceUser {
  username: string;
  location: string;
}

interface PresenceContextValue {
  onlineUsers: PresenceUser[];
}

const PresenceContext = createContext<PresenceContextValue>({ onlineUsers: [] });

export const PresenceProvider = ({ userId, username, children }: { userId: string; username: string; children: React.ReactNode }) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  usePresenceWebSocket(userId, username, setOnlineUsers);

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);
