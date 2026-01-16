'use client';

import React, { useState } from 'react';
import CharacterCreationModalPanel from '../../components/character/CreationModal/CharacterCreationModal';
import { useCharacter } from '../../contexts/CharacterContext';
import CharacterCard from '../../components/character/Card/CharacterCard';
import Modal from '../../components/common/Modal';
import './CharactersDashboard.css';

const CharactersDashboard = () => {
  const { allCharacters, activeCharacter, loading, error, activateCharacter, deleteCharacter, createCharacter } = useCharacter();
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

        {!activeCharacter && allCharacters.length > 0 && (
          <div className="card no-active-character-warning">
            <div className="warning-icon">⚠️</div>
            <h4 className="warning-title">No Active Character</h4>
            <p className="warning-message">
              Click on a character card below to activate one and start your adventure!
            </p>
          </div>
        )}

        {activeCharacter && (
          <div className="active-character-banner">
            <strong className="active-character-name">Currently Active:</strong> {activeCharacter.name} {activeCharacter.surname}
            {activeCharacter.isNPC && <span className="npc-badge">(NPC)</span>}
          </div>
        )}

        {allCharacters.length > 0 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            Create New Character
          </button>
        )}
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
        <div className="card empty-state-card">
          <h3>No Characters Found</h3>
          <p>
            Start your adventure by creating your first character! Choose from different races,
            customize their stats, and begin exploring the mystical realms.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            Create Your First Character
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
          createCharacter={async (formData) => {
            await createCharacter(formData);
          }}
        />
      </Modal>
    </div>
  );
};

export default CharactersDashboard;
