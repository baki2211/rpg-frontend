'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '../utils/AuthContext';
import { ToastProvider } from './ToastContext';
import { UserProvider } from './UserContext';
import { CharacterProvider } from './CharacterContext';
import { CharacterSheetProvider } from './CharacterSheetContext';
import { PresenceProvider } from './PresenceContext';
import { CombatConstantsProvider } from './CombatConstantsContext';
import { MasteryTiersProvider } from './MasteryTiersContext';
import { SkillValidationProvider } from './SkillValidationContext';
import { NPCProvider } from './NPCContext';
import { RacesProvider } from './RacesContext';
import { StatDefinitionsProvider } from './StatDefinitionsContext';
import { SkillsProvider } from './SkillsContext';
import { CombatRoundsProvider } from './CombatRoundsContext';
import { EventsProvider } from './EventsContext';
import { EngineLogsProvider } from './EngineLogsContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <UserProvider>
          <CharacterProvider>
            <CharacterSheetProvider>
              <PresenceProvider>
                <NPCProvider>
                  <RacesProvider>
                    <StatDefinitionsProvider>
                      <SkillsProvider>
                        <CombatRoundsProvider>
                          <EventsProvider>
                            <EngineLogsProvider>
                              <CombatConstantsProvider>
                                <MasteryTiersProvider>
                                  <SkillValidationProvider>
                                    {children}
                                  </SkillValidationProvider>
                                </MasteryTiersProvider>
                              </CombatConstantsProvider>
                            </EngineLogsProvider>
                          </EventsProvider>
                        </CombatRoundsProvider>
                      </SkillsProvider>
                    </StatDefinitionsProvider>
                  </RacesProvider>
                </NPCProvider>
              </PresenceProvider>
            </CharacterSheetProvider>
          </CharacterProvider>
        </UserProvider>
      </AuthProvider>
    </ToastProvider>
  );
};
