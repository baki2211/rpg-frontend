'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { WikiSection } from '../types';

export const SortableSection: React.FC<{
  section: WikiSection;
  onEdit: (section: WikiSection) => void;
  onDelete: (id: number) => void;
  isDragging?: boolean;
}> = ({ section, onEdit, onDelete, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`section-card ${isDragging || isSortableDragging ? 'dragging' : ''}`}
    >
      <div className="section-header">
        <div className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">
          ⋮⋮
        </div>
        <div className="section-info">
          <h4>{section.name}</h4>
          <div className="section-meta">
            <span className={`status ${section.isActive ? 'active' : 'inactive'}`}>
              {section.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="entry-count">{section.entryCount} entries</span>
            <span className="position">Position: {section.position}</span>
          </div>
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
          onClick={() => onEdit(section)}
        >
          Edit
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => onDelete(section.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
