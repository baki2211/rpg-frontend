'use client';

import React from 'react';
import { useCharacterSheet } from '../../contexts/CharacterSheetContext';
import { useCharacters } from '../../hooks/useCharacter';
import CharacterSheetModal from '../character/CharacterSheetModal';

const GlobalCharacterSheet: React.FC = () => {
  const { isOpen, closeCharacterSheet } = useCharacterSheet();
  const { activeCharacter } = useCharacters();

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
