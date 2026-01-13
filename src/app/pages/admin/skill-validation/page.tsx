'use client';

import React, { useState, useEffect } from 'react';
import './SkillValidation.css';
import { useSkillValidation } from '../../../contexts/SkillValidationContext';
import { SkillValidationRule } from '../../../../services/skillValidationService';

const categoryLabels = {
  attack: 'Attack Skills',
  defence: 'Defence Skills',
  counter: 'Counter Skills',
  buff_debuff: 'Buff / Debuff Skills',
  healing: 'Healing Skills'
};

const SkillValidationPanel: React.FC = () => {
  const { rules, loading, fetchRules, updateRule, initializeDefaults } = useSkillValidation();
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleUpdate = async (id: number, updateData: Partial<SkillValidationRule>) => {
    await updateRule(id, updateData);
    setEditingId(null);
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('Initialize default validation rules from system.txt? This will create standard rules if they don\'t exist.')) {
      return;
    }
    await initializeDefaults();
  };

  const RuleRow: React.FC<{ rule: SkillValidationRule }> = ({ rule }) => {
    const [editData, setEditData] = useState(rule);

    return (
      <tr className={editingId === rule.id ? 'editing' : ''}>
        <td>
          <span className="subtype-badge">{rule.skillSubtype}</span>
        </td>
        <td className="range-cell">
          {editingId === rule.id ? (
            <div className="range-inputs">
              <input
                type="number"
                value={editData.minBasePower}
                onChange={(e) => setEditData({ ...editData, minBasePower: parseInt(e.target.value) || 0 })}
                className="form-input tiny"
                min="0"
              />
              <span>to</span>
              <input
                type="number"
                value={editData.maxBasePower}
                onChange={(e) => setEditData({ ...editData, maxBasePower: parseInt(e.target.value) || 0 })}
                className="form-input tiny"
                min="0"
              />
            </div>
          ) : (
            <span className="range-display">
              {rule.minBasePower} - {rule.maxBasePower}
            </span>
          )}
        </td>
        <td className="range-cell">
          {editingId === rule.id ? (
            <div className="range-inputs">
              <input
                type="number"
                value={editData.minAetherCost}
                onChange={(e) => setEditData({ ...editData, minAetherCost: parseInt(e.target.value) || 0 })}
                className="form-input tiny"
                min="0"
              />
              <span>to</span>
              <input
                type="number"
                value={editData.maxAetherCost}
                onChange={(e) => setEditData({ ...editData, maxAetherCost: parseInt(e.target.value) || 0 })}
                className="form-input tiny"
                min="0"
              />
            </div>
          ) : (
            <span className="range-display">
              {rule.minAetherCost} - {rule.maxAetherCost}
            </span>
          )}
        </td>
        <td>
          {editingId === rule.id ? (
            <input
              type="text"
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="form-input"
              placeholder="Optional description"
            />
          ) : (
            <span className="description-text">{rule.description || '-'}</span>
          )}
        </td>
        <td>
          <span className={`status-badge ${rule.isActive ? 'active' : 'inactive'}`}>
            {rule.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="actions">
          {editingId === rule.id ? (
            <div className="action-buttons">
              <button
                onClick={() => handleUpdate(rule.id, editData)}
                className="btn btn-sm btn-success"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditData(rule);
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
                  setEditingId(rule.id);
                  setEditData(rule);
                }}
                className="btn btn-sm btn-primary"
              >
                Edit
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="skill-validation-panel loading">
        Loading skill validation rules...
      </div>
    );
  }

  return (
    <div className="skill-validation-panel">
      <div className="panel-header">
        <h2>Skill Validation Rules</h2>
        <p>Configure basePower and aether cost ranges per skill type/subtype</p>
      </div>

      <div className="panel-actions">
        <button
          onClick={handleInitializeDefaults}
          className="btn btn-primary"
        >
          Initialize Default Rules
        </button>
      </div>

      {Object.entries(rules).map(([category, categoryRules]) => (
        <div key={category} className="rule-category">
          <div className="category-header">
            <h3>{categoryLabels[category as keyof typeof categoryLabels]}</h3>
          </div>

          {categoryRules.length === 0 ? (
            <div className="empty-state">
              No validation rules defined for {categoryLabels[category as keyof typeof categoryLabels]}.
              Click &quot;Initialize Default Rules&quot; to create them.
            </div>
          ) : (
            <div className="table-container">
              <table className="rules-table">
                <thead>
                  <tr>
                    <th>Subtype</th>
                    <th>BasePower Range</th>
                    <th>Aether Cost Range</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryRules.map((rule: SkillValidationRule) => (
                    <RuleRow key={rule.id} rule={rule} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      <div className="panel-footer">
        <div className="spec-reference">
          <h4>System Specifications</h4>
          <div className="spec-grid">
            <div className="spec-category">
              <h5>Attack Skills</h5>
              <ul>
                <li><strong>Light:</strong> Power 6-10, Cost 4-6</li>
                <li><strong>Standard:</strong> Power 11-16, Cost 7-10</li>
                <li><strong>Heavy:</strong> Power 17-24, Cost 12-18</li>
              </ul>
            </div>
            <div className="spec-category">
              <h5>Defence Skills</h5>
              <ul>
                <li><strong>Light:</strong> Power 8-12, Cost 6-12</li>
                <li><strong>Standard:</strong> Power 13-18, Cost 6-12</li>
                <li><strong>Heavy:</strong> Power 19-26, Cost 6-12</li>
              </ul>
            </div>
            <div className="spec-category">
              <h5>Counter Skills</h5>
              <ul>
                <li><strong>Light:</strong> Power 10-14, Cost 8-14</li>
                <li><strong>Standard:</strong> Power 15-22, Cost 8-14</li>
                <li><strong>Perfect:</strong> Power 23-30, Cost 8-14</li>
              </ul>
            </div>
            <div className="spec-category">
              <h5>Buff / Debuff</h5>
              <ul>
                <li><strong>All:</strong> Power varies, Cost 6-14</li>
                <li>Effect scales with CON stat</li>
              </ul>
            </div>
            <div className="spec-category">
              <h5>Healing</h5>
              <ul>
                <li><strong>All:</strong> Power varies, Cost 10-18</li>
                <li>Amount scales with skill power</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillValidationPanel;
