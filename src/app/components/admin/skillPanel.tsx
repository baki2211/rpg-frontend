import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './admin.css';

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
  aetherCost: number;
  skillPointCost: number;
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
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState<Partial<Skill>>({
    name: '',
    description: '',
    branchId: 1,
    typeId: 1,
    basePower: 0,
    duration: 0,
    activation: '',
    requiredStats: { STR: 0, DEX: 0, RES: 0, MN: 0, CHA: 0 },
    aetherCost: 0,
    skillPointCost: 1,
    rank: 1,
    isPassive: false
  });

  useEffect(() => {
    fetchSkills();
    fetchBranches();
    fetchTypes();
  }, []);

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
      setFormData({
        name: '',
        description: '',
        branchId: 1,
        typeId: 1,
        basePower: 0,
        duration: 0,
        activation: '',
        requiredStats: { STR: 0, DEX: 0, RES: 0, MN: 0, CHA: 0 },
        aetherCost: 0,
        skillPointCost: 1,
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
    setFormData(skill);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5001/api/skills/${id}`);
      fetchSkills();
    } catch (error) {
      console.error('Error deleting skill:', error);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Skill Dashboard</h1>
        </div>

        <div className="admin-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name:</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-control" required />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-control" required />
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

            <div className="form-group">
              <label>Required Stats:</label>
              {Object.keys(formData.requiredStats || {}).map(stat => (
                <div key={stat} className="form-group">
                  <label>{stat}:</label>
                  <input
                    type="number"
                    name={`requiredStats.${stat}`}
                    value={formData.requiredStats?.[stat] || 0}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              ))}
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

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="isPassive"
                  checked={formData.isPassive}
                  onChange={handleInputChange}
                />
                Is Passive
              </label>
            </div>

            <button type="submit" className="btn btn-primary">{selectedSkill ? 'Update Skill' : 'Create Skill'}</button>
          </form>
        </div>

        <div className="admin-table">
          <h3>Skills List</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Branch</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.map(skill => (
                <tr key={skill.id}>
                  <td>{skill.name}</td>
                  <td>{branches.find(b => b.id === skill.branchId)?.name || skill.branchId}</td>
                  <td>{types.find(t => t.id === skill.typeId)?.name || skill.typeId}</td>
                  <td>
                    <button onClick={() => handleEdit(skill)} className="btn btn-primary">Edit</button>
                    <button onClick={() => handleDelete(skill.id)} className="btn btn-danger">Delete</button>
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