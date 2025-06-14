'use client';

import React, { useState } from 'react';
import CharacterCreationModalPanel from './characterCreationModal';
import { useCharacters } from '../../hooks/useCharacter';
import CharacterCard from './characterCard';
import Modal from '../common/Modal';

const CharactersDashboard = () => {
  const { allCharacters, activeCharacter, loading, error, activateCharacter, deleteCharacter, createCharacter } = useCharacters();
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
        {activeCharacter && (
          <div style={{ 
            background: 'rgba(0, 255, 0, 0.1)', 
            border: '1px solid rgba(0, 255, 0, 0.3)', 
            borderRadius: '8px', 
            padding: '0.75rem', 
            marginTop: '0.5rem',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: '#4ade80' }}>Currently Active:</strong> {activeCharacter.name} {activeCharacter.surname}
            {activeCharacter.isNPC && <span style={{ color: '#fbbf24', marginLeft: '0.5rem' }}>(NPC)</span>}
          </div>
        )}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          ✨ Create New Character
        </button>
      </div>

      {allCharacters.length > 0 ? (
        <div className="character-grid">
          {allCharacters.map((character) => (
            <CharacterCard 
              key={`${character.isNPC ? 'npc' : 'char'}-${character.id}`} 
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
