'use client';

import React from 'react';
import { useCharacterSheet } from '../../contexts/CharacterSheetContext';
import { useCharacter } from '../../contexts/CharacterContext';
import CharacterSheetModal from '../character/Sheet/CharacterSheetModal';

const GlobalCharacterSheet: React.FC = () => {
  const { isOpen, closeCharacterSheet } = useCharacterSheet();
  const { activeCharacter } = useCharacter();

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
