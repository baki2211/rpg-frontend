'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { skillsService } from '@/services/skillsService';
import { Skill } from '@/types/character';
import { useToast } from './ToastContext';

interface SkillsContextValue {
  acquiredSkills: Skill[];
  availableSkills: Skill[];
  loading: boolean;
  error: string | null;
  fetchAcquiredSkills: (characterId: number, include?: string) => Promise<Skill[]>;
  fetchAvailableSkills: (characterId: number) => Promise<Skill[]>;
  acquireSkill: (skillId: number) => Promise<void>;
}

const SkillsContext = createContext<SkillsContextValue | undefined>(undefined);

export const useSkills = (): SkillsContextValue => {
  const context = useContext(SkillsContext);
  if (!context) {
    throw new Error('useSkills must be used within a SkillsProvider');
  }
  return context;
};

interface SkillsProviderProps {
  children: ReactNode;
}

const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return defaultMessage;
};

export const SkillsProvider: React.FC<SkillsProviderProps> = ({ children }) => {
  const [acquiredSkills, setAcquiredSkills] = useState<Skill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const fetchAcquiredSkills = useCallback(async (characterId: number, include?: string): Promise<Skill[]> => {
    try {
      setLoading(true);
      setError(null);
      const skills = await skillsService.getAcquiredSkills(characterId, include);
      setAcquiredSkills(skills);
      return skills;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch acquired skills');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchAvailableSkills = useCallback(async (characterId: number): Promise<Skill[]> => {
    try {
      setLoading(true);
      setError(null);
      const skills = await skillsService.getAvailableSkills(characterId);
      setAvailableSkills(skills);
      return skills;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch available skills');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const acquireSkill = useCallback(async (skillId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await skillsService.acquireSkill(skillId);
      showSuccess('Skill acquired successfully');
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to acquire skill');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  const value: SkillsContextValue = {
    acquiredSkills,
    availableSkills,
    loading,
    error,
    fetchAcquiredSkills,
    fetchAvailableSkills,
    acquireSkill,
  };

  return (
    <SkillsContext.Provider value={value}>
      {children}
    </SkillsContext.Provider>
  );
};
