'use client';

import React, { useState } from 'react';
import type { WikiEntry } from '../types';

export const EntryItem: React.FC<{
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
