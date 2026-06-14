import React from 'react';

interface CharacterOption {
  characterId: string;
  characterName: string;
}

interface CharacterSelectProps {
  characters: readonly CharacterOption[];
  value: string;
  onChange: (characterId: string) => void;
  label?: string;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  characters,
  value,
  onChange,
  label = 'Target Character:',
}) => (
  <div className="control-group">
    <label>{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select character...</option>
      {characters.map((character) => (
        <option key={character.characterId} value={character.characterId}>
          {character.characterName}
        </option>
      ))}
    </select>
  </div>
);
