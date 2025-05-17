import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SkillBranch {
  id: number;
  name: string;
  description: string;
}

const SkillBranchDashboard: React.FC = () => {
  const [branches, setBranches] = useState<SkillBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<SkillBranch | null>(null);
  const [formData, setFormData] = useState<Partial<SkillBranch>>({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/skill-branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching skill branches:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedBranch) {
        await axios.put(`http://localhost:5001/api/skill-branches/${selectedBranch.id}`, formData);
      } else {
        await axios.post('http://localhost:5001/api/skill-branches', formData);
      }
      fetchBranches();
      setFormData({ name: '', description: '' });
      setSelectedBranch(null);
    } catch (error) {
      console.error('Error saving skill branch:', error);
    }
  };

  const handleEdit = (branch: SkillBranch) => {
    setSelectedBranch(branch);
    setFormData(branch);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5001/api/skill-branches/${id}`);
      fetchBranches();
    } catch (error) {
      console.error('Error deleting skill branch:', error);
    }
  };

  return (
    <div>
      <h2>Skill Branch Dashboard</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange} required />
        </div>
        <button type="submit">{selectedBranch ? 'Update Branch' : 'Create Branch'}</button>
      </form>

      <h3>Branches List</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {branches.map(branch => (
            <tr key={branch.id}>
              <td>{branch.name}</td>
              <td>{branch.description}</td>
              <td>
                <button onClick={() => handleEdit(branch)}>Edit</button>
                <button onClick={() => handleDelete(branch.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkillBranchDashboard; 