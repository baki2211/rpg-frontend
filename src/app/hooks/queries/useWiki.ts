'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  wikiService,
  WikiSection,
  WikiEntry,
  WikiStats,
  WikiSectionPayload,
  WikiEntryPayload,
  SectionOrderItem,
  EntryOrderItem,
} from '../../../services/wikiService';

export const wikiQueryKeys = {
  all: ['wiki'] as const,
  sections: ['wiki', 'sections'] as const,
  entries: ['wiki', 'entries'] as const,
  entriesFlat: ['wiki', 'entries', 'flat'] as const,
  entriesHierarchical: (sectionId: number) =>
    ['wiki', 'entries', 'hierarchical', sectionId] as const,
  stats: ['wiki', 'stats'] as const,
};

export function useWikiSections() {
  return useQuery<WikiSection[]>({
    queryKey: wikiQueryKeys.sections,
    queryFn: () => wikiService.getSections(),
  });
}

interface UseWikiEntriesOptions {
  selectedSectionId: number | null;
  hierarchical: boolean;
}

export function useWikiEntries({ selectedSectionId, hierarchical }: UseWikiEntriesOptions) {
  const useHierarchical = Boolean(selectedSectionId && hierarchical);

  return useQuery<WikiEntry[]>({
    queryKey: useHierarchical
      ? wikiQueryKeys.entriesHierarchical(selectedSectionId as number)
      : wikiQueryKeys.entriesFlat,
    queryFn: () =>
      useHierarchical
        ? wikiService.getHierarchicalEntries(selectedSectionId as number)
        : wikiService.getEntries(),
  });
}

export function useWikiStats() {
  return useQuery<WikiStats>({
    queryKey: wikiQueryKeys.stats,
    queryFn: () => wikiService.getStats(),
  });
}

export function useCreateWikiSection() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, WikiSectionPayload>({
    mutationFn: (payload) => wikiService.createSection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.sections });
    },
  });
}

interface UpdateWikiSectionVariables {
  id: number;
  payload: WikiSectionPayload;
}

export function useUpdateWikiSection() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, UpdateWikiSectionVariables>({
    mutationFn: ({ id, payload }) => wikiService.updateSection(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.sections });
    },
  });
}

// Section delete cascades to entries on the backend, so invalidate entries +
// stats as well. The entries cache is only `['wiki', 'entries']`-prefixed —
// matches both flat and hierarchical queries.
export function useDeleteWikiSection() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => wikiService.deleteSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.sections });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.entries });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.stats });
    },
  });
}

interface ReorderContext<T> {
  previous: T | undefined;
}

export function useReorderWikiSections() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    unknown,
    SectionOrderItem[],
    ReorderContext<WikiSection[]>
  >({
    mutationFn: (sectionOrder) => wikiService.reorderSections(sectionOrder),
    onMutate: async (sectionOrder) => {
      await queryClient.cancelQueries({ queryKey: wikiQueryKeys.sections });
      const previous = queryClient.getQueryData<WikiSection[]>(wikiQueryKeys.sections);
      if (previous) {
        const positionById = new Map(sectionOrder.map((s) => [s.id, s.position]));
        const next = previous
          .map((section) => ({
            ...section,
            position: positionById.get(section.id) ?? section.position,
          }))
          .sort((a, b) => a.position - b.position);
        queryClient.setQueryData(wikiQueryKeys.sections, next);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(wikiQueryKeys.sections, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.sections });
    },
  });
}

export function useCreateWikiEntry() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, WikiEntryPayload>({
    mutationFn: (payload) => wikiService.createEntry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.entries });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.stats });
    },
  });
}

interface UpdateWikiEntryVariables {
  id: number;
  payload: WikiEntryPayload;
}

export function useUpdateWikiEntry() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, UpdateWikiEntryVariables>({
    mutationFn: ({ id, payload }) => wikiService.updateEntry(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.entries });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.stats });
    },
  });
}

export function useDeleteWikiEntry() {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, number>({
    mutationFn: (id) => wikiService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.entries });
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.stats });
    },
  });
}

interface ReorderEntriesVariables {
  sectionId: number;
  entryOrder: EntryOrderItem[];
}

// Reorder is only invoked from the flat-list view, so the cache to update
// optimistically is `entriesFlat`. We rewrite positions for the affected
// section's entries and re-sort that slice; entries from other sections keep
// their relative order. The `onSettled` invalidation also refreshes any
// hierarchical query currently sitting in cache.
export function useReorderWikiEntries() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    unknown,
    ReorderEntriesVariables,
    ReorderContext<WikiEntry[]>
  >({
    mutationFn: ({ sectionId, entryOrder }) =>
      wikiService.reorderEntries(sectionId, entryOrder),
    onMutate: async ({ sectionId, entryOrder }) => {
      await queryClient.cancelQueries({ queryKey: wikiQueryKeys.entriesFlat });
      const previous = queryClient.getQueryData<WikiEntry[]>(wikiQueryKeys.entriesFlat);
      if (previous) {
        const positionById = new Map(entryOrder.map((e) => [e.id, e.position]));
        const next = previous.map((entry) =>
          entry.sectionId === sectionId && positionById.has(entry.id)
            ? { ...entry, position: positionById.get(entry.id) as number }
            : entry
        );
        // Re-sort just the affected section so the flat list reflects the new order.
        const inSection = next
          .filter((e) => e.sectionId === sectionId)
          .sort((a, b) => a.position - b.position);
        const outOfSection = next.filter((e) => e.sectionId !== sectionId);
        queryClient.setQueryData(wikiQueryKeys.entriesFlat, [...outOfSection, ...inSection]);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(wikiQueryKeys.entriesFlat, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wikiQueryKeys.entries });
    },
  });
}
