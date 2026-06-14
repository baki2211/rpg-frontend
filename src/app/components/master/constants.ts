import type { CharacterHP } from './hooks/useCharacterHP';

export const TABS = [
  { key: 'logs', label: 'Logs' },
  { key: 'hp', label: 'HP Manager' },
  { key: 'status', label: 'Status Panel' },
  { key: 'combat', label: 'Combat' },
  { key: 'events', label: 'Events' },
] as const;

export type TabKey = (typeof TABS)[number]['key'];

export const HEALTH_COLOR: Record<CharacterHP['status'], string> = {
  healthy: '#4ade80',
  injured: '#fbbf24',
  critical: '#f87171',
  unconscious: '#6b7280',
};
