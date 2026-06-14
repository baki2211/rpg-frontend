'use client';

import React, { useState } from 'react';
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
import { SortableEntry } from './SortableEntry';
import { useReorderWikiEntries } from '@/app/hooks/queries/useWiki';
import { useToast } from '@/app/contexts/ToastContext';
import type { WikiEntry } from '@/services/wikiService';

interface Props {
  entries: WikiEntry[];
  sectionId: number;
  onEdit: (entry: WikiEntry) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentEntry: WikiEntry) => void;
}

export const EntriesSortableList: React.FC<Props> = ({ entries, sectionId, onEdit, onDelete, onAddChild }) => {
  const reorderEntries = useReorderWikiEntries();
  const { showSuccess, showError } = useToast();

  const [activeDragId, setActiveDragId] = useState<string | number | null>(null);
  const [draggedEntry, setDraggedEntry] = useState<WikiEntry | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveDragId(active.id);
    setDraggedEntry(entries.find(e => e.id === active.id) ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveDragId(null);
    setDraggedEntry(null);

    if (!over || active.id === over.id) return;

    const oldIndex = entries.findIndex(entry => entry.id === active.id);
    const newIndex = entries.findIndex(entry => entry.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const entryOrder = arrayMove(entries, oldIndex, newIndex).map((entry, index) => ({
      id: entry.id,
      position: index + 1,
    }));

    try {
      await reorderEntries.mutateAsync({ sectionId, entryOrder });
      showSuccess('Entries reordered successfully');
    } catch (error) {
      console.error('Error reordering entries:', error);
      showError('Failed to reorder entries');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={entries.map(e => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="entries-flat">
          {entries.map(entry => (
            <SortableEntry
              key={entry.id}
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
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
  );
};
