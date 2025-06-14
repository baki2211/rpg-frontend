import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './admin.css';
import { API_URL } from '../../../config/api';

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
      const response = await axios.get(`${API_URL}/skill-branches`);
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
        await axios.put(`${API_URL}/skill-branches/${selectedBranch.id}`, formData);
      } else {
        await axios.post(`${API_URL}/skill-branches`, formData);
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
    if (window.confirm('Are you sure you want to delete this skill branch?')) {
      try {
        await axios.delete(`${API_URL}/skill-branches/${id}`);
        fetchBranches();
      } catch (error) {
        console.error('Error deleting skill branch:', error);
      }
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Skill Branch Dashboard</h1>
        </div>

        <div className="admin-form">
          <h2 className="form-full-width">{selectedBranch ? 'Edit Skill Branch' : 'Create New Skill Branch'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Branch Name:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className="form-control" 
                  required 
                  placeholder="Enter skill branch name..." 
                />
              </div>

              <div className="form-group form-full-width">
                <label>Description:</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  className="form-control" 
                  required 
                  placeholder="Describe this skill branch and its purpose..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="form-full-width">
              <button type="submit" className="btn btn-primary">
                {selectedBranch ? '✓ Update Branch' : '+ Create Branch'}
              </button>
              {selectedBranch && (
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedBranch(null);
                    setFormData({ name: '', description: '' });
                  }}
                  className="btn btn-secondary"
                  style={{ marginLeft: '1rem' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-table">
          <h3>Skill Branches ({branches.length})</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(branch => (
                <tr key={branch.id}>
                  <td><strong>{branch.name}</strong></td>
                  <td>{branch.description}</td>
                  <td>
                    <button onClick={() => handleEdit(branch)} className="btn btn-success">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(branch.id)} className="btn btn-danger">
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {branches.length === 0 && (
            <div className="no-data">
              <p>No skill branches created yet. Create your first one above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillBranchDashboard; 