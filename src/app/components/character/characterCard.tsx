import React from 'react';
import { useCharacters } from '../../hooks/useCharacter';

interface Character {
  id: number;
  userId: number;
  name: string;
  surname: string;
  age: number;
  gender: string;
  race: {
    name: string;
  };
  isActive: boolean;
  imageUrl?: string;
}

interface CharacterCardProps {
  character: Character;
  isCharacterPanel: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, isCharacterPanel}) => {  
  const { activateCharacter, deleteCharacter } = useCharacters();
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
      <img 
        src={character.imageUrl || '/placeholder.jpg'} 
        alt={character.imageUrl || 'Character Placeholder Image'} 
        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
      />
      <h3>{character.name} {character.surname}</h3>
      <p><strong>Race:</strong> {character.race.name}</p>
      <p><strong>Gender:</strong> {character.gender}</p>
      <p><strong>Active:</strong> {character.isActive ? 'Yes' : 'No'}</p>
      {isCharacterPanel && (
        <div>
          <button 
            onClick={() => activateCharacter(character.id, character.userId)}
            disabled={character.isActive}
            >
          {character.isActive ? 'Active' : 'Activate'}
          </button>
          <button onClick={() => deleteCharacter(character.id, character.userId) }>Delete</button>
        </div>
      )}
    </div>
  );
};

export default CharacterCard;
