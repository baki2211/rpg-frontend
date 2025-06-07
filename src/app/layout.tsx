'use client';

import React from 'react';
import { AuthProvider } from "./utils/AuthContext";
import NavMenu from "./components/common/nav";
import { PresenceProvider } from './contexts/PresenceContext';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PresenceProvider>
        <html lang="en">
          <body>
            <NavMenu />
            {children}
          </body>
        </html>
      </PresenceProvider>
    </AuthProvider>
  );
}
