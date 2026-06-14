'use client';

import React, { useState, type SubmitEvent } from 'react';
import { RichTextEditor } from '@/app/admin/wiki/components/RichTextEditor';
import { EntriesHierarchicalList } from '@/app/admin/wiki/components/EntriesHierarchicalList';
import { EntriesSortableList } from '@/app/admin/wiki/components/EntriesSortableList';
import { EntriesPlainList } from '@/app/admin/wiki/components/EntriesPlainList';
import {
  useWikiSections,
  useWikiEntries,
  useCreateWikiEntry,
  useUpdateWikiEntry,
  useDeleteWikiEntry,
} from '@/app/hooks/queries/useWiki';
import { useToast } from '@/app/contexts/ToastContext';
import type { WikiEntry } from '@/services/wikiService';

interface EntriesTabProps {
  active: boolean;
}

export const EntriesTab: React.FC<EntriesTabProps> = ({ active }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [showHierarchy, setShowHierarchy] = useState(false);

  const sectionsQuery = useWikiSections();
  const sections = sectionsQuery.data ?? [];

  const entriesQuery = useWikiEntries({ selectedSectionId, hierarchical: showHierarchy });
  const entries = entriesQuery.data ?? [];

  const createEntry = useCreateWikiEntry();
  const updateEntry = useUpdateWikiEntry();
  const deleteEntry = useDeleteWikiEntry();
  const { showSuccess, showError } = useToast();

  const submitting = createEntry.isPending || updateEntry.isPending;

  const [entryForm, setEntryForm] = useState({
    sectionId: '',
    title: '',
    content: '',
    tags: '',
    isPublished: true,
    parentEntryId: '',
  });
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);

  const resetEntryForm = () => {
    setEntryForm({
      sectionId: '',
      title: '',
      content: '',
      tags: '',
      isPublished: true,
      parentEntryId: '',
    });
    setEditingEntryId(null);
  };

  const handleEntrySubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    try {
      const payload = {
        sectionId: parseInt(entryForm.sectionId),
        title: entryForm.title,
        content: entryForm.content,
        tags: entryForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isPublished: entryForm.isPublished,
        parentEntryId: entryForm.parentEntryId ? parseInt(entryForm.parentEntryId) : null,
      };

      if (editingEntryId) {
        await updateEntry.mutateAsync({ id: editingEntryId, payload });
      } else {
        await createEntry.mutateAsync(payload);
      }

      showSuccess(`Entry ${editingEntryId ? 'updated' : 'created'} successfully`);
      resetEntryForm();
    } catch (error) {
      console.error('Network error:', error);
      showError('Network error occurred');
    }
  };

  const handleEditEntry = (entry: WikiEntry) => {
    setEntryForm({
      sectionId: entry.sectionId.toString(),
      title: entry.title,
      content: entry.content,
      tags: entry.tags.join(', '),
      isPublished: entry.isPublished,
      parentEntryId: entry.parentEntryId?.toString() || '',
    });
    setEditingEntryId(entry.id);
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry? This will also delete all sub-entries.')) {
      return;
    }
    try {
      await deleteEntry.mutateAsync(id);
      showSuccess('Entry deleted successfully');
    } catch (error) {
      console.error('Network error:', error);
      showError('Network error occurred');
    }
  };

  const handleAddChildEntry = (parentEntry: WikiEntry) => {
    setEntryForm({
      sectionId: parentEntry.sectionId.toString(),
      title: '',
      content: '',
      tags: '',
      isPublished: true,
      parentEntryId: parentEntry.id.toString(),
    });
    setEditingEntryId(null);
  };

  const filteredEntries = selectedSectionId
    ? entries.filter(entry => entry.sectionId === selectedSectionId)
    : entries;

  const getAvailableParentEntries = (sectionId: string) => {
    return entries
      .filter(entry =>
        entry.sectionId === parseInt(sectionId) &&
        entry.level < 4 &&
        entry.id !== editingEntryId
      )
      .sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));
  };

  const renderEntries = () => {
    if (entriesQuery.isLoading) {
      return <div className="loading">Loading entries...</div>;
    }
    if (filteredEntries.length === 0) {
      return (
        <div className="entries-container">
          <div className="no-entries">
            {selectedSectionId ? 'No entries found for this section.' : 'No entries found.'}
          </div>
        </div>
      );
    }
    return (
      <div className="entries-container">
        {showHierarchy && selectedSectionId ? (
          <EntriesHierarchicalList
            entries={filteredEntries}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            onAddChild={handleAddChildEntry}
          />
        ) : selectedSectionId ? (
          <EntriesSortableList
            entries={filteredEntries}
            sectionId={selectedSectionId}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            onAddChild={handleAddChildEntry}
          />
        ) : (
          <EntriesPlainList
            entries={filteredEntries}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            onAddChild={handleAddChildEntry}
          />
        )}
      </div>
    );
  };

  return (
    <div className="entries-tab" hidden={!active}>
      <div className="entries-controls">
        <div className="section-filter">
          <label>Filter by Section:</label>
          <select
            value={selectedSectionId || ''}
            onChange={(e) => {
              const sectionId = e.target.value ? parseInt(e.target.value) : null;
              setSelectedSectionId(sectionId);
            }}
          >
            <option value="">All Sections</option>
            {sections.map(section => (
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
                onChange={(e) => setShowHierarchy(e.target.checked)}
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
                onChange={(e) => setEntryForm({ ...entryForm, sectionId: e.target.value })}
                required
              >
                <option value="">Select a section</option>
                {sections.filter(s => s.isActive).map(section => (
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
                  onChange={(e) => setEntryForm({ ...entryForm, parentEntryId: e.target.value })}
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
                  onChange={(e) => setEntryForm({ ...entryForm, isPublished: e.target.checked })}
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
                onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
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
                onChange={(e) => setEntryForm({ ...entryForm, tags: e.target.value })}
                placeholder="Comma-separated tags (e.g., magic, combat, lore)"
              />
            </div>

            <div className="form-group full-width">
              <label>Content *</label>
              <RichTextEditor
                value={entryForm.content}
                onChange={(value) => setEntryForm({ ...entryForm, content: value })}
                placeholder="Write your wiki entry content here. Supports Markdown formatting."
                rows={15}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editingEntryId ? 'Update Entry' : 'Create Entry')}
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
        {selectedSectionId && !showHierarchy && (
          <div className="drag-info">
            <small>Drag the ⋮⋮ handle to reorder entries within this section</small>
          </div>
        )}
        {showHierarchy && (
          <div className="drag-info">
            <small>Reordering is only available in flat list view</small>
          </div>
        )}
        {!selectedSectionId && (
          <div className="drag-info">
            <small>Select a section to enable entry reordering</small>
          </div>
        )}
        {renderEntries()}
      </div>
    </div>
  );
};
