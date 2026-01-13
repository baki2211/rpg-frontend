'use client';

import React from 'react';
import { AppProviders } from './contexts/AppProviders';
import NavMenu from "./components/common/Nav"
import ServerStatusNotification from './components/ServerStatusNotification';
import GlobalCharacterSheet from './components/common/GlobalCharacterSheet';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <html lang="en">
        <body>
          <NavMenu />
          <ServerStatusNotification />
          {children}
          <GlobalCharacterSheet />
        </body>
      </html>
    </AppProviders>
  );
}
