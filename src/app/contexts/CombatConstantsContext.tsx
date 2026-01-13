'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { combatConstantsService, CombatConstant, ConstantsByCategory } from '../../services/combatConstantsService';
import { useToast } from './ToastContext';
import { getErrorMessage } from '../../utils/errorHandling';

interface CombatConstantsContextValue {
  // State
  constants: ConstantsByCategory;
  loading: boolean;
  error: string | null;
  // Actions
  fetchConstants: () => Promise<ConstantsByCategory>;
  updateConstant: (id: number, value: number) => Promise<CombatConstant>;
  initializeDefaults: () => Promise<{ createdConstants: number }>;
}

const CombatConstantsContext = createContext<CombatConstantsContextValue | undefined>(undefined);

interface CombatConstantsProviderProps {
  children: ReactNode;
}

export const CombatConstantsProvider: React.FC<CombatConstantsProviderProps> = ({ children }) => {
  const [constants, setConstants] = useState<ConstantsByCategory>({
    hp_system: [],
    aether_system: [],
    damage_system: [],
    mastery_system: [],
    outcome_system: []
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchConstants = useCallback(async (): Promise<ConstantsByCategory> => {
    try {
      setLoading(true);
      setError(null);
      const data = await combatConstantsService.getConstantsByCategory();
      setConstants(data);
      return data;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch combat constants');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const updateConstant = useCallback(async (id: number, value: number): Promise<CombatConstant> => {
    try {
      setLoading(true);
      setError(null);
      const updatedConstant = await combatConstantsService.updateConstant(id, value);
      showSuccess('Combat constant updated successfully');
      // Refresh the constants list
      await fetchConstants();
      return updatedConstant;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to update combat constant');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, fetchConstants]);

  const initializeDefaults = useCallback(async (): Promise<{ createdConstants: number }> => {
    try {
      setLoading(true);
      setError(null);
      const result = await combatConstantsService.initializeDefaults();
      showSuccess(`Initialized ${result.createdConstants} default constants`);
      // Refresh the constants list
      await fetchConstants();
      return result;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to initialize default constants');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, fetchConstants]);

  const value: CombatConstantsContextValue = {
    constants,
    loading,
    error,
    fetchConstants,
    updateConstant,
    initializeDefaults,
  };

  return (
    <CombatConstantsContext.Provider value={value}>
      {children}
    </CombatConstantsContext.Provider>
  );
};

export const useCombatConstants = (): CombatConstantsContextValue => {
  const context = useContext(CombatConstantsContext);
  if (context === undefined) {
    throw new Error('useCombatConstants must be used within a CombatConstantsProvider');
  }
  return context;
};
