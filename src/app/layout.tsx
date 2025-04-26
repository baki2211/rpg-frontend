'use client';

import React from 'react';
import { AuthProvider, useAuth } from "./utils/AuthContext";
import { PresenceProvider } from './utils/presenceContext';
import NavMenu from "./components/nav";

const LayoutWithPresence = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>; // No user yet, or loading
  }

  return (
    <PresenceProvider userId={user.id} username={user.username}>
      <NavMenu />
      {children}
    </PresenceProvider>
  );
};

// This is the root layout for the application

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <html lang="en">
        <body>
          <LayoutWithPresence>
            {children}
          </LayoutWithPresence>
        </body>
      </html>
    </AuthProvider>
  );
}
