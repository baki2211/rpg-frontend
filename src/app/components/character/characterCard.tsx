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
    <div className="character-card">
      <Image 
        src={`http://localhost:5001${character.imageUrl ?? '/uploads/placeholder.jpg'}`} 
        alt={'Character Image'} 
        width={150}
        height={150}
        style={{ objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem', border: '2px solid rgba(255, 255, 255, 0.2)' }}
      />
      <h3>{character.name} {character.surname}</h3>
      <p><strong>Race:</strong> {character.race.name}</p>
      <p><strong>Gender:</strong> {character.gender}</p>
      <p>
        <strong>Status:</strong> 
        <span style={{ 
          marginLeft: '0.5rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: '600',
          backgroundColor: character.isActive ? '#4ecdc4' : 'rgba(255, 255, 255, 0.2)',
          color: 'white'
        }}>
          {character.isActive ? '✓ Active' : 'Inactive'}
        </span>
      </p>
      {isCharacterPanel && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => onActivate(character.id, character.userId)}
            disabled={character.isActive}
            className={character.isActive ? 'btn btn-secondary' : 'btn btn-success'}
          >
            {character.isActive ? '🏛️ Active' : '⚡ Activate'}
          </button>
          <button 
            onClick={async () => {
              const confirmed = window.confirm(`Are you sure you want to delete ${character.name} ${character.surname}? This action cannot be undone.`);
              if (confirmed) {
                try {
                  await onDelete(character.id);
                } catch (error) {
                  console.error('Delete failed:', error);
                }
              }
            }}
            className="btn btn-danger"
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default CharacterCard;
