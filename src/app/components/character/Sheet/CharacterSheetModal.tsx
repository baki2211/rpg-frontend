'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UPLOADS_URL } from '../../../../config/api';
import Modal from '../../common/Modal';
import { Character } from '../../../../types/character';
import './CharacterSheetModal.css';

interface CharacterSheetModalProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'skills' | 'equipment' | 'edit';

const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({ character, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [imageError, setImageError] = useState(false);

  const getImageUrl = () => {
    if (imageError) {
      return `${UPLOADS_URL}/placeholder.jpg`;
    }

    if (!character.imageUrl) {
      return `${UPLOADS_URL}/placeholder.jpg`;
    }

    if (character.imageUrl.startsWith('http')) {
      return character.imageUrl;
    }

    if (character.imageUrl.startsWith('/uploads/')) {
      return `${UPLOADS_URL.replace('/uploads', '')}${character.imageUrl}`;
    }

    return `${UPLOADS_URL}${character.imageUrl}`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="character-sheet-content">
            <div className="character-image-section">
              <Image
                src={getImageUrl()}
                alt={`${character.name} ${character.surname}`}
                width={400}
                height={400}
                onError={() => setImageError(true)}
                className="character-sheet-image"
              />
            </div>
            <div className="character-info-section">
              <div className="stats-section">
                <h3>Stats</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">HP</span>
                    <span className="stat-value">{character.race.baseHp}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Skill Points</span>
                    <span className="stat-value">{character.skillPoints}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Skills Learned</span>
                    <span className="stat-value">{character.skills?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="basic-info-section">
                <h3>Basic Information</h3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Full Name:</span>
                    <span className="info-value">{character.name} {character.surname}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Race:</span>
                    <span className="info-value">{character.race.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Age:</span>
                    <span className="info-value">{character.age}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Gender:</span>
                    <span className="info-value">{character.gender}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className={`status-badge ${character.isActive ? 'active' : 'inactive'}`}>
                      {character.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {character.isNPC && (
                    <div className="info-row">
                      <span className="info-label">Type:</span>
                      <span className="npc-badge">NPC</span>
                    </div>
                  )}
                </div>

                <div className="race-description">
                  <h4>Race Description</h4>
                  <p>{character.race.description}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="skills-tab-content">
            <div className="skills-header">
              <h3>Skills</h3>
              <div className="skill-points-display">
                Available Points: <strong>{character.skillPoints}</strong>
              </div>
            </div>
            {(character.skills?.length || 0) > 0 ? (
              <div className="skills-list">
                {character.skills?.map((skill) => (
                  <div key={skill.id} className="skill-card">
                    <div className="skill-header">
                      <h4>{skill.name}</h4>
                      <div className="skill-badges">
                        <span className="skill-badge type">{skill.type.name}</span>
                        <span className="skill-badge branch">{skill.branch.name}</span>
                        {skill.isPassive && <span className="skill-badge passive">Passive</span>}
                      </div>
                    </div>
                    <p className="skill-description">{skill.description}</p>
                    <div className="skill-meta">
                      <span className="skill-cost">Cost: {skill.skillPointCost} SP</span>
                      <span className="skill-rank">Rank: {skill.rank}</span>
                      <span className="skill-target">Target: {skill.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-skills">
                <p>No skills learned yet.</p>
              </div>
            )}
          </div>
        );

      case 'equipment':
        return (
          <div className="tab-content-placeholder">
            <h3>Equipment</h3>
            <p>Equipment system coming soon...</p>
          </div>
        );

      case 'edit':
        return (
          <div className="tab-content-placeholder">
            <h3>Edit Character</h3>
            <p>Character editing coming soon...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${character.name} ${character.surname}`}
      className="character-sheet-modal"
    >
      <div className="character-sheet-container">
        <div className="character-sheet-tabs">
          <button
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
          <button
            className={`tab-button ${activeTab === 'equipment' ? 'active' : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            Equipment
          </button>
          {!character.isNPC && (
            <button
              className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              Edit
            </button>
          )}
        </div>

        <div className="character-sheet-body">
          {renderTabContent()}
        </div>
      </div>
    </Modal>
  );
};

export default CharacterSheetModal;
