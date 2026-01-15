'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { combatRoundsService, CombatRound, CombatAction } from '@/services/combatRoundsService';
import { useToast } from './ToastContext';

interface CombatRoundsContextValue {
  activeCombatRound: CombatRound | null;
  resolvedCombatRounds: CombatRound[];
  roundActions: CombatAction[];
  loading: boolean;
  error: string | null;
  fetchActiveCombatRound: (locationId: string) => Promise<CombatRound | null>;
  fetchResolvedCombatRounds: (locationId: string, limit?: number) => Promise<CombatRound[]>;
  createCombatRound: (locationId: number, eventId: number) => Promise<void>;
  resolveCombatRound: (roundId: number) => Promise<void>;
  cancelCombatRound: (roundId: number) => Promise<void>;
}

const CombatRoundsContext = createContext<CombatRoundsContextValue | undefined>(undefined);

export const useCombatRounds = (): CombatRoundsContextValue => {
  const context = useContext(CombatRoundsContext);
  if (!context) {
    throw new Error('useCombatRounds must be used within a CombatRoundsProvider');
  }
  return context;
};

interface CombatRoundsProviderProps {
  children: ReactNode;
}

const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return defaultMessage;
};

export const CombatRoundsProvider: React.FC<CombatRoundsProviderProps> = ({ children }) => {
  const [activeCombatRound, setActiveCombatRound] = useState<CombatRound | null>(null);
  const [resolvedCombatRounds, setResolvedCombatRounds] = useState<CombatRound[]>([]);
  const [roundActions, setRoundActions] = useState<CombatAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchActiveCombatRound = useCallback(async (locationId: string): Promise<CombatRound | null> => {
    try {
      setLoading(true);
      setError(null);
      const round = await combatRoundsService.getActiveCombatRound(locationId);
      setActiveCombatRound(round);
      if (round && round.actions) {
        setRoundActions(round.actions);
      } else {
        setRoundActions([]);
      }
      return round;
    } catch (err: unknown) {
      console.error('Error fetching active combat round:', err);
      setActiveCombatRound(null);
      setRoundActions([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResolvedCombatRounds = useCallback(async (locationId: string, limit = 5): Promise<CombatRound[]> => {
    try {
      setLoading(true);
      setError(null);
      const rounds = await combatRoundsService.getResolvedCombatRounds(locationId, limit);
      setResolvedCombatRounds(rounds);
      return rounds;
    } catch (err: unknown) {
      console.error('Error fetching resolved combat rounds:', err);
      setResolvedCombatRounds([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createCombatRound = useCallback(async (locationId: number, eventId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await combatRoundsService.createCombatRound({ locationId, eventId });
      if (result.success) {
        showSuccess('Combat round created successfully');
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to create combat round');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const resolveCombatRound = useCallback(async (roundId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await combatRoundsService.resolveCombatRound(roundId);
      if (result.success) {
        showSuccess('Combat round resolved successfully');
        setActiveCombatRound(null);
        setRoundActions([]);
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to resolve combat round');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const cancelCombatRound = useCallback(async (roundId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await combatRoundsService.cancelCombatRound(roundId);
      if (result.success) {
        showSuccess('Combat round cancelled');
        setActiveCombatRound(null);
        setRoundActions([]);
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to cancel combat round');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const value: CombatRoundsContextValue = {
    activeCombatRound,
    resolvedCombatRounds,
    roundActions,
    loading,
    error,
    fetchActiveCombatRound,
    fetchResolvedCombatRounds,
    createCombatRound,
    resolveCombatRound,
    cancelCombatRound,
  };

  return (
    <CombatRoundsContext.Provider value={value}>
      {children}
    </CombatRoundsContext.Provider>
  );
};
