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
                <CombatConstantsProvider>
                  <MasteryTiersProvider>
                    <SkillValidationProvider>
                      {children}
                    </SkillValidationProvider>
                  </MasteryTiersProvider>
                </CombatConstantsProvider>
              </PresenceProvider>
            </CharacterSheetProvider>
          </CharacterProvider>
        </UserProvider>
      </AuthProvider>
    </ToastProvider>
  );
};
