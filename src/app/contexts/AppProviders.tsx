'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { QueryProvider } from './QueryProvider';
import { UserProvider } from './UserContext';
import { CharacterProvider } from './CharacterContext';
import { CharacterSheetProvider } from './CharacterSheetContext';
import { PresenceProvider } from './PresenceContext';
import { SkillValidationProvider } from './SkillValidationContext';
import { NPCProvider } from './NPCContext';
import { CombatRoundsProvider } from './CombatRoundsContext';
import { EventsProvider } from './EventsContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ToastProvider>
      <QueryProvider>
        <AuthProvider>
          <UserProvider>
            <CharacterProvider>
              <CharacterSheetProvider>
                <PresenceProvider>
                  <NPCProvider>
                    <CombatRoundsProvider>
                      <EventsProvider>
                        <SkillValidationProvider>
                          {children}
                        </SkillValidationProvider>
                      </EventsProvider>
                    </CombatRoundsProvider>
                  </NPCProvider>
                </PresenceProvider>
              </CharacterSheetProvider>
            </CharacterProvider>
          </UserProvider>
        </AuthProvider>
      </QueryProvider>
    </ToastProvider>
  );
};
