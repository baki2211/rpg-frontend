import React, { useState } from 'react';
import Image from 'next/image';
import { UPLOADS_URL } from '../../../config/api';

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
  isNPC?: boolean;
}

interface CharacterCardProps {
  character: Character;
  isCharacterPanel: boolean;
  onActivate: (characterId: number) => Promise<void>;
  onDelete: (characterId: number) => Promise<void>;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  isCharacterPanel,
  onActivate,
  onDelete
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Construct the image URL with fallback
  const getImageUrl = () => {
    if (imageError) {
      return `${UPLOADS_URL}/placeholder.jpg`;
    }
    
    if (character.imageUrl) {
      // If imageUrl already starts with http, use it as is
      if (character.imageUrl.startsWith('http')) {
        return character.imageUrl;
      }
      // If imageUrl already includes /uploads/, use it as is
      if (character.imageUrl.startsWith('/uploads/')) {
        return `${UPLOADS_URL}${character.imageUrl}`;
      }
      // Otherwise, prepend /uploads/
      return `${UPLOADS_URL}/uploads/${character.imageUrl}`;
    }
    
    // Default fallback
    return `${UPLOADS_URL}/placeholder.jpg`;
  };

  return (
    <div className="character-card">
      <Image 
        src={getImageUrl()}
        alt={`${character.name} ${character.surname}`} 
        width={150}
        height={150}
        style={{ objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem', border: '2px solid rgba(255, 255, 255, 0.2)' }}
        onError={() => setImageError(true)}
      />
      <h3>
        {character.name} {character.surname}
        {character.isNPC && (
          <span style={{ 
            marginLeft: '0.5rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: '600',
            backgroundColor: '#fbbf24',
            color: 'white'
          }}>
            NPC
          </span>
        )}
      </h3>
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
            onClick={() => onActivate(character.id)}
            disabled={character.isActive}
            className={character.isActive ? 'btn btn-secondary' : 'btn btn-success'}
          >
            {character.isActive ? '🏛️ Active' : '⚡ Activate'}
          </button>
          {!character.isNPC && (
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
              disabled={character.isActive}
              className={character.isActive ? 'btn btn-secondary' : 'btn btn-danger'}
              title={character.isActive ? 'Cannot delete active character' : 'Delete character'}
            >
              🗑️ Delete
            </button>
          )}
          {character.isNPC && (
            <div style={{ 
              padding: '0.5rem', 
              fontSize: '0.8rem', 
              color: 'rgba(255, 255, 255, 0.7)',
              fontStyle: 'italic'
            }}>
              NPC - Managed by admins
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterCard;
