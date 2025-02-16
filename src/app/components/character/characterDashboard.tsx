'use client';

import React, { useState } from 'react';
import CharacterCreationModalPanel from './characterCreationModal';
import { useCharacters } from '../../hooks/useCharacter';

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
            <div key={character.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
              <img 
                src={character.imageUrl || '/placeholder.jpg'} 
                alt={character.imageUrl } 
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <h3>{character.name}</h3>
              <p><strong>Race:</strong> {character.race.name}</p>
              <p><strong>Gender:</strong> {character.gender}</p>
              <p><strong>Active:</strong> {character.isActive ? 'Yes' : 'No'}</p>
              <div>
              <button
          onClick={() => activateCharacter(character.id)}
          disabled={character.isActive}
        >
          {character.isActive ? 'Active' : 'Activate'}
        </button>
        <button onClick={() => deleteCharacter(character.id)}>Delete</button>
              </div>
            </div>
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