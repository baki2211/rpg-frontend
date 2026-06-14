'use client';

import React, { useState } from 'react';
import {
  useAvailableNPCs,
  useNPCActiveCharacter,
  useActivateNPC,
  useDeactivateNPC,
} from '@/app/hooks/queries/useNPCs';

const NPCSection: React.FC = () => {
  const { data: availableNPCs = [], isLoading: availableLoading } = useAvailableNPCs();
  const { data: activeCharacter, isLoading: activeLoading } = useNPCActiveCharacter();
  const activateMutation = useActivateNPC();
  const deactivateMutation = useDeactivateNPC();
  const [selectedNPC, setSelectedNPC] = useState<number | null>(null);

  const loading = availableLoading || activeLoading;

  const handleActivateNPC = async (npcId: number) => {
    try {
      await activateMutation.mutateAsync(npcId);
      setSelectedNPC(null);
    } catch (error) {
      console.error('Error activating NPC:', error);
    }
  };

  const handleDeactivateNPC = async () => {
    if (!activeCharacter?.isNPC || !activeCharacter.id) return;

    try {
      await deactivateMutation.mutateAsync(activeCharacter.id);
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
