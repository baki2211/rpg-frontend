'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { masteryTiersService, MasteryTier } from '../../services/masteryTiersService';
import { useToast } from './ToastContext';
import { getErrorMessage } from '../../utils/errorHandling';

interface MasteryTiersContextValue {
  // State
  tiers: MasteryTier[];
  loading: boolean;
  error: string | null;
  // Actions
  fetchTiers: () => Promise<MasteryTier[]>;
  createTier: (tierData: Partial<MasteryTier>) => Promise<MasteryTier>;
  updateTier: (id: number, updateData: Partial<MasteryTier>) => Promise<MasteryTier>;
  deleteTier: (id: number) => Promise<void>;
  initializeDefaults: () => Promise<{ createdTiers: number }>;
}

const MasteryTiersContext = createContext<MasteryTiersContextValue | undefined>(undefined);

interface MasteryTiersProviderProps {
  children: ReactNode;
}

export const MasteryTiersProvider: React.FC<MasteryTiersProviderProps> = ({ children }) => {
  const [tiers, setTiers] = useState<MasteryTier[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchTiers = useCallback(async (): Promise<MasteryTier[]> => {
    try {
      setLoading(true);
      setError(null);
      const data = await masteryTiersService.getTiers();
      setTiers(data);
      return data;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch mastery tiers');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const createTier = useCallback(async (tierData: Partial<MasteryTier>): Promise<MasteryTier> => {
    try {
      setLoading(true);
      setError(null);
      const newTier = await masteryTiersService.createTier(tierData);
      showSuccess('Mastery tier created successfully');
      // Refresh the tiers list
      await fetchTiers();
      return newTier;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to create mastery tier');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, fetchTiers]);

  const updateTier = useCallback(async (id: number, updateData: Partial<MasteryTier>): Promise<MasteryTier> => {
    try {
      setLoading(true);
      setError(null);
      const updatedTier = await masteryTiersService.updateTier(id, updateData);
      showSuccess('Mastery tier updated successfully');
      // Refresh the tiers list
      await fetchTiers();
      return updatedTier;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to update mastery tier');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, fetchTiers]);

  const deleteTier = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await masteryTiersService.deleteTier(id);
      showSuccess('Mastery tier deleted successfully');
      // Refresh the tiers list
      await fetchTiers();
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to delete mastery tier');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, fetchTiers]);

  const initializeDefaults = useCallback(async (): Promise<{ createdTiers: number }> => {
    try {
      setLoading(true);
      setError(null);
      const result = await masteryTiersService.initializeDefaults();
      showSuccess(`Initialized ${result.createdTiers} default tiers`);
      // Refresh the tiers list
      await fetchTiers();
      return result;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to initialize default tiers');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, fetchTiers]);

  const value: MasteryTiersContextValue = {
    tiers,
    loading,
    error,
    fetchTiers,
    createTier,
    updateTier,
    deleteTier,
    initializeDefaults,
  };

  return (
    <MasteryTiersContext.Provider value={value}>
      {children}
    </MasteryTiersContext.Provider>
  );
};

export const useMasteryTiers = (): MasteryTiersContextValue => {
  const context = useContext(MasteryTiersContext);
  if (context === undefined) {
    throw new Error('useMasteryTiers must be used within a MasteryTiersProvider');
  }
  return context;
};
