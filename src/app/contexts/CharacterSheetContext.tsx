'use client';

import React, { createContext, useContext, useState } from 'react';

interface CharacterSheetContextType {
  isOpen: boolean;
  openCharacterSheet: () => void;
  closeCharacterSheet: () => void;
}

const CharacterSheetContext = createContext<CharacterSheetContextType | undefined>(undefined);

export const CharacterSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openCharacterSheet = () => setIsOpen(true);
  const closeCharacterSheet = () => setIsOpen(false);

  return (
    <CharacterSheetContext.Provider value={{ isOpen, openCharacterSheet, closeCharacterSheet }}>
      {children}
    </CharacterSheetContext.Provider>
  );
};

export const useCharacterSheet = () => {
  const context = useContext(CharacterSheetContext);
  if (!context) {
    throw new Error('useCharacterSheet must be used within CharacterSheetProvider');
  }
  return context;
};
