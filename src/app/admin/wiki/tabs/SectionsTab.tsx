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
import { SortableSection } from '../components/SortableSection';
import {
  useWikiSections,
  useCreateWikiSection,
  useUpdateWikiSection,
  useDeleteWikiSection,
  useReorderWikiSections,
} from '../../../hooks/queries/useWiki';
import { useToast } from '../../../contexts/ToastContext';
import type { WikiSection } from '@/services/wikiService';

interface SectionsTabProps {
  active: boolean;
}

export const SectionsTab: React.FC<SectionsTabProps> = ({ active }) => {
  const sectionsQuery = useWikiSections();
  const sections = sectionsQuery.data ?? [];

  const createSection = useCreateWikiSection();
  const updateSection = useUpdateWikiSection();
  const deleteSection = useDeleteWikiSection();
  const reorderSections = useReorderWikiSections();
  const { showSuccess, showError } = useToast();

  const submitting =
    createSection.isPending || updateSection.isPending;

  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    position: 0,
    isActive: true,
  });
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);

  const [activeDragId, setActiveDragId] = useState<string | number | null>(null);
  const [draggedSection, setDraggedSection] = useState<WikiSection | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const resetSectionForm = () => {
    setSectionForm({ name: '', description: '', position: 0, isActive: true });
    setEditingSectionId(null);
  };

  const handleSectionSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    try {
      if (editingSectionId) {
        await updateSection.mutateAsync({ id: editingSectionId, payload: sectionForm });
      } else {
        await createSection.mutateAsync(sectionForm);
      }
      showSuccess(`Section ${editingSectionId ? 'updated' : 'created'} successfully`);
      resetSectionForm();
    } catch (error) {
      console.error('Network error:', error);
      showError('Network error occurred');
    }
  };

  const handleEditSection = (section: WikiSection) => {
    setSectionForm({
      name: section.name,
      description: section.description || '',
      position: section.position,
      isActive: section.isActive,
    });
    setEditingSectionId(section.id);
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section? This will also delete all entries in this section.')) {
      return;
    }
    try {
      await deleteSection.mutateAsync(id);
      showSuccess('Section deleted successfully');
    } catch (error) {
      console.error('Network error:', error);
      showError('Network error occurred');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active: dragActive } = event;
    setActiveDragId(dragActive.id);
    const section = sections.find(s => s.id === dragActive.id);
    setDraggedSection(section || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active: dragActive, over } = event;

    setActiveDragId(null);
    setDraggedSection(null);

    if (!over || dragActive.id === over.id) {
      return;
    }

    const oldIndex = sections.findIndex(section => section.id === dragActive.id);
    const newIndex = sections.findIndex(section => section.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newSections = arrayMove(sections, oldIndex, newIndex);
    const sectionOrder = newSections.map((section, index) => ({
      id: section.id,
      position: index + 1,
    }));

    try {
      await reorderSections.mutateAsync(sectionOrder);
      showSuccess('Sections reordered successfully');
    } catch (error) {
      console.error('Error reordering sections:', error);
      showError('Failed to reorder sections');
    }
  };

  return (
    <div className="sections-tab" hidden={!active}>
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
                onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
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
                onChange={(e) => setSectionForm({ ...sectionForm, position: parseInt(e.target.value) })}
                min="0"
                placeholder="Display order"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={sectionForm.isActive}
                  onChange={(e) => setSectionForm({ ...sectionForm, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                className="form-input"
                value={sectionForm.description}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                placeholder="Section description"
                rows={3}
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editingSectionId ? 'Update Section' : 'Create Section')}
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
        <div className="drag-info">
          <small>Drag the ⋮⋮ handle to reorder sections</small>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="sections-container">
              {sections.map(section => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onEdit={handleEditSection}
                  onDelete={handleDeleteSection}
                  isDragging={activeDragId === section.id}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeDragId && draggedSection ? (
              <SortableSection
                section={draggedSection}
                onEdit={() => {}}
                onDelete={() => {}}
                isDragging={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};
