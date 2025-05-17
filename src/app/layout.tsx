'use client';

import React from 'react';
import { AuthProvider } from "./utils/AuthContext";
import NavMenu from "./components/nav";
import { PresenceProvider } from './contexts/PresenceContext';

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
