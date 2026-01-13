'use client';

import React, { useState, useEffect } from 'react';
import '../admin.css';
import { api } from '../../../../services/apiClient';

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
  isPlayable: boolean;
  baseHp?: number;          
  baseAether?: number;      
  baseSpeed?: number;       
  baseAetherRegen?: number;
  // Legacy bonuses (deprecated - keeping for backward compatibility)
  healthBonus?: number;
  manaBonus?: number;
  speedBonus?: number;
  // Dynamic stat bonuses based on stat definitions
  focusBonus?: number;
  controlBonus?: number;
  resilienceBonus?: number;
  instinctBonus?: number;
  presenceBonus?: number;
  forceBonus?: number;
  [key: string]: string | number | boolean | undefined;
}

const RacePanel: React.FC = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [newRace, setNewRace] = useState<Partial<Race>>({});
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Race>>({});
  const [statDefinitions, setStatDefinitions] = useState<StatDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch races
        const racesResponse = await api.get<Race[]>('/admin/races');
        setRaces(racesResponse.data);

        // Fetch stat definitions for primary stats
        const statsResponse = await api.get<StatDefinition[]>('/stat-definitions?category=primary_stat&activeOnly=true');
        setStatDefinitions(statsResponse.data);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? (value === '' ? undefined : parseInt(value, 10) || 0) : value;
    setNewRace(prev => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewRace(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const addRace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post<Race>('/admin/races/new', newRace);
      setRaces([...races, response.data]);
      setNewRace({});
    } catch (error: unknown) {
      console.error('Error adding race:', error);
      setError('Failed to add race');
    }
  };

  const deleteRace = async (id: number) => {
    try {
      await api.delete(`/admin/races/delete/${id}`);
      setRaces(races.filter((race) => race.id !== id));
    } catch (error) {
      console.error('Failed to delete race:', error);
    }
  };

  const handleSave = async (id: number) => {
    try {
      await api.put(`/admin/races/update/${id}`, editData);
      setRaces(races.map(r => r.id === id ? {...r, ...editData} as Race : r));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (race: Race) => {
    setEditingId(race.id);
    setEditData(race);
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <h1>Manage Races</h1>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1>Manage Races</h1>
      <div className="admin-form">
        <h2>Create New Race</h2>
        <form onSubmit={addRace} className="form-grid">
          <div className="form-group">
            <label>Name:</label>
            <input type="text" name="name" value={newRace.name || ''} onChange={handleInputChange} className="form-control" required />
          </div>
          <div className="form-group">
            <label>Image URL:</label>
            <input type="text" name="image" value={newRace.image || ''} onChange={handleInputChange} className="form-control" />
          </div>
          <div className="form-group">
            <label>
              <input 
                type="checkbox" 
                name="isPlayable" 
                checked={newRace.isPlayable ?? true} 
                onChange={handleCheckboxChange} 
              />
              Available for Player Characters
            </label>
          </div>
          <div className="form-group form-full-width">
            <label>Description:</label>
            <textarea name="description" value={newRace.description || ''} onChange={handleInputChange} className="form-control" required />
          </div>
          
          <div className="form-group form-full-width">
            <h3>Race Attributes (Required)</h3>
            <div className="bonus-grid">
              <div>
                <label>Base HP (BHP) *:</label>
                <input
                  type="number"
                  name="baseHp"
                  value={newRace.baseHp || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 100"
                  required
                />
                <small>Used in: MaxHP = BHP + (RES × 10)</small>
              </div>
              <div>
                <label>Base Aether (BAE) *:</label>
                <input
                  type="number"
                  name="baseAether"
                  value={newRace.baseAether || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 50"
                  required
                />
                <small>Used in: MaxAether = BAE + (FOC × 8) + (FOR × 4)</small>
              </div>
              <div>
                <label>Base Speed (BSD) *:</label>
                <input
                  type="number"
                  name="baseSpeed"
                  value={newRace.baseSpeed || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                  required
                />
                <small>Base initiative/movement speed</small>
              </div>
              <div>
                <label>Base Aether Regen (BAR) *:</label>
                <input
                  type="number"
                  name="baseAetherRegen"
                  value={newRace.baseAetherRegen || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 3"
                  required
                />
                <small>Used in: AetherRegen = BAR + floor(FOC / 2)</small>
              </div>
            </div>
          </div>

          <div className="form-group form-full-width">
            <h3>Resource Bonuses (Deprecated)</h3>
            <p className="warning-text">These fields are kept for backward compatibility</p>
            <div className="bonus-grid">
              <div>
                <label>Health Bonus (Legacy):</label>
                <input type="number" name="healthBonus" value={newRace.healthBonus || ''} onChange={handleInputChange} />
              </div>
              <div>
                <label>Mana Bonus (Legacy):</label>
                <input type="number" name="manaBonus" value={newRace.manaBonus || ''} onChange={handleInputChange} />
              </div>
              <div>
                <label>Speed Bonus (Legacy):</label>
                <input type="number" name="speedBonus" value={newRace.speedBonus || ''} onChange={handleInputChange} />
              </div>
            </div>
          </div>

          <div className="form-group form-full-width">
            <h3>Primary Stat Bonuses</h3>
            <div className="bonus-grid">
              {statDefinitions.map((stat) => (
                <div key={stat.internalName}>
                  <label>{stat.displayName} Bonus:</label>
                  <input 
                    type="number" 
                    name={`${stat.internalName}Bonus`} 
                    value={(newRace[`${stat.internalName}Bonus`] as number) || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="form-group form-full-width">
            <button type="submit" className="btn btn-primary">Add Race</button>
          </div>
        </form>
      </div>
      {error && <p className="error-text-red">{error}</p>}

      <h2>Existing Races</h2>
      <div className="race-list">
        {races.map((race) => (
          <div key={race.id} className="race-card">
            {editingId===race.id ? (
              <div className="edit-form">
                <div className="form-row">
                  <label>Name:</label>
                  <input type="text" value={editData.name||''} onChange={e=>setEditData({...editData,name:e.target.value})} />
                </div>
                <div className="form-row">
                  <label>Description:</label>
                  <textarea value={editData.description||''} onChange={e=>setEditData({...editData,description:e.target.value})} />
                </div>
                <div className="form-row">
                  <label>Image URL:</label>
                  <input type="text" value={editData.image||''} onChange={e=>setEditData({...editData,image:e.target.value})} />
                </div>
                <div className="form-row">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={editData.isPlayable ?? true} 
                      onChange={e=>setEditData({...editData,isPlayable:e.target.checked})} 
                    />
                    Available for Player Characters
                  </label>
                </div>
                
                <h4>Race Attributes</h4>
                <div className="bonus-grid">
                  <div>
                    <label>Base HP (BHP) *:</label>
                    <input type="number" value={editData.baseHp ?? ''} onChange={e=>setEditData({...editData,baseHp:parseInt(e.target.value)||0})}/>
                    <small>MaxHP = BHP + (RES × 10)</small>
                  </div>
                  <div>
                    <label>Base Aether (BAE) *:</label>
                    <input type="number" value={editData.baseAether ?? ''} onChange={e=>setEditData({...editData,baseAether:parseInt(e.target.value)||0})}/>
                    <small>MaxAether = BAE + (FOC × 8) + (FOR × 4)</small>
                  </div>
                  <div>
                    <label>Base Speed (BSD) *:</label>
                    <input type="number" value={editData.baseSpeed ?? ''} onChange={e=>setEditData({...editData,baseSpeed:parseInt(e.target.value)||0})}/>
                  </div>
                  <div>
                    <label>Base Aether Regen (BAR) *:</label>
                    <input type="number" value={editData.baseAetherRegen ?? ''} onChange={e=>setEditData({...editData,baseAetherRegen:parseInt(e.target.value)||0})}/>
                    <small>Regen = BAR + floor(FOC / 2)</small>
                  </div>
                </div>

                <h4>Legacy Resource Bonuses (Deprecated)</h4>
                <div className="bonus-grid">
                  <div>
                    <label>Health (Legacy):</label>
                    <input type="number" value={editData.healthBonus ?? ''} onChange={e=>setEditData({...editData,healthBonus:parseInt(e.target.value)||0})}/>
                  </div>
                  <div>
                    <label>Mana (Legacy):</label>
                    <input type="number" value={editData.manaBonus ?? ''} onChange={e=>setEditData({...editData,manaBonus:parseInt(e.target.value)||0})}/>
                  </div>
                  <div>
                    <label>Speed (Legacy):</label>
                    <input type="number" value={editData.speedBonus ?? ''} onChange={e=>setEditData({...editData,speedBonus:parseInt(e.target.value)||0})}/>
                  </div>
                </div>

                <h4>Primary Stat Bonuses</h4>
                <div className="bonus-grid">
                  {statDefinitions.map((stat) => (
                    <div key={stat.internalName}>
                      <label>{stat.displayName}:</label>
                      <input 
                        type="number" 
                        value={(editData[`${stat.internalName}Bonus`] as number) ?? ''} 
                        onChange={e=>setEditData({...editData,[`${stat.internalName}Bonus`]:parseInt(e.target.value)||0})}
                      />
                    </div>
                  ))}
                </div>

                <div className="action-buttons">
                  <button onClick={()=>handleSave(race.id)} className="btn btn-sm btn-success">Save</button>
                  <button onClick={()=>setEditingId(null)} className="btn btn-sm btn-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h3>{race.name} {!race.isPlayable && <span className="npc-only-badge">NPC Only</span>}</h3>
                <p>{race.description}</p>
                <div className="race-info">
                  <p><strong>Playable by Players:</strong> {race.isPlayable ? 'Yes' : 'No'}</p>
                </div>
                <button onClick={() => deleteRace(race.id)} className="btn btn-sm btn-danger">Delete</button>
                <button onClick={() => startEdit(race)} className="btn btn-sm btn-secondary">Edit</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RacePanel;
