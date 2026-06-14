'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { QueryProvider } from './QueryProvider';
import { CharacterProvider } from './CharacterContext';
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
          <CharacterProvider>
            <CharacterSheetProvider>
              <PresenceProvider>
                {children}
              </PresenceProvider>
            </CharacterSheetProvider>
          </CharacterProvider>
        </AuthProvider>
      </QueryProvider>
    </ToastProvider>
  );
};
