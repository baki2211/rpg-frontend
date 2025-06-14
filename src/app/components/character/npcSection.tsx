'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface NPC {
  id: number;
  name: string;
  surname: string;
  background?: string;
  imageUrl?: string;
  rank: number;
  experience: number;
  skillPoints: number;
  race: {
    id: number;
    name: string;
  };
}

interface ActiveCharacter {
  id: number;
  name: string;
  surname: string;
  isNPC?: boolean;
}

const NPCSection: React.FC = () => {
  const [availableNPCs, setAvailableNPCs] = useState<NPC[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<ActiveCharacter | null>(null);
  const [selectedNPC, setSelectedNPC] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [npcsResponse, activeCharResponse] = await Promise.all([
        axios.get('http://localhost:5001/api/characters/npcs/available', { withCredentials: true }),
        axios.get('http://localhost:5001/api/characters/', { withCredentials: true })
      ]);

      setAvailableNPCs(npcsResponse.data);
      
      // Find the active character
      const activeChar = activeCharResponse.data.find((char: ActiveCharacter & { isActive: boolean }) => char.isActive);
      setActiveCharacter(activeChar || null);
      
    } catch (error) {
      console.error('Error fetching NPC data:', error);
      setError('Failed to load NPCs');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateNPC = async (npcId: number) => {
    try {
      setError('');
      await axios.post(`http://localhost:5001/api/characters/npcs/${npcId}/activate`, {}, {
        withCredentials: true
      });
      
      // Refresh data to show the newly activated NPC
      await fetchData();
      setSelectedNPC(null);
    } catch (error: unknown) {
      console.error('Error activating NPC:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'Failed to activate NPC');
      } else {
        setError('Failed to activate NPC');
      }
    }
  };

  const handleDeactivateNPC = async () => {
    if (!activeCharacter?.isNPC) return;
    
    try {
      setError('');
      await axios.post(`http://localhost:5001/api/characters/npcs/${activeCharacter.id}/deactivate`, {}, {
        withCredentials: true
      });
      
      // Refresh data
      await fetchData();
    } catch (error: unknown) {
      console.error('Error deactivating NPC:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'Failed to deactivate NPC');
      } else {
        setError('Failed to deactivate NPC');
      }
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