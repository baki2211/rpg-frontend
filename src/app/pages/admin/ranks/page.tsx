'use client';

import React, { useState, useEffect, useCallback } from 'react';
import '../admin.css';
import { api } from '../../../../services/apiClient';

interface Rank {
  level: number;
  requiredExperience: number;
  statPoints: number;
  skillPoints: number;
  aetherPercent: number;
  hpPercent: number;
}

const RankPanel: React.FC = () => {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingLevel, setEditingLevel] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newRank, setNewRank] = useState<Rank>({
    level: 1,
    requiredExperience: 0,
    statPoints: 0,
    skillPoints: 0,
    aetherPercent: 0,
    hpPercent: 0
  });

  const fetchRanks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<Rank[]>('/ranks');
      setRanks(response.data);
    } catch (error) {
      console.error('Error fetching ranks:', error);
      showMessage('error', 'Failed to fetch ranks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanks();
  }, [fetchRanks]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async (rank: Rank) => {
    try {
      const existing = ranks.find(r=>r.level===rank.level);
      
      if (existing) {
        // Update existing rank
        await api.put(`/ranks/${rank.level}`, rank);
      } else {
        // Create new rank
        await api.post('/ranks', rank);
      }
      
      showMessage('success', 'Rank saved');
      setEditingLevel(null);
      fetchRanks();
    } catch (error: unknown) {
      console.error('Error saving rank:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save';
      showMessage('error', errorMessage);
    }
  };

  const handleDelete = async (level: number) => {
    if (!confirm('Delete this rank?')) return;
    try {
      await api.delete(`/ranks/delete/${level}`);
      showMessage('success', 'Deleted');
      fetchRanks();
    } catch (error: unknown) {
      console.error('Error deleting rank:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete';
      showMessage('error', errorMessage);
    }
  };

  const RankRow: React.FC<{ r: Rank }> = ({ r }) => {
    const [editData, setEditData] = useState<Rank>(r);

    return (
      <tr className={editingLevel === r.level ? 'editing' : ''}>
        <td>{r.level}</td>
        {editingLevel === r.level ? (
          <>
            <td><input type="number" value={Number.isNaN(editData.requiredExperience) ? '' : editData.requiredExperience} onChange={e=>setEditData({...editData, requiredExperience:parseInt(e.target.value)||0})}/></td>
            <td><input type="number" value={Number.isNaN(editData.statPoints) ? '' : editData.statPoints} onChange={e=>setEditData({...editData, statPoints:parseInt(e.target.value)||0})}/></td>
            <td><input type="number" value={Number.isNaN(editData.skillPoints) ? '' : editData.skillPoints} onChange={e=>setEditData({...editData, skillPoints:parseInt(e.target.value)||0})}/></td>
            <td><input type="number" value={Number.isNaN(editData.aetherPercent) ? '' : editData.aetherPercent} onChange={e=>setEditData({...editData, aetherPercent:parseFloat(e.target.value)||0})}/></td>
            <td><input type="number" value={Number.isNaN(editData.hpPercent) ? '' : editData.hpPercent} onChange={e=>setEditData({...editData, hpPercent:parseFloat(e.target.value)||0})}/></td>
            <td>
              <button onClick={()=>handleSave(editData)}>Save</button>
              <button onClick={()=>setEditingLevel(null)}>Cancel</button>
            </td>
          </>
        ) : (
          <>
            <td>{r.requiredExperience}</td>
            <td>{r.statPoints}</td>
            <td>{r.skillPoints}</td>
            <td>{r.aetherPercent}%</td>
            <td>{r.hpPercent}%</td>
            <td>
              <button onClick={()=>setEditingLevel(r.level)}>Edit</button>
              <button onClick={()=>handleDelete(r.level)}>Delete</button>
            </td>
          </>
        )}
      </tr>
    );
  };

  return (
    <div className="admin-panel">
      <h2>Rank Management</h2>
      {message && <div className={`alert ${message.type}`}>{message.text}</div>}
      {loading ? <p>Loading...</p> : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Level</th><th>XP Required</th><th>Stat Pts</th><th>Skill Pts</th><th>Aether %</th><th>HP %</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ranks.map(r=> <RankRow key={r.level} r={r}/>) }
          </tbody>
        </table>
      )}

      <h3>Create / Update Rank</h3>
      <div className="admin-form-inline">
        <input type="number" placeholder="Level" value={Number.isNaN(newRank.level)?'':newRank.level} onChange={e=>setNewRank({...newRank, level:parseInt(e.target.value)||0})}/>
        <input type="number" placeholder="XP" value={Number.isNaN(newRank.requiredExperience)?'':newRank.requiredExperience} onChange={e=>setNewRank({...newRank, requiredExperience:parseInt(e.target.value)||0})}/>
        <input type="number" placeholder="Stat Pts" value={Number.isNaN(newRank.statPoints)?'':newRank.statPoints} onChange={e=>setNewRank({...newRank, statPoints:parseInt(e.target.value)||0})}/>
        <input type="number" placeholder="Skill Pts" value={Number.isNaN(newRank.skillPoints)?'':newRank.skillPoints} onChange={e=>setNewRank({...newRank, skillPoints:parseInt(e.target.value)||0})}/>
        <input type="number" placeholder="Aether %" value={Number.isNaN(newRank.aetherPercent)?'':newRank.aetherPercent} onChange={e=>setNewRank({...newRank, aetherPercent:parseFloat(e.target.value)||0})}/>
        <input type="number" placeholder="HP %" value={Number.isNaN(newRank.hpPercent)?'':newRank.hpPercent} onChange={e=>setNewRank({...newRank, hpPercent:parseFloat(e.target.value)||0})}/>
        <button onClick={()=>handleSave(newRank)}>Save Rank</button>
      </div>
    </div>
  );
}; 
export default RankPanel; 