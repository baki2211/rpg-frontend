'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ToastProvider } from './ToastContext';
import { QueryProvider } from './QueryProvider';
import { UserProvider } from './UserContext';
import { CharacterProvider } from './CharacterContext';
import { CharacterSheetProvider } from './CharacterSheetContext';
import { PresenceProvider } from './PresenceContext';
import { CombatConstantsProvider } from './CombatConstantsContext';
import { MasteryTiersProvider } from './MasteryTiersContext';
import { SkillValidationProvider } from './SkillValidationContext';
import { NPCProvider } from './NPCContext';
import { SkillsProvider } from './SkillsContext';
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
                    <SkillsProvider>
                      <CombatRoundsProvider>
                        <EventsProvider>
                            <CombatConstantsProvider>
                              <MasteryTiersProvider>
                                <SkillValidationProvider>
                                  {children}
                                </SkillValidationProvider>
                              </MasteryTiersProvider>
                            </CombatConstantsProvider>
                        </EventsProvider>
                      </CombatRoundsProvider>
                    </SkillsProvider>
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
