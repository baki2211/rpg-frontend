import React, { useState, useEffect } from 'react';
import './EnginePanel.css';

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

interface StatsByCategory {
  primary_stat: StatDefinition[];
  resource: StatDefinition[];
  scaling_stat: StatDefinition[];
}

const categoryLabels = {
  primary_stat: 'Primary Stats (Character Creation)',
  resource: 'Resources (HP, Aether, etc.)',
  scaling_stat: 'Scaling Stats (Skill Engine)'
};

export const EnginePanel: React.FC = () => {
  const [stats, setStats] = useState<StatsByCategory>({
    primary_stat: [],
    resource: [],
    scaling_stat: []
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newStat, setNewStat] = useState<Partial<StatDefinition>>({
    internalName: '',
    displayName: '',
    description: '',
    category: 'primary_stat',
    defaultValue: 0,
    maxValue: undefined,
    minValue: 0,
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/stat-definitions/categories', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        showMessage('error', 'Failed to fetch stat definitions');
      }
    } catch {
      showMessage('error', 'Error fetching stat definitions');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/stat-definitions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStat)
      });

      if (response.ok) {
        showMessage('success', 'Stat definition created successfully');
        setShowCreateForm(false);
        setNewStat({
          internalName: '',
          displayName: '',
          description: '',
          category: 'primary_stat',
          defaultValue: 0,
          maxValue: undefined,
          minValue: 0,
          isActive: true,
          sortOrder: 0
        });
        fetchStats();
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to create stat definition');
      }
    } catch {
      showMessage('error', 'Error creating stat definition');
    }
  };

  const handleUpdate = async (id: number, updateData: Partial<StatDefinition>) => {
    try {
      const response = await fetch(`http://localhost:5001/api/stat-definitions/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        showMessage('success', 'Stat definition updated successfully');
        setEditingId(null);
        fetchStats();
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to update stat definition');
      }
    } catch {
      showMessage('error', 'Error updating stat definition');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this stat definition? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/stat-definitions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        showMessage('success', 'Stat definition deleted successfully');
        fetchStats();
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to delete stat definition');
      }
    } catch {
      showMessage('error', 'Error deleting stat definition');
    }
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('Initialize default stat definitions? This will create standard stats if they don\'t exist.')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/stat-definitions/initialize', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        showMessage('success', `Initialized ${data.createdStats} default stats`);
        fetchStats();
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.error || 'Failed to initialize default stats');
      }
    } catch {
      showMessage('error', 'Error initializing default stats');
    }
  };

  const StatRow: React.FC<{ stat: StatDefinition }> = ({ stat }) => {
    const [editData, setEditData] = useState(stat);

    return (
      <tr className={editingId === stat.id ? 'editing' : ''}>
        <td>
          {editingId === stat.id ? (
            <input
              type="text"
              value={editData.internalName}
              onChange={(e) => setEditData({ ...editData, internalName: e.target.value })}
              className="form-input small"
            />
          ) : (
            <code>{stat.internalName}</code>
          )}
        </td>
        <td>
          {editingId === stat.id ? (
            <input
              type="text"
              value={editData.displayName}
              onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
              className="form-input"
            />
          ) : (
            stat.displayName
          )}
        </td>
        <td>
          {editingId === stat.id ? (
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="form-textarea small"
              rows={2}
            />
          ) : (
            stat.description || '-'
          )}
        </td>
        <td>
          {editingId === stat.id ? (
            <input
              type="number"
              value={Number.isNaN(editData.defaultValue)?'':editData.defaultValue}
              onChange={(e) => setEditData({ ...editData, defaultValue: parseInt(e.target.value) || 0 })}
              className="form-input small"
            />
          ) : (
            stat.defaultValue
          )}
        </td>
        <td>
          {editingId === stat.id ? (
            <input
              type="number"
              value={editData.maxValue || ''}
              onChange={(e) => setEditData({ ...editData, maxValue: e.target.value ? parseInt(e.target.value) : undefined })}
              className="form-input small"
              placeholder="No limit"
            />
          ) : (
            stat.maxValue === undefined ? 100 : stat.maxValue
          )}
        </td>
        <td>
          <span className={`status-badge ${stat.isActive ? 'active' : 'inactive'}`}>
            {stat.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="actions">
          {editingId === stat.id ? (
            <div className="action-buttons">
              <button 
                onClick={() => handleUpdate(stat.id, editData)}
                className="btn btn-sm btn-success"
              >
                Save
              </button>
              <button 
                onClick={() => setEditingId(null)}
                className="btn btn-sm btn-secondary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="action-buttons">
              <button 
                onClick={() => setEditingId(stat.id)}
                className="btn btn-sm btn-primary"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDelete(stat.id)}
                className="btn btn-sm btn-danger"
              >
                Delete
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  if (loading) {
    return <div className="engine-panel loading">Loading engine configuration...</div>;
  }

  return (
    <div className="engine-panel">
      <div className="panel-header">
        <h2>🔧 Engine Panel</h2>
        <p>Configure character stats, resources, and scaling parameters</p>
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="panel-actions">
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          + Add New Stat
        </button>
        <button 
          onClick={handleInitializeDefaults}
          className="btn btn-secondary"
        >
          Initialize Defaults
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <h3>Create New Stat Definition</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Internal Name *</label>
              <input
                type="text"
                value={newStat.internalName}
                onChange={(e) => setNewStat({ ...newStat, internalName: e.target.value })}
                placeholder="e.g., hp, strength, focus"
                className="form-input"
              />
              <small>Lowercase letters, numbers, and underscores only</small>
            </div>
            
            <div className="form-group">
              <label>Display Name *</label>
              <input
                type="text"
                value={newStat.displayName}
                onChange={(e) => setNewStat({ ...newStat, displayName: e.target.value })}
                placeholder="e.g., Health Points, Strength, Focus"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Category *</label>
              <select
                value={newStat.category}
                onChange={(e) => setNewStat({ ...newStat, category: e.target.value as 'primary_stat' | 'resource' | 'scaling_stat' })}
                className="form-select"
              >
                <option value="primary_stat">Primary Stat</option>
                <option value="resource">Resource</option>
                <option value="scaling_stat">Scaling Stat</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Default Value *</label>
              <input
                type="number"
                value={Number.isNaN(newStat.defaultValue)?'':newStat.defaultValue}
                onChange={(e) => setNewStat({ ...newStat, defaultValue: parseInt(e.target.value) || 0 })}
                className="form-input small"
              />
            </div>
            
            <div className="form-group">
              <label>Max Value</label>
              <input
                type="number"
                value={newStat.maxValue || ''}
                onChange={(e) => setNewStat({ ...newStat, maxValue: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="No limit"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Min Value *</label>
              <input
                type="number"
                value={newStat.minValue}
                onChange={(e) => setNewStat({ ...newStat, minValue: parseInt(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>
          
          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              value={newStat.description}
              onChange={(e) => setNewStat({ ...newStat, description: e.target.value })}
              placeholder="Optional description of what this stat represents"
              className="form-textarea"
              rows={3}
            />
          </div>
          
          <div className="form-actions">
            <button onClick={handleCreate} className="btn btn-success">
              Create Stat Definition
            </button>
            <button onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {Object.entries(stats).map(([category, categoryStats]) => (
        <div key={category} className="stat-category">
          <h3>{categoryLabels[category as keyof typeof categoryLabels]}</h3>
          
          {categoryStats.length === 0 ? (
            <div className="empty-state">
              No {category.replace('_', ' ')} definitions found
            </div>
          ) : (
            <div className="table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Internal Name</th>
                    <th>Display Name</th>
                    <th>Description</th>
                    <th>Default</th>
                    <th>Max Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                                 <tbody>
                   {categoryStats.map((stat: StatDefinition) => (
                     <StatRow key={stat.id} stat={stat} />
                   ))}
                 </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 