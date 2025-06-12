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

interface Skill {
  id: number;
  name: string;
  description: string;
  branchId: number;
  typeId: number;
  basePower: number;
  duration: number;
  activation: string;
  requiredStats: Record<string, number>;
  scalingStats: string[];  // Array of up to 3 scaling stats
  aetherCost: number;
  skillPointCost: number;
  target: string;  // 'self', 'other', 'none'
  rank: number;
  isPassive: boolean;
}

interface Branch {
  id: number;
  name: string;
}

interface Type {
  id: number;
  name: string;
}

const SkillDashboard: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [statDefinitions, setStatDefinitions] = useState<StatDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState<Partial<Skill>>({
    name: '',
    description: '',
    branchId: 1,
    typeId: 1,
    basePower: 0,
    duration: 0,
    activation: '',
    requiredStats: {},
    scalingStats: [],  // Initialize empty array for scaling stats
    aetherCost: 0,
    skillPointCost: 1,
    target: 'other',  // Default target
    rank: 1,
    isPassive: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchSkills(),
          fetchBranches(),
          fetchTypes(),
          fetchStatDefinitions()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchStatDefinitions = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/stat-definitions?category=primary_stat&activeOnly=true', {
        withCredentials: true,
      });
      setStatDefinitions(response.data);
      
      // Initialize required stats with all primary stats set to 0
      const initialRequiredStats: Record<string, number> = {};
      response.data.forEach((stat: StatDefinition) => {
        initialRequiredStats[stat.internalName] = 0;
      });
      
      setFormData(prev => ({
        ...prev,
        requiredStats: initialRequiredStats
      }));
    } catch (error) {
      console.error('Error fetching stat definitions:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/skill-branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/skill-types');
      setTypes(response.data);
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/skills');
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  // Add validation function for scaling stats
  const validateScalingStats = (newStats: string[], index: number, value: string): boolean => {
    // If the value is empty (deselecting), it's always valid
    if (!value) return true;
    
    // Check if the value already exists in other positions
    return !newStats.some((stat, i) => i !== index && stat === value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else if (name.startsWith('requiredStats.')) {
      const stat = name.split('.')[1];
      setFormData({
        ...formData,
        requiredStats: { ...formData.requiredStats, [stat]: Number(value) }
      });
    } else if (name.startsWith('scalingStats.')) {
      const index = parseInt(name.split('.')[1]);
      const newScalingStats = [...(formData.scalingStats || [])];
      
      // Validate before updating
      if (validateScalingStats(newScalingStats, index, value)) {
        newScalingStats[index] = value;
        setFormData({
          ...formData,
          scalingStats: newScalingStats
        });
      } else {
        // Show error message for duplicate stat
        alert('This stat is already selected. Please choose a different stat.');
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedSkill) {
        await axios.put(`http://localhost:5001/api/skills/${selectedSkill.id}`, formData);
      } else {
        await axios.post('http://localhost:5001/api/skills', formData);
      }
      fetchSkills();
      
      // Reset form with proper required stats structure
      const initialRequiredStats: Record<string, number> = {};
      statDefinitions.forEach(stat => {
        initialRequiredStats[stat.internalName] = 0;
      });
      
      setFormData({
        name: '',
        description: '',
        branchId: 1,
        typeId: 1,
        basePower: 0,
        duration: 0,
        activation: '',
        requiredStats: initialRequiredStats,
        scalingStats: [],
        aetherCost: 0,
        skillPointCost: 1,
        target: 'other',
        rank: 1,
        isPassive: false
      });
      setSelectedSkill(null);
    } catch (error) {
      console.error('Error saving skill:', error);
    }
  };

  const handleEdit = (skill: Skill) => {
    setSelectedSkill(skill);
    
    // Ensure required stats includes all current stat definitions
    const updatedRequiredStats = { ...skill.requiredStats };
    statDefinitions.forEach(stat => {
      if (!(stat.internalName in updatedRequiredStats)) {
        updatedRequiredStats[stat.internalName] = 0;
      }
    });
    
    setFormData({
      ...skill,
      requiredStats: updatedRequiredStats
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5001/api/skills/${id}`);
      fetchSkills();
    } catch (error) {
      console.error('Error deleting skill:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <h1>Skill Dashboard</h1>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Skill Dashboard</h1>
        </div>

        <div className="admin-form">
          <h2 className="form-full-width">{selectedSkill ? 'Edit Skill' : 'Create New Skill'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
            <div className="form-group">
              <label>Skill Name:</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-control" required placeholder="Enter skill name..." />
            </div>

              <div className="form-group form-full-width">
                <label>Description:</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-control" required placeholder="Describe the skill effects and mechanics..." />
              </div>

            <div className="form-group">
              <label>Branch:</label>
              <select name="branchId" value={formData.branchId} onChange={handleInputChange} className="form-control" required>
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Type:</label>
              <select name="typeId" value={formData.typeId} onChange={handleInputChange} className="form-control" required>
                <option value="">Select Type</option>
                {types.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Target:</label>
              <select name="target" value={formData.target} onChange={handleInputChange} className="form-control" required>
                <option value="other">Other (targets enemies/others)</option>
                <option value="self">Self (targets user)</option>
                <option value="none">None (area effects, no target)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Base Power:</label>
              <input type="number" name="basePower" value={formData.basePower} onChange={handleInputChange} className="form-control" required />
            </div>

            <div className="form-group">
              <label>Duration:</label>
              <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} className="form-control" required />
            </div>

            <div className="form-group">
              <label>Activation:</label>
              <select name="activation" value={formData.activation} onChange={handleInputChange} className="form-control" required>
                <option value="">Select Activation</option>
                <option value="BonusAction">Bonus Action</option>
                <option value="FullAction">Full Action</option>
                <option value="TwoTurns">Two Turns</option>
              </select>
            </div>

              <div className="form-group form-full-width">
                <label>Required Stats:</label>
                <div className="required-stats-grid">
                  {statDefinitions.map(stat => (
                    <div key={stat.internalName} className="form-group">
                      <label>{stat.displayName} ({stat.internalName.toUpperCase()}):</label>
                      <input
                        type="number"
                        name={`requiredStats.${stat.internalName}`}
                        value={formData.requiredStats?.[stat.internalName] || 0}
                        onChange={handleInputChange}
                        className="form-control"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group form-full-width">
                <label>Scaling Stats:</label>
                <div className="scaling-stats-grid">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="form-group">
                      <label>Stat {index + 1}:</label>
                      <select
                        name={`scalingStats.${index}`}
                        value={formData.scalingStats?.[index] || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="">Select Stat</option>
                        {statDefinitions.map(stat => (
                          <option key={stat.internalName} value={stat.internalName}>
                            {stat.displayName} ({stat.internalName.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

            <div className="form-group">
              <label>Aether Cost:</label>
              <input type="number" name="aetherCost" value={formData.aetherCost} onChange={handleInputChange} className="form-control" required />
            </div>

            <div className="form-group">
              <label>Skill Point Cost:</label>
              <input 
                type="number" 
                name="skillPointCost" 
                value={formData.skillPointCost} 
                onChange={handleInputChange} 
                className="form-control"
                min="1"
                required 
              />
            </div>

            <div className="form-group">
              <label>Rank:</label>
              <input type="number" name="rank" value={formData.rank} onChange={handleInputChange} className="form-control" required />
            </div>

              <div className="form-group form-full-width">
                <label>
                  <input
                    type="checkbox"
                    name="isPassive"
                    checked={formData.isPassive}
                    onChange={handleInputChange}
                  />
                  Is Passive Skill
                </label>
              </div>

            </div>
            
            <div className="form-full-width">
              <button type="submit" className="btn btn-primary">
                {selectedSkill ? '✓ Update Skill' : '+ Create Skill'}
              </button>
            </div>
          </form>
        </div>

        <div className="admin-table">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Branch</th>
                <th>Type</th>
                <th>Target</th>
                <th>Base Power</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map(skill => (
                <tr key={skill.id}>
                  <td><strong>{skill.name}</strong></td>
                  <td>{branches.find(b => b.id === skill.branchId)?.name || skill.branchId}</td>
                  <td>{types.find(t => t.id === skill.typeId)?.name || skill.typeId}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      backgroundColor: skill.target === 'self' ? '#4ecdc4' : skill.target === 'other' ? '#ff6b6b' : '#667eea',
                      color: 'white'
                    }}>
                      {skill.target}
                    </span>
                  </td>
                  <td><strong>{skill.basePower}</strong></td>
                  <td>{skill.skillPointCost} SP</td>
                  <td>
                    <button onClick={() => handleEdit(skill)} className="btn btn-success">✏️ Edit</button>
                    <button onClick={() => handleDelete(skill.id)} className="btn btn-danger">🗑️ Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SkillDashboard; 