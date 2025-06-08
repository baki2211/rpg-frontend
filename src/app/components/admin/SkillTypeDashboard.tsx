import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './admin.css';

interface SkillType {
  id: number;
  name: string;
  description: string;
}

const SkillTypeDashboard: React.FC = () => {
  const [types, setTypes] = useState<SkillType[]>([]);
  const [selectedType, setSelectedType] = useState<SkillType | null>(null);
  const [formData, setFormData] = useState<Partial<SkillType>>({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/skill-types');
      setTypes(response.data);
    } catch (error) {
      console.error('Error fetching skill types:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedType) {
        await axios.put(`http://localhost:5001/api/skill-types/${selectedType.id}`, formData);
      } else {
        await axios.post('http://localhost:5001/api/skill-types', formData);
      }
      fetchTypes();
      setFormData({ name: '', description: '' });
      setSelectedType(null);
    } catch (error) {
      console.error('Error saving skill type:', error);
    }
  };

  const handleEdit = (type: SkillType) => {
    setSelectedType(type);
    setFormData(type);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this skill type?')) {
      try {
        await axios.delete(`http://localhost:5001/api/skill-types/${id}`);
        fetchTypes();
      } catch (error) {
        console.error('Error deleting skill type:', error);
      }
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Skill Type Dashboard</h1>
        </div>

        <div className="admin-form">
          <h2 className="form-full-width">{selectedType ? 'Edit Skill Type' : 'Create New Skill Type'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Type Name:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className="form-control" 
                  required 
                  placeholder="Enter skill type name..." 
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
                  placeholder="Describe this skill type..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="form-full-width">
              <button type="submit" className="btn btn-primary">
                {selectedType ? '✓ Update Type' : '+ Create Type'}
              </button>
              {selectedType && (
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedType(null);
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
          <h3>Skill Types ({types.length})</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.map(type => (
                <tr key={type.id}>
                  <td><strong>{type.name}</strong></td>
                  <td>{type.description}</td>
                  <td>
                    <button onClick={() => handleEdit(type)} className="btn btn-success">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(type.id)} className="btn btn-danger">
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {types.length === 0 && (
            <div className="no-data">
              <p>No skill types created yet. Create your first one above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillTypeDashboard; 