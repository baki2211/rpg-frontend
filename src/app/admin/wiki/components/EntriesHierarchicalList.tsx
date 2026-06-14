'use client';

import React from 'react';
import { EntryItem } from './EntryItem';
import type { WikiEntry } from '@/services/wikiService';

interface Props {
  entries: WikiEntry[];
  onEdit: (entry: WikiEntry) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentEntry: WikiEntry) => void;
}

export const EntriesHierarchicalList: React.FC<Props> = ({ entries, onEdit, onDelete, onAddChild }) => (
  <div className="entries-hierarchical">
    {entries.map(entry => (
      <EntryItem
        key={entry.id}
        entry={entry}
        level={entry.level}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddChild={onAddChild}
      />
    ))}
  </div>
);
