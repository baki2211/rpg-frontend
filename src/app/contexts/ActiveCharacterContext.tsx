'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useCharacters, useActiveNPC } from '@/app/hooks/queries/useCharacters';
import { Character } from '@/types/character';

interface ActiveCharacterContextType {
  activeCharacterId: number | null;
  setActiveCharacterId: (id: number | null) => void;
}

const ActiveCharacterContext = createContext<ActiveCharacterContextType | undefined>(undefined);

export const ActiveCharacterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCharacterId, setActiveCharacterId] = useState<number | null>(null);
  const value = useMemo(
    () => ({ activeCharacterId, setActiveCharacterId }),
    [activeCharacterId],
  );
  return (
    <ActiveCharacterContext.Provider value={value}>
      {children}
    </ActiveCharacterContext.Provider>
  );
};

export const useActiveCharacterSelection = (): ActiveCharacterContextType => {
  const ctx = useContext(ActiveCharacterContext);
  if (!ctx) {
    throw new Error('useActiveCharacterSelection must be used within ActiveCharacterProvider');
  }
  return ctx;
};

// Returns the currently focused character. If the provider holds an explicit
// selection, that wins; otherwise we fall back to whichever character/NPC the
// backend has marked `isActive` (legacy CharacterContext behavior).
export function useActiveCharacter(): Character | null {
  const { activeCharacterId } = useActiveCharacterSelection();
  const { data: characters = [] } = useCharacters();
  const { data: activeNPC = null } = useActiveNPC();

  return useMemo(() => {
    const all: Character[] = activeNPC ? [...characters, activeNPC] : characters;
    if (activeCharacterId != null) {
      return all.find((c) => c.id === activeCharacterId) ?? null;
    }
    return all.find((c) => c.isActive) ?? null;
  }, [characters, activeNPC, activeCharacterId]);
}
