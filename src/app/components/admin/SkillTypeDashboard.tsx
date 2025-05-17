import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
    try {
      await axios.delete(`http://localhost:5001/api/skill-types/${id}`);
      fetchTypes();
    } catch (error) {
      console.error('Error deleting skill type:', error);
    }
  };

  return (
    <div>
      <h2>Skill Type Dashboard</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div>
          <label>Description:</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange} required />
        </div>
        <button type="submit">{selectedType ? 'Update Type' : 'Create Type'}</button>
      </form>

      <h3>Types List</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {types.map(type => (
            <tr key={type.id}>
              <td>{type.name}</td>
              <td>{type.description}</td>
              <td>
                <button onClick={() => handleEdit(type)}>Edit</button>
                <button onClick={() => handleDelete(type.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkillTypeDashboard; 