import React, { useState } from 'react';
import Image from 'next/image';
import { UPLOADS_URL } from '../../../../config/api';
import CharacterSheetModal from '../Sheet/CharacterSheetModal';
import { Character } from '../../../../types/character';
import './CharacterCard.css';

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Construct the image URL with fallback
  const getImageUrl = () => {
    if (imageError) {
      return `${UPLOADS_URL}/placeholder.jpg`;
    }
    
    if (!character.imageUrl) {
      return `${UPLOADS_URL}/placeholder.jpg`;
    }
    
    // If it's already a full URL, use it as is
    if (character.imageUrl.startsWith('http')) {
      return character.imageUrl;
    }
    
    // If the imageUrl starts with /uploads/, use baseUrl instead of UPLOADS_URL
    if (character.imageUrl.startsWith('/uploads/')) {
      return `${UPLOADS_URL.replace('/uploads', '')}${character.imageUrl}`;
    }
    
    // For all other cases, prepend UPLOADS_URL
    return `${UPLOADS_URL}${character.imageUrl}`;
  };

  return (
    <>
      <div className="character-card" onClick={() => setIsSheetOpen(true)}>
        <Image
          src={getImageUrl()}
          alt={`${character.name} ${character.surname}`}
          width={150}
          height={150}
          className="character-card-image"
          onError={() => setImageError(true)}
        />
        <h3>
          {character.name} {character.surname}
          {character.isNPC && (
            <span className="character-card-npc-badge">
              NPC
            </span>
          )}
        </h3>
        <p><strong>Race:</strong> {character.race.name}</p>
        <p><strong>Gender:</strong> {character.gender}</p>
        <p>
          <strong>Status:</strong>
          <span className={`character-card-status-badge ${character.isActive ? 'active' : 'inactive'}`}>
            {character.isActive ? 'Active' : 'Inactive'}
          </span>
        </p>
        {isCharacterPanel && (
          <div className="character-card-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActivate(character.id);
              }}
              disabled={character.isActive}
              className={character.isActive ? 'btn btn-secondary' : 'btn btn-success'}
            >
              {character.isActive ? 'Active' : 'Activate'}
            </button>
            {!character.isNPC && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
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
                Delete
              </button>
            )}
            {character.isNPC && (
              <div className="character-card-npc-notice">
                NPC - Managed by admins
              </div>
            )}
          </div>
        )}
      </div>

      <CharacterSheetModal
        character={character}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </>
  );
};

export default CharacterCard;
