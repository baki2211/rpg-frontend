'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { npcService, NPC, ActiveCharacter } from '../../services/npcService';
import { useToast } from './ToastContext';
import { getErrorMessage } from '../../utils/errorHandling';

interface NPCContextValue {
  // State
  availableNPCs: NPC[];
  activeCharacter: ActiveCharacter | null;
  loading: boolean;
  error: string | null;
  // Actions
  fetchAvailableNPCs: () => Promise<NPC[]>;
  fetchActiveCharacter: () => Promise<ActiveCharacter | null>;
  activateNPC: (npcId: number) => Promise<void>;
  deactivateNPC: (characterId: number) => Promise<void>;
  refreshNPCData: () => Promise<void>;
}

const NPCContext = createContext<NPCContextValue | undefined>(undefined);

interface NPCProviderProps {
  children: ReactNode;
}

export const NPCProvider: React.FC<NPCProviderProps> = ({ children }) => {
  const [availableNPCs, setAvailableNPCs] = useState<NPC[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<ActiveCharacter | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchAvailableNPCs = useCallback(async (): Promise<NPC[]> => {
    try {
      setLoading(true);
      setError(null);
      const npcs = await npcService.getAvailableNPCs();
      setAvailableNPCs(npcs);
      return npcs;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch available NPCs');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchActiveCharacter = useCallback(async (): Promise<ActiveCharacter | null> => {
    try {
      setLoading(true);
      setError(null);
      const character = await npcService.getActiveCharacter();
      setActiveCharacter(character);
      return character;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch active character');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const activateNPC = useCallback(async (npcId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await npcService.activateNPC(npcId);
      showSuccess('NPC activated successfully');
      // Refresh data after activation
      await Promise.all([fetchAvailableNPCs(), fetchActiveCharacter()]);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to activate NPC');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, fetchAvailableNPCs, fetchActiveCharacter]);

  const deactivateNPC = useCallback(async (characterId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await npcService.deactivateNPC(characterId);
      showSuccess('NPC deactivated successfully');
      // Refresh data after deactivation
      await Promise.all([fetchAvailableNPCs(), fetchActiveCharacter()]);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to deactivate NPC');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, fetchAvailableNPCs, fetchActiveCharacter]);

  const refreshNPCData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchAvailableNPCs(), fetchActiveCharacter()]);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to refresh NPC data');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAvailableNPCs, fetchActiveCharacter, showError]);

  const value = useMemo<NPCContextValue>(() => ({
    availableNPCs,
    activeCharacter,
    loading,
    error,
    fetchAvailableNPCs,
    fetchActiveCharacter,
    activateNPC,
    deactivateNPC,
    refreshNPCData,
  }), [
    availableNPCs,
    activeCharacter,
    loading,
    error,
    fetchAvailableNPCs,
    fetchActiveCharacter,
    activateNPC,
    deactivateNPC,
    refreshNPCData,
  ]);

  return (
    <NPCContext.Provider value={value}>
      {children}
    </NPCContext.Provider>
  );
};

export const useNPC = (): NPCContextValue => {
  const context = useContext(NPCContext);
  if (!context) {
    throw new Error('useNPC must be used within an NPCProvider');
  }
  return context;
};
