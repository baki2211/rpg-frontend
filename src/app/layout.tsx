'use client';

import React from 'react';
import { AuthProvider } from "./utils/AuthContext";
import NavMenu from "./components/common/nav";
import { PresenceProvider } from './contexts/PresenceContext';
import { ToastProvider } from './contexts/ToastContext';
import { CharacterSheetProvider } from './contexts/CharacterSheetContext';
import ServerStatusNotification from './components/ServerStatusNotification';
import GlobalCharacterSheet from './components/common/GlobalCharacterSheet';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PresenceProvider>
        <ToastProvider>
          <CharacterSheetProvider>
            <html lang="en">
              <body>
                <NavMenu />
                <ServerStatusNotification />
                {children}
                <GlobalCharacterSheet />
              </body>
            </html>
          </CharacterSheetProvider>
        </ToastProvider>
      </PresenceProvider>
    </AuthProvider>
  );
}
