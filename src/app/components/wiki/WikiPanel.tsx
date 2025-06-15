import React, { useState, useEffect } from 'react';
import './WikiPanel.css';
import { api } from '../../../services/apiClient';

interface WikiSection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  position: number;
  isActive: boolean;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WikiEntry {
  id: number;
  sectionId: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  tags: string[];
  isPublished: boolean;
  position: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  section?: {
    name: string;
    slug: string;
  };
}

interface WikiStats {
  totalSections: number;
  activeSections: number;
  totalEntries: number;
  publishedEntries: number;
  totalViews: number;
  popularTags: Array<{ tag: string; count: number }>;
}

export const WikiPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sections' | 'entries' | 'stats'>('sections');
  const [sections, setSections] = useState<WikiSection[]>([]);
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [stats, setStats] = useState<WikiStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Section form state
  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  
  // Entry form state
  const [entryForm, setEntryForm] = useState({
    sectionId: '',
    title: '',
    content: '',
    tags: '',
    isPublished: true
  });
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  useEffect(() => {
    fetchSections();
    fetchEntries();
    fetchStats();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await api.get<{success: boolean, data: WikiSection[]}>('/wiki/admin/sections');
      setSections(response.data.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await api.get<{success: boolean, data: WikiEntry[]}>('/wiki/admin/entries');
      setEntries(response.data.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get<{success: boolean, data: WikiStats}>('/wiki/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Section handlers
  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await (editingSectionId 
        ? api.put(`/wiki/admin/sections/${editingSectionId}`, sectionForm)
        : api.post('/wiki/admin/sections', sectionForm));

      showMessage('success', `Section ${editingSectionId ? 'updated' : 'created'} successfully`);
      resetSectionForm();
      fetchSections();
    } catch (error) {
      console.error('Network error:', error);
      showMessage('error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSection = (section: WikiSection) => {
    setSectionForm({
      name: section.name,
      description: section.description || '',
      isActive: section.isActive
    });
    setEditingSectionId(section.id);
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section? This will also delete all entries in this section.')) {
      return;
    }

    try {
      await api.delete(`/wiki/admin/sections/${id}`);
      showMessage('success', 'Section deleted successfully');
      fetchSections();
      fetchEntries();
    } catch (error) {
      console.error('Network error:', error);
      showMessage('error', 'Network error occurred');
    }
  };

  const resetSectionForm = () => {
    setSectionForm({ name: '', description: '', isActive: true });
    setEditingSectionId(null);
  };

  // Entry handlers
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const entryData = {
        ...entryForm,
        sectionId: parseInt(entryForm.sectionId),
        tags: entryForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
      await (editingEntryId 
        ? api.put(`/wiki/admin/entries/${editingEntryId}`, entryData)
        : api.post('/wiki/admin/entries', entryData));

      showMessage('success', `Entry ${editingEntryId ? 'updated' : 'created'} successfully`);
      resetEntryForm();
      fetchEntries();
      fetchStats();
    } catch (error) {
      console.error('Network error:', error);
      showMessage('error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (entry: WikiEntry) => {
    setEntryForm({
      sectionId: entry.sectionId.toString(),
      title: entry.title,
      content: entry.content,
      tags: entry.tags.join(', '),
      isPublished: entry.isPublished
    });
    setEditingEntryId(entry.id);
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      await api.delete(`/wiki/admin/entries/${id}`);
      showMessage('success', 'Entry deleted successfully');
      fetchEntries();
      fetchStats();
    } catch (error) {
      console.error('Network error:', error);
      showMessage('error', 'Network error occurred');
    }
  };

  const resetEntryForm = () => {
    setEntryForm({ sectionId: '', title: '', content: '', tags: '', isPublished: true });
    setEditingEntryId(null);
  };

  const filteredEntries = selectedSectionId 
    ? entries.filter(entry => entry.sectionId === selectedSectionId)
    : entries;

  return (
    <div className="wiki-panel">
      <div className="panel-header">
        <h2>Wiki Management</h2>
        <p>Manage wiki sections and entries for your RPG world</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="wiki-tabs">
        <button 
          className={`tab-button ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          Sections ({sections.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'entries' ? 'active' : ''}`}
          onClick={() => setActiveTab('entries')}
        >
          Entries ({entries.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      {activeTab === 'sections' && (
        <div className="sections-tab">
          <div className="create-form">
            <h3>{editingSectionId ? 'Edit Section' : 'Create New Section'}</h3>
            <form onSubmit={handleSectionSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Section Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({...sectionForm, name: e.target.value})}
                    required
                    placeholder="e.g., Races, Geography, History"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={sectionForm.isActive}
                      onChange={(e) => setSectionForm({...sectionForm, isActive: e.target.checked})}
                    />
                    Active
                  </label>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    className="form-input"
                    value={sectionForm.description}
                    onChange={(e) => setSectionForm({...sectionForm, description: e.target.value})}
                    placeholder="Brief description of this section"
                    rows={3}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingSectionId ? 'Update Section' : 'Create Section')}
                </button>
                {editingSectionId && (
                  <button type="button" className="btn btn-secondary" onClick={resetSectionForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="sections-list">
            <h3>Existing Sections</h3>
            {sections.length === 0 ? (
              <div className="empty-state">
                <p>No sections created yet. Create your first section above.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="wiki-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Entries</th>
                      <th>Status</th>
                      <th>Position</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((section) => (
                      <tr key={section.id}>
                        <td>
                          <strong>{section.name}</strong>
                          {section.description && (
                            <div className="description">{section.description}</div>
                          )}
                        </td>
                        <td><code>{section.slug}</code></td>
                        <td>{section.entryCount}</td>
                        <td>
                          <span className={`status-badge ${section.isActive ? 'active' : 'inactive'}`}>
                            {section.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>{section.position}</td>
                        <td className="actions">
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEditSection(section)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteSection(section.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'entries' && (
        <div className="entries-tab">
          <div className="entries-controls">
            <div className="section-filter">
              <label>Filter by Section:</label>
              <select 
                value={selectedSectionId || ''}
                onChange={(e) => setSelectedSectionId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">All Sections</option>
                {sections.map(section => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="create-form">
            <h3>{editingEntryId ? 'Edit Entry' : 'Create New Entry'}</h3>
            <form onSubmit={handleEntrySubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Section *</label>
                  <select
                    className="form-input"
                    value={entryForm.sectionId}
                    onChange={(e) => setEntryForm({...entryForm, sectionId: e.target.value})}
                    required
                  >
                    <option value="">Select a section</option>
                    {sections.filter(s => s.isActive).map(section => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={entryForm.isPublished}
                      onChange={(e) => setEntryForm({...entryForm, isPublished: e.target.checked})}
                    />
                    Published
                  </label>
                </div>
                <div className="form-group full-width">
                  <label>Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={entryForm.title}
                    onChange={(e) => setEntryForm({...entryForm, title: e.target.value})}
                    required
                    placeholder="Entry title"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Tags</label>
                  <input
                    type="text"
                    className="form-input"
                    value={entryForm.tags}
                    onChange={(e) => setEntryForm({...entryForm, tags: e.target.value})}
                    placeholder="Comma-separated tags (e.g., magic, combat, lore)"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Content *</label>
                  <textarea
                    className="form-input content-editor"
                    value={entryForm.content}
                    onChange={(e) => setEntryForm({...entryForm, content: e.target.value})}
                    required
                    placeholder="Write your wiki entry content here. Supports Markdown formatting."
                    rows={15}
                  />
                  <small>Supports Markdown formatting. An excerpt will be automatically generated.</small>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingEntryId ? 'Update Entry' : 'Create Entry')}
                </button>
                {editingEntryId && (
                  <button type="button" className="btn btn-secondary" onClick={resetEntryForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="entries-list">
            <h3>
              {selectedSectionId 
                ? `Entries in ${sections.find(s => s.id === selectedSectionId)?.name}`
                : 'All Entries'
              } ({filteredEntries.length})
            </h3>
            {filteredEntries.length === 0 ? (
              <div className="empty-state">
                <p>No entries found. Create your first entry above.</p>
              </div>
            ) : (
              <div className="entries-grid">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="entry-card">
                    <div className="entry-header">
                      <h4>{entry.title}</h4>
                      <div className="entry-meta">
                        <span className="section-name">{entry.section?.name}</span>
                        <span className={`status-badge ${entry.isPublished ? 'published' : 'draft'}`}>
                          {entry.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    {entry.excerpt && (
                      <p className="entry-excerpt">{entry.excerpt}</p>
                    )}
                    <div className="entry-tags">
                      {entry.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                    <div className="entry-stats">
                      <span>Views: {entry.viewCount}</span>
                      <span>Position: {entry.position}</span>
                    </div>
                    <div className="entry-actions">
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditEntry(entry)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="stats-tab">
          <h3>Wiki Statistics</h3>
          {stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Sections</h4>
                <div className="stat-value">{stats.totalSections}</div>
                <div className="stat-detail">({stats.activeSections} active)</div>
              </div>
              <div className="stat-card">
                <h4>Entries</h4>
                <div className="stat-value">{stats.totalEntries}</div>
                <div className="stat-detail">({stats.publishedEntries} published)</div>
              </div>
              <div className="stat-card">
                <h4>Total Views</h4>
                <div className="stat-value">{stats.totalViews.toLocaleString()}</div>
              </div>
              <div className="stat-card popular-tags">
                <h4>Popular Tags</h4>
                <div className="tags-list">
                  {stats.popularTags.slice(0, 10).map(({ tag, count }) => (
                    <div key={tag} className="tag-stat">
                      <span className="tag">{tag}</span>
                      <span className="count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="loading">Loading statistics...</div>
          )}
        </div>
      )}
    </div>
  );
}; 