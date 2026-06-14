'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { QueryProvider } from './QueryProvider';
import { ActiveCharacterProvider } from './ActiveCharacterContext';
import { CharacterSheetProvider } from './CharacterSheetContext';
import { PresenceProvider } from './PresenceContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ToastProvider>
      <QueryProvider>
        <AuthProvider>
          <ActiveCharacterProvider>
            <CharacterSheetProvider>
              <PresenceProvider>
                {children}
              </PresenceProvider>
            </CharacterSheetProvider>
          </ActiveCharacterProvider>
        </AuthProvider>
      </QueryProvider>
    </ToastProvider>
  );
};
