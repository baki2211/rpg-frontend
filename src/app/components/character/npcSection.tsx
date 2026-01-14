'use client';

import React, { useState, useEffect } from 'react';
import { useNPC } from '../../contexts/NPCContext';

const NPCSection: React.FC = () => {
  const { availableNPCs, activeCharacter, loading, error, activateNPC, deactivateNPC, refreshNPCData } = useNPC();
  const [selectedNPC, setSelectedNPC] = useState<number | null>(null);

  useEffect(() => {
    refreshNPCData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActivateNPC = async (npcId: number) => {
    try {
      await activateNPC(npcId);
      setSelectedNPC(null);
    } catch (error) {
      console.error('Error activating NPC:', error);
    }
  };

  const handleDeactivateNPC = async () => {
    if (!activeCharacter?.isNPC || !activeCharacter.id) return;

    try {
      await deactivateNPC(activeCharacter.id);
    } catch (error) {
      console.error('Error deactivating NPC:', error);
    }
  };

  if (loading) {
    return (
      <div className="npc-section">
        <h3>Available NPCs</h3>
        <div className="loading">Loading NPCs...</div>
      </div>
    );
  }

  return (
    <div className="npc-section">
      <h3>Available NPCs</h3>
      <p>Activate an NPC to play as them in chat and use their skills.</p>

      {error && <div className="error-message">{error}</div>}
      
      {activeCharacter?.isNPC && (
        <div className="active-npc-info">
          <h4>Currently Active NPC</h4>
          <p><strong>{activeCharacter.name} {activeCharacter.surname}</strong></p>
          <button 
            onClick={handleDeactivateNPC}
            className="btn btn-sm btn-secondary"
          >
            Deactivate NPC
          </button>
        </div>
      )}

      {availableNPCs.length === 0 ? (
        <p>No NPCs are currently available for activation.</p>
      ) : (
        <>
          <div className="available-npcs">
            {availableNPCs.map((npc) => (
              <div 
                key={npc.id} 
                className={`npc-option ${selectedNPC === npc.id ? 'selected' : ''}`}
                onClick={() => setSelectedNPC(selectedNPC === npc.id ? null : npc.id)}
              >
                <h4>{npc.name} {npc.surname}</h4>
                <p><strong>Race:</strong> {npc.race.name}</p>
                <p><strong>Rank:</strong> {npc.rank}</p>
                <p><strong>Experience:</strong> {npc.experience}</p>
                <p><strong>Skill Points:</strong> {npc.skillPoints}</p>
                {npc.background && (
                  <p><strong>Background:</strong> {npc.background}</p>
                )}
              </div>
            ))}
          </div>

          {selectedNPC && (
            <div className="npc-controls">
              <button 
                onClick={() => handleActivateNPC(selectedNPC)}
                className="btn btn-primary"
                disabled={!!activeCharacter?.isNPC}
              >
                {activeCharacter?.isNPC ? 'Deactivate current NPC first' : 'Activate Selected NPC'}
              </button>
              <button 
                onClick={() => setSelectedNPC(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NPCSection; 