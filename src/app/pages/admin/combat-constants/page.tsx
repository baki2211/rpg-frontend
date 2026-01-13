'use client';

import React, { useState, useEffect } from 'react';
import './CombatConstants.css';
import { useCombatConstants } from '../../../contexts/CombatConstantsContext';
import { CombatConstant } from '../../../../services/combatConstantsService';

const categoryLabels = {
  hp_system: 'Health & Survivability System',
  aether_system: 'Aether & Resources System',
  damage_system: 'Damage Resolution System',
  mastery_system: 'Mastery & Progression System',
  outcome_system: 'Outcome Quality System'
};

const categoryDescriptions = {
  hp_system: 'Configure HP scaling, damage reduction, and survivability mechanics',
  aether_system: 'Configure Aether pool size, regeneration, and cost mechanics',
  damage_system: 'Configure base damage calculations and combat resolution',
  mastery_system: 'Configure mastery multipliers and progression caps',
  outcome_system: 'Configure critical hits, outcome quality, and FOC integration'
};

const CombatConstantsPanel: React.FC = () => {
  const { constants, loading, fetchConstants, updateConstant, initializeDefaults } = useCombatConstants();
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchConstants();
  }, [fetchConstants]);

  const handleUpdate = async (id: number, value: number) => {
    await updateConstant(id, value);
    setEditingId(null);
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('Initialize default combat constants? This will create standard values from system.txt if they don\'t exist.')) {
      return;
    }
    await initializeDefaults();
  };

  const ConstantRow: React.FC<{ constant: CombatConstant }> = ({ constant }) => {
    const [editValue, setEditValue] = useState(constant.value);

    const formatValue = (value: number, isPercentage: boolean) => {
      if (isPercentage) {
        return `${(value * 100).toFixed(0)}%`;
      }
      return value.toString();
    };

    const handleSave = () => {
      // Validate min/max
      let validValue = editValue;
      if (constant.minValue !== undefined && editValue < constant.minValue) {
        validValue = constant.minValue;
        setEditValue(validValue);
      }
      if (constant.maxValue !== undefined && editValue > constant.maxValue) {
        validValue = constant.maxValue;
        setEditValue(validValue);
      }
      handleUpdate(constant.id, validValue);
    };

    return (
      <tr className={editingId === constant.id ? 'editing' : ''}>
        <td>
          <div className="constant-name">
            <code>{constant.constantKey}</code>
            <span className="display-name">{constant.displayName}</span>
          </div>
        </td>
        <td>
          <span className="description">{constant.description}</span>
        </td>
        <td className="value-cell">
          {editingId === constant.id ? (
            <div className="edit-value-container">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                step={constant.isPercentage ? 0.01 : 1}
                min={constant.minValue}
                max={constant.maxValue}
                className="form-input small"
              />
              {constant.isPercentage && <span className="percentage-label">({(editValue * 100).toFixed(0)}%)</span>}
            </div>
          ) : (
            <span className="constant-value">
              {formatValue(constant.value, constant.isPercentage)}
            </span>
          )}
        </td>
        <td>
          {constant.minValue !== undefined && (
            <span className="constraint">{formatValue(constant.minValue, constant.isPercentage)}</span>
          )}
        </td>
        <td>
          {constant.maxValue !== undefined && (
            <span className="constraint">{formatValue(constant.maxValue, constant.isPercentage)}</span>
          )}
        </td>
        <td>
          <span className={`status-badge ${constant.isActive ? 'active' : 'inactive'}`}>
            {constant.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="actions">
          {editingId === constant.id ? (
            <div className="action-buttons">
              <button
                onClick={handleSave}
                className="btn btn-sm btn-success"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setEditValue(constant.value);
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
                  setEditingId(constant.id);
                  setEditValue(constant.value);
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
      <div className="combat-constants-panel loading">
        Loading combat constants...
      </div>
    );
  }

  return (
    <div className="combat-constants-panel">
      <div className="panel-header">
        <h2>Combat Constants Configuration</h2>
      </div>

      <div className="panel-actions">
        <button
          onClick={handleInitializeDefaults}
          className="btn btn-primary"
        >
          Initialize Default Constants
        </button>
      </div>

      {Object.entries(constants).map(([category, categoryConstants]) => (
        <div key={category} className="constant-category">
          <div className="category-header">
            <h3>{categoryLabels[category as keyof typeof categoryLabels]}</h3>
            <p className="category-description">
              {categoryDescriptions[category as keyof typeof categoryDescriptions]}
            </p>
          </div>

          {categoryConstants.length === 0 ? (
            <div className="empty-state">
              No constants defined for {categoryLabels[category as keyof typeof categoryLabels]}.
              Click &quot;Initialize Default Constants&quot; to create them.
            </div>
          ) : (
            <div className="table-container">
              <table className="constants-table">
                <thead>
                  <tr>
                    <th>Constant</th>
                    <th>Description</th>
                    <th>Value</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryConstants.map((constant: CombatConstant) => (
                    <ConstantRow key={constant.id} constant={constant} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      <div className="panel-footer">
        <div className="formula-reference">
          <h4>Formula Reference</h4>
          <div className="formula-grid">
            <div className="formula-item">
              <strong>Max HP:</strong>
              <code>BHP (race) + (RES × HP_SCALE)</code>
            </div>
            <div className="formula-item">
              <strong>Damage Reduction:</strong>
              <code>min(RES × DAMAGE_REDUCTION_RATE, DAMAGE_REDUCTION_CAP)</code>
            </div>
            <div className="formula-item">
              <strong>Max Aether:</strong>
              <code>BAE (race) + (FOC × AETHER_FOC_MULT) + (FOR × AETHER_FOR_MULT)</code>
            </div>
            <div className="formula-item">
              <strong>Aether Regen:</strong>
              <code>BAR (race) + floor(FOC / AETHER_REGEN_FOC_DIV)</code>
            </div>
            <div className="formula-item">
              <strong>Impact:</strong>
              <code>basePower + FOR</code>
            </div>
            <div className="formula-item">
              <strong>Final Damage:</strong>
              <code>Impact × Mastery × OutcomeMultiplier</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombatConstantsPanel;
