import React, { useState, useEffect } from 'react';
import './admin.css';

interface Rank {
  level: number;
  requiredExperience: number;
  statPoints: number;
  skillPoints: number;
  aetherPercent: number;
  hpPercent: number;
}

export const RankPanel: React.FC = () => {
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

  useEffect(() => {
    fetchRanks();
  }, []);

  const fetchRanks = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/ranks', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRanks(data);
      } else {
        showMessage('error', 'Failed to fetch ranks');
      }
    } catch {
      showMessage('error', 'Error fetching ranks');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async (rank: Rank) => {
    try {
      const existing = ranks.find(r=>r.level===rank.level);
      const method = existing ? 'PUT' : 'POST';
      const url = existing ? `http://localhost:5001/api/ranks/${rank.level}` : 'http://localhost:5001/api/ranks';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rank)
      });
      if (res.ok) {
        showMessage('success', 'Rank saved');
        setEditingLevel(null);
        fetchRanks();
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Failed to save');
      }
    } catch {
      showMessage('error', 'Error saving rank');
    }
  };

  const handleDelete = async (level: number) => {
    if (!confirm('Delete this rank?')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/ranks/delete/${level}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        showMessage('success', 'Deleted');
        fetchRanks();
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Failed to delete');
      }
    } catch {
      showMessage('error', 'Error deleting rank');
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
              <button onClick={()=>handleSave(editData)}>💾 Save</button>
              <button onClick={()=>setEditingLevel(null)}>✖ Cancel</button>
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
              <button onClick={()=>setEditingLevel(r.level)}>✏️ Edit</button>
              <button onClick={()=>handleDelete(r.level)}>🗑 Delete</button>
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