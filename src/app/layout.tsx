import React from 'react';
import { AppProviders } from './contexts/AppProviders';
import NavMenu from './components/common/Nav'
import ServerStatusNotification from './components/ServerStatusNotification';
import GlobalCharacterSheet from './components/common/GlobalCharacterSheet';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <NavMenu />
          <ServerStatusNotification />
          {children}
          <GlobalCharacterSheet />
        </AppProviders>
      </body>
    </html>
  );
}
