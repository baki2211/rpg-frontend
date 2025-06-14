'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './admin.css';

interface StatDefinition {
  id: number;
  internalName: string;
  displayName: string;
  description?: string;
  category: 'primary_stat' | 'resource' | 'scaling_stat';
  defaultValue: number;
  maxValue?: number;
  minValue: number;
  isActive: boolean;
  sortOrder: number;
}

interface Race {
  id: number;
  name: string;
  description: string;
  image: string;
}

interface NPC {
  id: number;
  name: string;
  surname: string;
  age: number;
  gender: string;
  background?: string;
  imageUrl?: string;
  stats: Record<string, number>;
  rank: number;
  experience: number;
  skillPoints: number;
  statPoints: number;
  isActive: boolean;
  race: Race;
  creator?: {
    id: number;
    username: string;
  };
  createdAt: string;
}

const NPCPanel: React.FC = () => {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [statDefinitions, setStatDefinitions] = useState<StatDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state for creating/editing NPCs
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    age: 25,
    gender: 'Other',
    background: '',
    imageUrl: '',
    raceId: 0,
    rank: 1,
    experience: 0,
    skillPoints: 5,
    statPoints: 0,
    stats: {} as Record<string, number>
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [npcsResponse, racesResponse, statsResponse] = await Promise.all([
        axios.get('http://localhost:5001/api/characters/npcs', { withCredentials: true }),
        axios.get('http://localhost:5001/api/admin/races', { withCredentials: true }),
        axios.get('http://localhost:5001/api/stat-definitions?category=primary_stat&activeOnly=true', { withCredentials: true })
      ]);

      setNpcs(npcsResponse.data);
      setRaces(racesResponse.data);
      setStatDefinitions(statsResponse.data);

      // Initialize form stats with default values
      const initialStats: Record<string, number> = {};
      statsResponse.data.forEach((stat: StatDefinition) => {
        initialStats[stat.internalName] = stat.defaultValue;
      });
      setFormData(prev => ({ ...prev, stats: initialStats }));
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value === '' ? 0 : parseInt(value, 10) || 0) : value;
    
    if (name.startsWith('stat_')) {
      const statName = name.replace('stat_', '');
      setFormData(prev => ({
        ...prev,
        stats: { ...prev.stats, [statName]: parsedValue as number }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: parsedValue,
      }));
    }
  };

  const resetForm = () => {
    const initialStats: Record<string, number> = {};
    statDefinitions.forEach((stat) => {
      initialStats[stat.internalName] = stat.defaultValue;
    });

    setFormData({
      name: '',
      surname: '',
      age: 25,
      gender: 'Other',
      background: '',
      imageUrl: '',
      raceId: 0,
      rank: 1,
      experience: 0,
      skillPoints: 5,
      statPoints: 0,
      stats: initialStats
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        race: { id: formData.raceId }
      };

      if (editingId) {
        // Update existing NPC
        const response = await axios.put(
          `http://localhost:5001/api/characters/npcs/${editingId}`, 
          submitData, 
          { withCredentials: true }
        );
        setNpcs(npcs.map(npc => npc.id === editingId ? response.data : npc));
        setEditingId(null);
      } else {
        // Create new NPC
        const response = await axios.post(
          'http://localhost:5001/api/characters/npcs', 
          submitData, 
          { withCredentials: true }
        );
        setNpcs([...npcs, response.data]);
        setShowCreateForm(false);
      }

      resetForm();
      setError('');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'Failed to save NPC');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleEdit = (npc: NPC) => {
    setFormData({
      name: npc.name,
      surname: npc.surname,
      age: npc.age,
      gender: npc.gender,
      background: npc.background || '',
      imageUrl: npc.imageUrl || '',
      raceId: npc.race.id,
      rank: npc.rank,
      experience: npc.experience,
      skillPoints: npc.skillPoints,
      statPoints: npc.statPoints,
      stats: { ...npc.stats }
    });
    setEditingId(npc.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this NPC?')) return;

    try {
      await axios.delete(`http://localhost:5001/api/characters/npcs/${id}`, {
        withCredentials: true,
      });
      setNpcs(npcs.filter(npc => npc.id !== id));
    } catch (error) {
      console.error('Failed to delete NPC:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'Failed to delete NPC');
      } else {
        setError('Failed to delete NPC');
      }
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await axios.post(`http://localhost:5001/api/characters/npcs/${id}/activate`, {}, {
        withCredentials: true,
      });
      
      // Update the NPCs list to reflect the activation
      setNpcs(npcs.map(npc => ({
        ...npc,
        isActive: npc.id === id ? true : false // Only the activated NPC should be active
      })));
      
      setError('');
    } catch (error) {
      console.error('Failed to activate NPC:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'Failed to activate NPC');
      } else {
        setError('Failed to activate NPC');
      }
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await axios.post(`http://localhost:5001/api/characters/npcs/${id}/deactivate`, {}, {
        withCredentials: true,
      });
      
      // Update the NPCs list to reflect the deactivation
      setNpcs(npcs.map(npc => 
        npc.id === id ? { ...npc, isActive: false } : npc
      ));
      
      setError('');
    } catch (error) {
      console.error('Failed to deactivate NPC:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'Failed to deactivate NPC');
      } else {
        setError('Failed to deactivate NPC');
      }
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingId(null);
    resetForm();
    setError('');
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <h1>Manage NPCs</h1>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1>Manage NPCs</h1>
      
      {!showCreateForm && (
        <button 
          onClick={() => setShowCreateForm(true)} 
          className="btn btn-primary"
          style={{ marginBottom: '1rem' }}
        >
          Create New NPC
        </button>
      )}

      {showCreateForm && (
        <div className="admin-form">
          <h2>{editingId ? 'Edit NPC' : 'Create New NPC'}</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Name:</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>

            <div className="form-group">
              <label>Surname:</label>
              <input 
                type="text" 
                name="surname" 
                value={formData.surname} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>

            <div className="form-group">
              <label>Age:</label>
              <input 
                type="number" 
                name="age" 
                value={formData.age} 
                onChange={handleInputChange} 
                className="form-control" 
                min="1" 
                required 
              />
            </div>

            <div className="form-group">
              <label>Gender:</label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleInputChange} 
                className="form-control"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Race:</label>
              <select 
                name="raceId" 
                value={formData.raceId} 
                onChange={handleInputChange} 
                className="form-control" 
                required
              >
                <option value={0}>Select a race</option>
                {races.map(race => (
                  <option key={race.id} value={race.id}>{race.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Image URL:</label>
              <input 
                type="text" 
                name="imageUrl" 
                value={formData.imageUrl} 
                onChange={handleInputChange} 
                className="form-control" 
              />
            </div>

            <div className="form-group">
              <label>Rank:</label>
              <input 
                type="number" 
                name="rank" 
                value={formData.rank} 
                onChange={handleInputChange} 
                className="form-control" 
                min="1" 
              />
            </div>

            <div className="form-group">
              <label>Experience:</label>
              <input 
                type="number" 
                name="experience" 
                value={formData.experience} 
                onChange={handleInputChange} 
                className="form-control" 
                min="0" 
              />
            </div>

            <div className="form-group">
              <label>Skill Points:</label>
              <input 
                type="number" 
                name="skillPoints" 
                value={formData.skillPoints} 
                onChange={handleInputChange} 
                className="form-control" 
                min="0" 
              />
            </div>

            <div className="form-group">
              <label>Stat Points:</label>
              <input 
                type="number" 
                name="statPoints" 
                value={formData.statPoints} 
                onChange={handleInputChange} 
                className="form-control" 
                min="0" 
              />
            </div>

            <div className="form-group form-full-width">
              <label>Background:</label>
              <textarea 
                name="background" 
                value={formData.background} 
                onChange={handleInputChange} 
                className="form-control" 
                rows={3}
              />
            </div>

            <div className="form-group form-full-width">
              <h3>Primary Stats (No Limitations for NPCs)</h3>
              <div className="stats-grid">
                {statDefinitions.map((stat) => (
                  <div key={stat.internalName} className="stat-input">
                    <label>{stat.displayName}:</label>
                    <input 
                      type="number" 
                      name={`stat_${stat.internalName}`} 
                      value={formData.stats[stat.internalName] || stat.defaultValue} 
                      onChange={handleInputChange} 
                      className="form-control"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group form-full-width">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update NPC' : 'Create NPC'}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}

      <h2>Existing NPCs</h2>
      <div className="npc-list">
        {npcs.length === 0 ? (
          <p>No NPCs created yet.</p>
        ) : (
          npcs.map((npc) => (
            <div key={npc.id} className="npc-card">
              <div className="npc-header">
                <h3>{npc.name} {npc.surname}</h3>
                <div className="npc-badges">
                  <span className="badge">Rank {npc.rank}</span>
                  <span className="badge">{npc.race.name}</span>
                  {npc.isActive && <span className="badge active">Active</span>}
                </div>
              </div>
              
              <div className="npc-details">
                <p><strong>Age:</strong> {npc.age}</p>
                <p><strong>Gender:</strong> {npc.gender}</p>
                <p><strong>Experience:</strong> {npc.experience}</p>
                <p><strong>Skill Points:</strong> {npc.skillPoints}</p>
                <p><strong>Stat Points:</strong> {npc.statPoints}</p>
                {npc.creator && (
                  <p><strong>Created by:</strong> {npc.creator.username}</p>
                )}
                {npc.background && (
                  <p><strong>Background:</strong> {npc.background}</p>
                )}
              </div>

              <div className="npc-stats">
                <h4>Stats:</h4>
                <div className="stats-display">
                  {statDefinitions.map((stat) => (
                    <span key={stat.internalName} className="stat-display">
                      {stat.displayName}: {npc.stats[stat.internalName] || 0}
                    </span>
                  ))}
                </div>
              </div>

              <div className="npc-actions">
                <button 
                  onClick={() => handleEdit(npc)} 
                  className="btn btn-sm btn-secondary"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(npc.id)} 
                  className="btn btn-sm btn-danger"
                  disabled={npc.isActive}
                  title={npc.isActive ? "Cannot delete active NPC. Deactivate first." : "Delete NPC"}
                >
                  Delete
                </button>
                {npc.isActive ? (
                  <button 
                    onClick={() => handleDeactivate(npc.id)} 
                    className="btn-deactivate"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button 
                    onClick={() => handleActivate(npc.id)} 
                    className="btn-activate"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NPCPanel; 