'use client';

import React, { useState, type SubmitEvent } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableEntry } from '../components/SortableEntry';
import { EntryItem } from '../components/EntryItem';
import { RichTextEditor } from '../components/RichTextEditor';
import {
  useWikiSections,
  useWikiEntries,
  useCreateWikiEntry,
  useUpdateWikiEntry,
  useDeleteWikiEntry,
  useReorderWikiEntries,
} from '../../../hooks/queries/useWiki';
import type { WikiEntry, ShowMessage } from '../types';

interface EntriesTabProps {
  active: boolean;
  showMessage: ShowMessage;
}

export const EntriesTab: React.FC<EntriesTabProps> = ({ active, showMessage }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [showHierarchy, setShowHierarchy] = useState(false);

  const sectionsQuery = useWikiSections();
  const sections = sectionsQuery.data ?? [];

  const entriesQuery = useWikiEntries({ selectedSectionId, hierarchical: showHierarchy });
  const entries = entriesQuery.data ?? [];

  const createEntry = useCreateWikiEntry();
  const updateEntry = useUpdateWikiEntry();
  const deleteEntry = useDeleteWikiEntry();
  const reorderEntries = useReorderWikiEntries();

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

  const [activeDragId, setActiveDragId] = useState<string | number | null>(null);
  const [draggedEntry, setDraggedEntry] = useState<WikiEntry | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

      showMessage('success', `Entry ${editingEntryId ? 'updated' : 'created'} successfully`);
      resetEntryForm();
    } catch (error) {
      console.error('Network error:', error);
      showMessage('error', 'Network error occurred');
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
      showMessage('success', 'Entry deleted successfully');
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active: dragActive } = event;
    setActiveDragId(dragActive.id);
    const entry = filteredEntries.find(e => e.id === dragActive.id);
    setDraggedEntry(entry || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active: dragActive, over } = event;

    setActiveDragId(null);
    setDraggedEntry(null);

    if (!over || dragActive.id === over.id) return;
    if (!selectedSectionId) return;

    const oldIndex = filteredEntries.findIndex(entry => entry.id === dragActive.id);
    const newIndex = filteredEntries.findIndex(entry => entry.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newEntries = arrayMove(filteredEntries, oldIndex, newIndex);
    const entryOrder = newEntries.map((entry, index) => ({
      id: entry.id,
      position: index + 1,
    }));

    try {
      await reorderEntries.mutateAsync({ sectionId: selectedSectionId, entryOrder });
      showMessage('success', 'Entries reordered successfully');
    } catch (error) {
      console.error('Error reordering entries:', error);
      showMessage('error', 'Failed to reorder entries');
    }
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
        {entriesQuery.isLoading ? (
          <div className="loading">Loading entries...</div>
        ) : (
          <div className="entries-container">
            {showHierarchy && selectedSectionId ? (
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
            ) : selectedSectionId ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredEntries.map(e => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="entries-flat">
                    {filteredEntries.map(entry => (
                      <SortableEntry
                        key={entry.id}
                        entry={entry}
                        onEdit={handleEditEntry}
                        onDelete={handleDeleteEntry}
                        onAddChild={handleAddChildEntry}
                        isDragging={activeDragId === entry.id}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeDragId && draggedEntry ? (
                    <SortableEntry
                      entry={draggedEntry}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onAddChild={() => {}}
                      isDragging={true}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <div className="entries-flat">
                {filteredEntries.map(entry => (
                  <div key={entry.id} className="entry-card">
                    <div className="entry-header">
                      <div className="entry-info">
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
  );
};
