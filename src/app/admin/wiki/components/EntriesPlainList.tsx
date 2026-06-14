'use client';

import React from 'react';
import type { WikiEntry } from '@/services/wikiService';

interface Props {
  entries: WikiEntry[];
  onEdit: (entry: WikiEntry) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentEntry: WikiEntry) => void;
}

export const EntriesPlainList: React.FC<Props> = ({ entries, onEdit, onDelete, onAddChild }) => (
  <div className="entries-flat">
    {entries.map(entry => (
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
              onClick={() => onAddChild(entry)}
            >
              Add Sub-Entry
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
    ))}
  </div>
);
