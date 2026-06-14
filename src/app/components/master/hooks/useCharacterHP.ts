// TODO(backend): replace seed + apply with real HP endpoint
// (see docs/master_panel_split_plan.md "Data sources")
import { useCallback, useState } from 'react';
import type { ChatUser } from '@/app/hooks/queries/useChatUsers';

export interface CharacterHP {
  characterId: string;
  characterName: string;
  currentHP: number;
  maxHP: number;
  tempHP: number;
  status: 'healthy' | 'injured' | 'critical' | 'unconscious';
}

const getHealthStatus = (currentHP: number, maxHP: number): CharacterHP['status'] => {
  const percentage = (currentHP / maxHP) * 100;
  if (percentage <= 0) return 'unconscious';
  if (percentage <= 25) return 'critical';
  if (percentage <= 50) return 'injured';
  return 'healthy';
};

interface UseCharacterHPOptions {
  onApplyDamage?: (characterId: string, damage: number) => void;
  onApplyHealing?: (characterId: string, healing: number) => void;
}

const seed = (chatUsers: ChatUser[]): CharacterHP[] =>
  chatUsers.map((u) => ({
    characterId: u.userId,
    characterName: u.characterName || u.username,
    currentHP: 100,
    maxHP: 100,
    tempHP: 0,
    status: 'healthy',
  }));

export const useCharacterHP = (
  chatUsers: ChatUser[],
  { onApplyDamage, onApplyHealing }: UseCharacterHPOptions = {},
) => {
  const [characterHP, setCharacterHP] = useState<CharacterHP[]>([]);
  const [seededFrom, setSeededFrom] = useState<ChatUser[] | null>(null);

  // Reseed whenever chatUsers identity changes (matches the original
  // placeholder behaviour: in-progress HP deltas are dropped on the next
  // chatUsers update). Adjusting state during render — React-recommended
  // alternative to a setState-in-effect.
  if (chatUsers !== seededFrom && chatUsers.length > 0) {
    setSeededFrom(chatUsers);
    setCharacterHP(seed(chatUsers));
  }

  const applyDelta = useCallback(
    (characterId: string, delta: number) => {
      setCharacterHP((prev) =>
        prev.map((c) => {
          if (c.characterId !== characterId) return c;
          const newHP = Math.max(0, Math.min(c.maxHP, c.currentHP + delta));
          return { ...c, currentHP: newHP, status: getHealthStatus(newHP, c.maxHP) };
        }),
      );
      if (delta < 0) onApplyDamage?.(characterId, -delta);
      else if (delta > 0) onApplyHealing?.(characterId, delta);
    },
    [onApplyDamage, onApplyHealing],
  );

  return { characterHP, applyDelta };
};
