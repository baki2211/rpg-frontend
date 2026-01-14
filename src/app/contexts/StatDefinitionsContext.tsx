'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { statDefinitionsService, StatDefinition } from '../../services/statDefinitionsService';
import { useToast } from './ToastContext';
import { getErrorMessage } from '../../utils/errorHandling';

interface StatDefinitionsContextValue {
  // State
  statDefinitions: StatDefinition[];
  primaryStats: StatDefinition[];
  loading: boolean;
  error: string | null;
  // Actions
  fetchStatDefinitions: (category?: string, activeOnly?: boolean) => Promise<StatDefinition[]>;
  fetchPrimaryStats: () => Promise<StatDefinition[]>;
}

const StatDefinitionsContext = createContext<StatDefinitionsContextValue | undefined>(undefined);

interface StatDefinitionsProviderProps {
  children: ReactNode;
}

export const StatDefinitionsProvider: React.FC<StatDefinitionsProviderProps> = ({ children }) => {
  const [statDefinitions, setStatDefinitions] = useState<StatDefinition[]>([]);
  const [primaryStats, setPrimaryStats] = useState<StatDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  const fetchStatDefinitions = useCallback(async (category?: string, activeOnly?: boolean): Promise<StatDefinition[]> => {
    try {
      setLoading(true);
      setError(null);
      const stats = await statDefinitionsService.getStatDefinitions(category, activeOnly);
      setStatDefinitions(stats);
      return stats;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch stat definitions');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchPrimaryStats = useCallback(async (): Promise<StatDefinition[]> => {
    try {
      setLoading(true);
      setError(null);
      const stats = await statDefinitionsService.getPrimaryStats();
      setPrimaryStats(stats);
      return stats;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch primary stats');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const value = useMemo<StatDefinitionsContextValue>(() => ({
    statDefinitions,
    primaryStats,
    loading,
    error,
    fetchStatDefinitions,
    fetchPrimaryStats,
  }), [
    statDefinitions,
    primaryStats,
    loading,
    error,
    fetchStatDefinitions,
    fetchPrimaryStats,
  ]);

  return (
    <StatDefinitionsContext.Provider value={value}>
      {children}
    </StatDefinitionsContext.Provider>
  );
};

export const useStatDefinitions = (): StatDefinitionsContextValue => {
  const context = useContext(StatDefinitionsContext);
  if (!context) {
    throw new Error('useStatDefinitions must be used within a StatDefinitionsProvider');
  }
  return context;
};
