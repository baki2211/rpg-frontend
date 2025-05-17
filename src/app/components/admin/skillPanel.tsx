import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Skill {
  id: number;
  name: string;
  description: string;
  branch: string;
  type: string;
  basePower: number;
  duration: number;
  activation: string;
  requiredStats: Record<string, number>;
  aetherCost: number;
  rank: number;
  isPassive: boolean;
}

const SkillDashboard: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState<Partial<Skill>>({
    name: '',
    description: '',
    branch: '',
    type: '',
    basePower: 0,
    duration: 0,
    activation: '',
    requiredStats: { STR: 0, DEX: 0, RES: 0, MN: 0, CHA: 0 },
    aetherCost: 0,
    rank: 1,
    isPassive: false
  });

  useEffect(() => {
    fetchSkills();
  }, []);

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
        branch: '',
        type: '',
        basePower: 0,
        duration: 0,
        activation: '',
        requiredStats: { STR: 0, DEX: 0, RES: 0, MN: 0, CHA: 0 },
        aetherCost: 0,
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
    <div>
      <h2>Skill Dashboard</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Branch:</label>
          <select name="branch" value={formData.branch} onChange={handleInputChange} required>
            <option value="">Select Branch</option>
            <option value="Pyromancy">Pyromancy</option>
            <option value="Cryomancy">Cryomancy</option>
            <option value="Chronomancy">Chronomancy</option>
          </select>
        </div>
        <div>
          <label>Type:</label>
          <select name="type" value={formData.type} onChange={handleInputChange} required>
            <option value="">Select Type</option>
            <option value="Attack">Attack</option>
            <option value="Defense">Defense</option>
            <option value="Support">Support</option>
            <option value="Mobility">Mobility</option>
            <option value="Utility">Utility</option>
          </select>
        </div>
        <div>
          <label>Base Power:</label>
          <input type="number" name="basePower" value={formData.basePower} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Duration:</label>
          <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Activation:</label>
          <select name="activation" value={formData.activation} onChange={handleInputChange} required>
            <option value="">Select Activation</option>
            <option value="BonusAction">Bonus Action</option>
            <option value="FullAction">Full Action</option>
            <option value="TwoTurns">Two Turns</option>
          </select>
        </div>
        <div>
          <label>Required Stats:</label>
          {Object.keys(formData.requiredStats || {}).map(stat => (
            <div key={stat}>
              <label>{stat}:</label>
              <input
                type="number"
                name={`requiredStats.${stat}`}
                value={formData.requiredStats?.[stat] || 0}
                onChange={handleInputChange}
              />
            </div>
          ))}
        </div>
        <div>
          <label>Aether Cost:</label>
          <input type="number" name="aetherCost" value={formData.aetherCost} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Rank:</label>
          <input type="number" name="rank" value={formData.rank} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Is Passive:</label>
          <input type="checkbox" name="isPassive" checked={formData.isPassive} onChange={handleInputChange} />
        </div>
        <button type="submit">{selectedSkill ? 'Update Skill' : 'Create Skill'}</button>
      </form>

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
              <td>{skill.branch}</td>
              <td>{skill.type}</td>
              <td>
                <button onClick={() => handleEdit(skill)}>Edit</button>
                <button onClick={() => handleDelete(skill.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkillDashboard; 