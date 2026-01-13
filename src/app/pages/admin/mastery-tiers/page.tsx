'use client';

import React, { useState, useEffect } from 'react';
import './MasteryTiers.css';
import { useMasteryTiers } from '../../../contexts/MasteryTiersContext';
import { MasteryTier } from '../../../../services/masteryTiersService';

const MasteryTiersPanel: React.FC = () => {
  const { tiers, loading, fetchTiers, createTier, updateTier, deleteTier, initializeDefaults } = useMasteryTiers();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newTier, setNewTier] = useState<Partial<MasteryTier>>({
    tier: 1,
    tierName: '',
    usesRequired: 0,
    multiplier: 1.0,
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

  const handleCreate = async () => {
    await createTier(newTier);
    setShowCreateForm(false);
    setNewTier({
      tier: 1,
      tierName: '',
      usesRequired: 0,
      multiplier: 1.0,
      description: '',
      isActive: true
    });
  };

  const handleUpdate = async (id: number, updateData: Partial<MasteryTier>) => {
    await updateTier(id, updateData);
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mastery tier? This action cannot be undone.')) {
      return;
    }
    await deleteTier(id);
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('Initialize default mastery tiers from system.txt? This will create the 10 standard tiers if they don\'t exist.')) {
      return;
    }
    await initializeDefaults();
  };

  const TierRow: React.FC<{ tier: MasteryTier }> = ({ tier }) => {
    const [editData, setEditData] = useState(tier);

    return (
      <tr className={editingId === tier.id ? 'editing' : ''}>
        <td className="tier-number">
          {editingId === tier.id ? (
            <input
              type="number"
              value={editData.tier}
              onChange={(e) => setEditData({ ...editData, tier: parseInt(e.target.value) || 1 })}
              className="form-input small"
              min="1"
              max="20"
            />
          ) : (
            <span className="tier-badge">{tier.tier}</span>
          )}
        </td>
        <td>
          {editingId === tier.id ? (
            <input
              type="text"
              value={editData.tierName}
              onChange={(e) => setEditData({ ...editData, tierName: e.target.value })}
              className="form-input"
              placeholder="e.g., Novice, Expert, Master"
            />
          ) : (
            <strong>{tier.tierName}</strong>
          )}
        </td>
        <td className="uses-cell">
          {editingId === tier.id ? (
            <input
              type="number"
              value={editData.usesRequired}
              onChange={(e) => setEditData({ ...editData, usesRequired: parseInt(e.target.value) || 0 })}
              className="form-input small"
              min="0"
            />
          ) : (
            <span className="uses-value">{tier.usesRequired}+</span>
          )}
        </td>
        <td className="multiplier-cell">
          {editingId === tier.id ? (
            <input
              type="number"
              value={editData.multiplier}
              onChange={(e) => setEditData({ ...editData, multiplier: parseFloat(e.target.value) || 1.0 })}
              className="form-input small"
              step="0.01"
              min="1.0"
            />
          ) : (
            <span className="multiplier-value">
              {tier.multiplier.toFixed(2)}×
            </span>
          )}
        </td>
        <td>
          {editingId === tier.id ? (
            <input
              type="text"
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="form-input"
              placeholder="Optional description"
            />
          ) : (
            <span className="description-text">{tier.description || '-'}</span>
          )}
        </td>
        <td>
          <span className={`status-badge ${tier.isActive ? 'active' : 'inactive'}`}>
            {tier.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="actions">
          {editingId === tier.id ? (
            <div className="action-buttons">
              <button
                onClick={() => handleUpdate(tier.id, editData)}
                className="btn btn-sm btn-success"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditData(tier);
                }}
                className="btn btn-sm btn-secondary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="action-buttons">
              <button
                onClick={() => {
                  setEditingId(tier.id);
                  setEditData(tier);
                }}
                className="btn btn-sm btn-primary"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(tier.id)}
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
    return (
      <div className="mastery-tiers-panel loading">
        Loading mastery tiers...
      </div>
    );
  }

  return (
    <div className="mastery-tiers-panel">
      <div className="panel-header">
        <h2>Mastery Tiers Configuration</h2>
      </div>

      <div className="panel-info">
        <div className="info-card">
          <h4>System Specification</h4>
          <p>
            <strong>Standard Tiers:</strong> 10 tiers from I (1.00×) to X (1.65×)
          </p>
          <p>
            Mastery tiers improve skill effectiveness through usage
          </p>
        </div>
      </div>

      <div className="panel-actions">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          + Add New Tier
        </button>
        <button
          onClick={handleInitializeDefaults}
          className="btn btn-secondary"
        >
          Initialize Default Tiers
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <h3>Create New Mastery Tier</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Tier Number *</label>
              <input
                type="number"
                value={newTier.tier}
                onChange={(e) => setNewTier({ ...newTier, tier: parseInt(e.target.value) || 1 })}
                className="form-input"
                min="1"
                max="20"
                placeholder="e.g., 1, 2, 3"
              />
              <small>Tier ordering (1 = lowest, 10 = cap)</small>
            </div>

            <div className="form-group">
              <label>Tier Name *</label>
              <input
                type="text"
                value={newTier.tierName}
                onChange={(e) => setNewTier({ ...newTier, tierName: e.target.value })}
                className="form-input"
                placeholder="e.g., Novice, Expert, Master"
              />
              <small>Display name for this tier</small>
            </div>

            <div className="form-group">
              <label>Uses Required *</label>
              <input
                type="number"
                value={newTier.usesRequired}
                onChange={(e) => setNewTier({ ...newTier, usesRequired: parseInt(e.target.value) || 0 })}
                className="form-input"
                min="0"
                placeholder="e.g., 0, 20, 50"
              />
              <small>Skill uses needed to reach this tier</small>
            </div>

            <div className="form-group">
              <label>Multiplier *</label>
              <input
                type="number"
                value={newTier.multiplier}
                onChange={(e) => setNewTier({ ...newTier, multiplier: parseFloat(e.target.value) || 1.0 })}
                className="form-input"
                step="0.01"
                min="1.0"
                placeholder="e.g., 1.00, 1.08, 1.65"
              />
              <small>Damage multiplier for this tier</small>
            </div>
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              value={newTier.description}
              onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
              className="form-textarea"
              rows={2}
              placeholder="Optional description of this tier's benefits"
            />
          </div>

          <div className="form-actions">
            <button onClick={handleCreate} className="btn btn-success">
              Create Tier
            </button>
            <button onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="tiers-container">
        {tiers.length === 0 ? (
          <div className="empty-state">
            No mastery tiers defined. Click &quot;Initialize Default Tiers&quot; to create the 10 standard tiers.
          </div>
        ) : (
          <div className="table-container">
            <table className="tiers-table">
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Name</th>
                  <th>Uses Required</th>
                  <th>Multiplier</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier: MasteryTier) => (
                  <TierRow key={tier.id} tier={tier} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel-footer">
        <div className="default-tiers-reference">
          <h4>Default Tiers</h4>
          <div className="tiers-grid">
            <div className="tier-ref-item"><strong>Tier I:</strong> 1.00× (0 uses)</div>
            <div className="tier-ref-item"><strong>Tier II:</strong> 1.08× (20 uses)</div>
            <div className="tier-ref-item"><strong>Tier III:</strong> 1.16× (40 uses)</div>
            <div className="tier-ref-item"><strong>Tier IV:</strong> 1.24× (60 uses)</div>
            <div className="tier-ref-item"><strong>Tier V:</strong> 1.32× (80 uses)</div>
            <div className="tier-ref-item"><strong>Tier VI:</strong> 1.40× (100 uses)</div>
            <div className="tier-ref-item"><strong>Tier VII:</strong> 1.48× (120 uses)</div>
            <div className="tier-ref-item"><strong>Tier VIII:</strong> 1.55× (150 uses)</div>
            <div className="tier-ref-item"><strong>Tier IX:</strong> 1.60× (180 uses)</div>
            <div className="tier-ref-item"><strong>Tier X:</strong> 1.65× (200 uses)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasteryTiersPanel;
