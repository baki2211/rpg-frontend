'use client';

import React from 'react';
import { useCharacterSheet } from '@/app/contexts/CharacterSheetContext';
import { useActiveCharacter } from '@/app/contexts/ActiveCharacterContext';
import CharacterSheetModal from '@/app/components/character/Sheet/CharacterSheetModal';

const GlobalCharacterSheet: React.FC = () => {
  const { isOpen, closeCharacterSheet } = useCharacterSheet();
  const activeCharacter = useActiveCharacter();

  if (!activeCharacter) {
    return null;
  }

  return (
    <CharacterSheetModal
      character={activeCharacter}
      isOpen={isOpen}
      onClose={closeCharacterSheet}
    />
  );
};

export default GlobalCharacterSheet;
