import React from 'react';
import Image from 'next/image';

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
  onActivate: (characterId: number, userId: number) => Promise<void>;
  onDelete: (characterId: number) => Promise<void>;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  isCharacterPanel,
  onActivate,
  onDelete
}) => {  
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', maxWidth: '300px', backgroundColor: '#f9f9f9', margin: '1rem' }}>
      <Image 
        src={`http://localhost:5001${character.imageUrl ?? '/uploads/placeholder.jpg'}`} 
        alt={'Character Image'} 
        width={150}
        height={150}
        style={{ objectFit: 'cover', borderRadius: '4px' }}
      />
      <h3>{character.name} {character.surname}</h3>
      <p><strong>Race:</strong> {character.race.name}</p>
      <p><strong>Gender:</strong> {character.gender}</p>
      <p><strong>Active:</strong> {character.isActive ? 'Yes' : 'No'}</p>
      {isCharacterPanel && (
        <div>
          <button 
            onClick={() => onActivate(character.id, character.userId)}
            disabled={character.isActive}
            >
          {character.isActive ? 'Active' : 'Activate'}
          </button>
          <button onClick={() => onDelete(character.id)}>Delete</button>
        </div>
      )}
    </div>
  );
};

export default CharacterCard;
