'use client';

import React, { useState } from 'react';
import CharacterCreationModalPanel from './characterCreationModal';
import { useCharacters } from '../../hooks/useCharacter';
import CharacterCard from './characterCard';
import Modal from '../common/Modal';

const CharactersDashboard = () => {
  const { characters, loading, error, activateCharacter, deleteCharacter, createCharacter } = useCharacters();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading characters...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="page-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Your Characters</h2>
        <p>Create and manage your adventurers for the RPG world</p>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          ✨ Create New Character
        </button>
      </div>

      {characters.length > 0 ? (
        <div className="character-grid">
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
        <div className="card" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ color: 'white', marginBottom: '1rem' }}>No Characters Found</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1.5rem' }}>
            Start your adventure by creating your first character! Choose from different races, 
            customize their stats, and begin exploring the mystical realms.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            🏛️ Create Your First Character
          </button>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Create New Character"
      >
        <CharacterCreationModalPanel 
          onSuccess={() => setIsModalOpen(false)} 
          createCharacter={createCharacter}
        />
      </Modal>
    </div>
  );
};

export default CharactersDashboard;
