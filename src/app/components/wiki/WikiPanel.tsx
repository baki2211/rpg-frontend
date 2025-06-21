import React, { useState, useEffect, useRef } from 'react';
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
  parentEntryId?: number;
  level: number;
  createdAt: string;
  updatedAt: string;
  section?: {
    name: string;
    slug: string;
  };
  children?: WikiEntry[];
}

interface WikiStats {
  totalSections: number;
  activeSections: number;
  totalEntries: number;
  publishedEntries: number;
  totalViews: number;
  popularTags: Array<{ tag: string; count: number }>;
}

// Rich Text Toolbar Component
const RichTextToolbar: React.FC<{
  onFormat: (format: string, value?: string) => void;
}> = ({ onFormat }) => {
  return (
    <div className="rich-text-toolbar">
      <div className="toolbar-group">
        <button type="button" onClick={() => onFormat('bold')} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => onFormat('italic')} title="Italic (Ctrl+I)">
          <em>I</em>
        </button>
        <button type="button" onClick={() => onFormat('underline')} title="Underline (Ctrl+U)">
          <u>U</u>
        </button>
      </div>
      <div className="toolbar-group">
        <button type="button" onClick={() => onFormat('h1')} title="Heading 1">
          H1
        </button>
        <button type="button" onClick={() => onFormat('h2')} title="Heading 2">
          H2
        </button>
        <button type="button" onClick={() => onFormat('h3')} title="Heading 3">
          H3
        </button>
      </div>
      <div className="toolbar-group">
        <button type="button" onClick={() => onFormat('ul')} title="Bullet List">
          • List
        </button>
        <button type="button" onClick={() => onFormat('ol')} title="Numbered List">
          1. List
        </button>
        <button type="button" onClick={() => onFormat('blockquote')} title="Quote">
          &quot;
        </button>
      </div>
      <div className="toolbar-group">
        <button type="button" onClick={() => onFormat('code')} title="Inline Code">
          {'</>'}
        </button>
        <button type="button" onClick={() => onFormat('codeblock')} title="Code Block">
          {'```'}
        </button>
        <button type="button" onClick={() => onFormat('link')} title="Link">
          🔗
        </button>
      </div>
    </div>
  );
};

// Rich Text Editor Component
const RichTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}> = ({ value, onChange, placeholder = "Write your content here...", rows = 15 }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFormat = (format: string, customValue?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    let replacement = '';

    switch (format) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        break;
      case 'underline':
        replacement = `<u>${selectedText || 'underlined text'}</u>`;
        break;
      case 'h1':
        replacement = `# ${selectedText || 'Heading 1'}`;
        break;
      case 'h2':
        replacement = `## ${selectedText || 'Heading 2'}`;
        break;
      case 'h3':
        replacement = `### ${selectedText || 'Heading 3'}`;
        break;
      case 'ul':
        replacement = selectedText ? 
          selectedText.split('\n').map(line => `- ${line}`).join('\n') :
          '- List item';
        break;
      case 'ol':
        replacement = selectedText ? 
          selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n') :
          '1. List item';
        break;
      case 'blockquote':
        replacement = selectedText ? 
          selectedText.split('\n').map(line => `> ${line}`).join('\n') :
          '> Quote text';
        break;
      case 'code':
        replacement = `\`${selectedText || 'code'}\``;
        break;
      case 'codeblock':
        replacement = `\`\`\`\n${selectedText || 'code block'}\n\`\`\``;
        break;
      case 'link':
        const url = customValue || prompt('Enter URL:') || 'https://example.com';
        replacement = `[${selectedText || 'link text'}](${url})`;
        break;
      default:
        return;
    }

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    // Set cursor position after the replacement
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          handleFormat('underline');
          break;
      }
    }
  };

  return (
    <div className="rich-text-editor">
      <RichTextToolbar onFormat={handleFormat} />
      <textarea
        ref={textareaRef}
        className="form-input content-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
      />
      <small>Supports Markdown formatting. Use the toolbar buttons or keyboard shortcuts.</small>
    </div>
  );
};

