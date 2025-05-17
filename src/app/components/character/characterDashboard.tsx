'use client';

import React, { useState } from 'react';
import CharacterCreationModalPanel from './characterCreationModal';
import { useCharacters } from '../../hooks/useCharacter';
import CharacterCard from './characterCard';

const CharactersDashboard = () => {
  const { characters, loading, error, activateCharacter, deleteCharacter } = useCharacters();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) return <p>Loading characters...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Your Characters</h2>
      <button onClick={() => setIsModalOpen(true)}>Create New</button>
      {characters.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {characters.map((character) => (
            <CharacterCard 
              key={character.id} 
              character={character} 
              isCharacterPanel={true}
              onActivate={activateCharacter}
              onDelete={deleteCharacter}
            />
          ))}
        </div>
      ) : (
        <p>No characters found.</p>
      )}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <CharacterCreationModalPanel />
            <button onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharactersDashboard;
