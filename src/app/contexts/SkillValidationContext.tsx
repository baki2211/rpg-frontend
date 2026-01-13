'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { skillValidationService, SkillValidationRule, SkillTypesByCategory } from '../../services/skillValidationService';
import { useToast } from './ToastContext';
import { getErrorMessage } from '../../utils/errorHandling';

interface SkillValidationContextValue {
  // State
  rules: SkillTypesByCategory;
  loading: boolean;
  error: string | null;
  // Actions
  fetchRules: () => Promise<SkillTypesByCategory>;
  updateRule: (id: number, updateData: Partial<SkillValidationRule>) => Promise<SkillValidationRule>;
  initializeDefaults: () => Promise<{ createdRules: number }>;
}

const SkillValidationContext = createContext<SkillValidationContextValue | undefined>(undefined);

interface SkillValidationProviderProps {
  children: ReactNode;
}

export const SkillValidationProvider: React.FC<SkillValidationProviderProps> = ({ children }) => {
  const [rules, setRules] = useState<SkillTypesByCategory>({
    attack: [],
    defence: [],
    counter: [],
    buff_debuff: [],
    healing: []
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchRules = useCallback(async (): Promise<SkillTypesByCategory> => {
    try {
      setLoading(true);
      setError(null);
      const data = await skillValidationService.getRulesByCategory();
      setRules(data);
      return data;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch skill validation rules');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const updateRule = useCallback(async (id: number, updateData: Partial<SkillValidationRule>): Promise<SkillValidationRule> => {
    try {
      setLoading(true);
      setError(null);
      const updatedRule = await skillValidationService.updateRule(id, updateData);
      showSuccess('Validation rule updated successfully');
      // Refresh the rules list
      await fetchRules();
      return updatedRule;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to update validation rule');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, fetchRules]);

  const initializeDefaults = useCallback(async (): Promise<{ createdRules: number }> => {
    try {
      setLoading(true);
      setError(null);
      const result = await skillValidationService.initializeDefaults();
      showSuccess(`Initialized ${result.createdRules} default rules`);
      // Refresh the rules list
      await fetchRules();
      return result;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to initialize default rules');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError, fetchRules]);

  const value: SkillValidationContextValue = {
    rules,
    loading,
    error,
    fetchRules,
    updateRule,
    initializeDefaults,
  };

  return (
    <SkillValidationContext.Provider value={value}>
      {children}
    </SkillValidationContext.Provider>
  );
};

export const useSkillValidation = (): SkillValidationContextValue => {
  const context = useContext(SkillValidationContext);
  if (context === undefined) {
    throw new Error('useSkillValidation must be used within a SkillValidationProvider');
  }
  return context;
};
