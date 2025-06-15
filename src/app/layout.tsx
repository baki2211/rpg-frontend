'use client';

import React from 'react';
import { AuthProvider } from "./utils/AuthContext";
import NavMenu from "./components/common/nav";
import { PresenceProvider } from './contexts/PresenceContext';
import { ToastProvider } from './contexts/ToastContext';
import ServerStatusNotification from './components/ServerStatusNotification';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PresenceProvider>
        <ToastProvider>
          <html lang="en">
            <body>
              <NavMenu />
              <ServerStatusNotification />
              {children}
            </body>
          </html>
        </ToastProvider>
      </PresenceProvider>
    </AuthProvider>
  );
}