// Nested Entry Item Component
const EntryItem: React.FC<{
  entry: WikiEntry;
  level: number;
  onEdit: (entry: WikiEntry) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentEntry: WikiEntry) => void;
}> = ({ entry, level, onEdit, onDelete, onAddChild }) => {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = entry.children && entry.children.length > 0;

  return (
    <div className={`entry-item level-${level}`}>
      <div className="entry-header">
        <div className="entry-info">
          {hasChildren && (
            <button
              className="collapse-toggle"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? "+" : "-"}
            </button>
          )}
          <span className="entry-title">{entry.title}</span>
          <span className="entry-meta">
            Level {entry.level} • {entry.isPublished ? 'Published' : 'Draft'} • {entry.viewCount} views
          </span>
        </div>
        <div className="entry-actions">
          {level < 4 && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => onAddChild(entry)}
              title="Add Sub-Entry"
            >
              + Sub
            </button>
          )}
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onEdit(entry)}
          >
            Edit
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onDelete(entry.id)}
          >
            Delete
          </button>
        </div>
      </div>
      
      {hasChildren && !collapsed && (
        <div className="entry-children">
          {entry.children!.map(child => (
            <EntryItem
              key={child.id}
              entry={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

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
    position: 0,
    isActive: true
  });
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  
  // Entry form state
  const [entryForm, setEntryForm] = useState({
    sectionId: '',
    title: '',
    content: '',
    tags: '',
    isPublished: true,
    parentEntryId: ''
  });
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [showHierarchy, setShowHierarchy] = useState(false);

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
      if (selectedSectionId && showHierarchy) {
        const response = await api.get<{success: boolean, data: WikiEntry[]}>(`/wiki/admin/sections/${selectedSectionId}/entries/hierarchical`);
        setEntries(response.data.data);
      } else {
        const response = await api.get<{success: boolean, data: WikiEntry[]}>('/wiki/admin/entries');
        setEntries(response.data.data);
      }
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
      position: section.position,
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
    setSectionForm({ name: '', description: '', position: 0, isActive: true });
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
        parentEntryId: entryForm.parentEntryId ? parseInt(entryForm.parentEntryId) : null,
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
      isPublished: entry.isPublished,
      parentEntryId: entry.parentEntryId?.toString() || ''
    });
    setEditingEntryId(entry.id);
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry? This will also delete all sub-entries.')) {
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

  const handleAddChildEntry = (parentEntry: WikiEntry) => {
    setEntryForm({
      sectionId: parentEntry.sectionId.toString(),
      title: '',
      content: '',
      tags: '',
      isPublished: true,
      parentEntryId: parentEntry.id.toString()
    });
    setEditingEntryId(null);
  };

  const resetEntryForm = () => {
    setEntryForm({ 
      sectionId: '', 
      title: '', 
      content: '', 
      tags: '', 
      isPublished: true,
      parentEntryId: ''
    });
    setEditingEntryId(null);
  };

  // Get entries for the selected section (filtered or hierarchical)
  const filteredEntries = selectedSectionId 
    ? (entries || []).filter(entry => entry.sectionId === selectedSectionId)
    : (entries || []);

  // Get available parent entries for the current section
  const getAvailableParentEntries = (sectionId: string) => {
    return (entries || [])
      .filter(entry => 
        entry.sectionId === parseInt(sectionId) && 
        entry.level < 4 &&
        entry.id !== editingEntryId // Don't allow self as parent
      )
      .sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));
  };

  return (
    <div className="wiki-panel">
      <div className="panel-header">
        <h2>Wiki Management</h2>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'sections' ? 'active' : ''}`}
            onClick={() => setActiveTab('sections')}
          >
            Sections
          </button>
          <button
            className={`tab ${activeTab === 'entries' ? 'active' : ''}`}
            onClick={() => setActiveTab('entries')}
          >
            Entries
          </button>
          <button
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {activeTab === 'sections' && (
        <div className="sections-tab">
          <div className="create-form">
            <h3>{editingSectionId ? 'Edit Section' : 'Create New Section'}</h3>
            <form onSubmit={handleSectionSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({...sectionForm, name: e.target.value})}
                    required
                    placeholder="Section name"
                  />
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="number"
                    className="form-input"
                    value={sectionForm.position}
                    onChange={(e) => setSectionForm({...sectionForm, position: parseInt(e.target.value)})}
                    min="0"
                    placeholder="Display order"
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
                    placeholder="Section description"
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
            <h3>Sections</h3>
            <div className="sections-container">
              {(sections || []).map(section => (
                <div key={section.id} className="section-card">
                  <div className="section-header">
                    <h4>{section.name}</h4>
                    <div className="section-meta">
                      <span className={`status ${section.isActive ? 'active' : 'inactive'}`}>
                        {section.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="entry-count">{section.entryCount} entries</span>
                      <span className="position">Position: {section.position}</span>
                    </div>
                  </div>
                  {section.description && (
                    <div className="section-description">
                      {section.description}
                    </div>
                  )}
                  <div className="section-actions">
                    <button
                      className="btn btn-sm btn-primary"
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
                  </div>
                </div>
              ))}
            </div>
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
                onChange={(e) => {
                  const sectionId = e.target.value ? parseInt(e.target.value) : null;
                  setSelectedSectionId(sectionId);
                  if (sectionId) {
                    fetchEntries();
                  }
                }}
              >
                <option value="">All Sections</option>
                {(sections || []).map(section => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </div>
            {selectedSectionId && (
              <div className="view-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={showHierarchy}
                    onChange={(e) => {
                      setShowHierarchy(e.target.checked);
                      fetchEntries();
                    }}
                  />
                  Show Hierarchy
                </label>
              </div>
            )}
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
                    {(sections || []).filter(s => s.isActive).map(section => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                </div>
                
                {entryForm.sectionId && (
                  <div className="form-group">
                    <label>Parent Entry (Optional)</label>
                    <select
                      className="form-input"
                      value={entryForm.parentEntryId}
                      onChange={(e) => setEntryForm({...entryForm, parentEntryId: e.target.value})}
                    >
                      <option value="">None (Root Entry)</option>
                      {getAvailableParentEntries(entryForm.sectionId).map(entry => (
                        <option key={entry.id} value={entry.id}>
                          {'  '.repeat(entry.level - 1)}L{entry.level}: {entry.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
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
                  <RichTextEditor
                    value={entryForm.content}
                    onChange={(value) => setEntryForm({...entryForm, content: value})}
                    placeholder="Write your wiki entry content here. Supports Markdown formatting."
                    rows={15}
                  />
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
            <h3>Entries</h3>
            {loading ? (
              <div className="loading">Loading entries...</div>
            ) : (
              <div className="entries-container">
                {showHierarchy && selectedSectionId ? (
                  // Hierarchical view
                  <div className="entries-hierarchical">
                    {filteredEntries.map(entry => (
                      <EntryItem
                        key={entry.id}
                        entry={entry}
                        level={entry.level}
                        onEdit={handleEditEntry}
                        onDelete={handleDeleteEntry}
                        onAddChild={handleAddChildEntry}
                      />
                    ))}
                  </div>
                ) : (
                  // Flat list view
                  <div className="entries-flat">
                    {filteredEntries.map(entry => (
                      <div key={entry.id} className="entry-card">
                        <div className="entry-header">
                          <h4>{entry.title}</h4>
                          <div className="entry-meta">
                            {entry.section && <span className="section-name">{entry.section.name}</span>}
                            {entry.level > 1 && <span className="level-indicator">Level {entry.level}</span>}
                            <span className={`status ${entry.isPublished ? 'published' : 'draft'}`}>
                              {entry.isPublished ? 'Published' : 'Draft'}
                            </span>
                            <span className="views">{entry.viewCount} views</span>
                          </div>
                        </div>
                        <div className="entry-excerpt">
                          {entry.excerpt || 'No excerpt available'}
                        </div>
                        <div className="entry-tags">
                          {entry.tags.map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                        <div className="entry-actions">
                          {entry.level < 4 && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleAddChildEntry(entry)}
                            >
                              Add Sub-Entry
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-primary"
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
                {filteredEntries.length === 0 && (
                  <div className="no-entries">
                    {selectedSectionId ? 'No entries found for this section.' : 'No entries found.'}
                  </div>
                )}
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
                <div className="stat-number">{stats.totalSections}</div>
                <div className="stat-detail">{stats.activeSections} active</div>
              </div>
              <div className="stat-card">
                <h4>Entries</h4>
                <div className="stat-number">{stats.totalEntries}</div>
                <div className="stat-detail">{stats.publishedEntries} published</div>
              </div>
              <div className="stat-card">
                <h4>Total Views</h4>
                <div className="stat-number">{stats.totalViews}</div>
              </div>
              <div className="stat-card">
                <h4>Popular Tags</h4>
                <div className="popular-tags">
                  {stats.popularTags.slice(0, 10).map(({ tag, count }) => (
                    <div key={tag} className="tag-stat">
                      <span className="tag">{tag}</span>
                      <span className="count">({count})</span>
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