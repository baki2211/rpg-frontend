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

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'condition';
  description: string;
  duration: number;
  effects: Record<string, number>;
}

export const STATUS_EFFECTS: StatusEffect[] = [
  {
    id: 'blessed',
    name: 'Blessed',
    type: 'buff',
    description: 'Increased accuracy and damage',
    duration: 3,
    effects: { accuracy: 2, damage: 5 },
  },
  {
    id: 'cursed',
    name: 'Cursed',
    type: 'debuff',
    description: 'Decreased accuracy and damage',
    duration: 3,
    effects: { accuracy: -2, damage: -5 },
  },
  {
    id: 'poisoned',
    name: 'Poisoned',
    type: 'debuff',
    description: 'Takes damage over time',
    duration: 5,
    effects: { damagePerTurn: 3 },
  },
  {
    id: 'regenerating',
    name: 'Regenerating',
    type: 'buff',
    description: 'Heals over time',
    duration: 5,
    effects: { healingPerTurn: 5 },
  },
  {
    id: 'stunned',
    name: 'Stunned',
    type: 'condition',
    description: 'Cannot act for 1 turn',
    duration: 1,
    effects: { canAct: 0 },
  },
  {
    id: 'shielded',
    name: 'Shielded',
    type: 'buff',
    description: 'Reduced incoming damage',
    duration: 3,
    effects: { damageReduction: 50 },
  },
];
