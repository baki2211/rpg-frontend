'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { raceService } from '../../services/raceService';
import { Race } from '../../types/character';
import { useToast } from './ToastContext';
import { getErrorMessage } from '../../utils/errorHandling';

interface RacesContextValue {
  // State
  races: Race[];
  playableRaces: Race[];
  loading: boolean;
  error: string | null;
  // Actions
  fetchRaces: () => Promise<Race[]>;
  fetchPlayableRaces: () => Promise<Race[]>;
}

const RacesContext = createContext<RacesContextValue | undefined>(undefined);

interface RacesProviderProps {
  children: ReactNode;
}

export const RacesProvider: React.FC<RacesProviderProps> = ({ children }) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [playableRaces, setPlayableRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  const fetchRaces = useCallback(async (): Promise<Race[]> => {
    try {
      setLoading(true);
      setError(null);
      const raceList = await raceService.getRaces();
      setRaces(raceList);
      return raceList;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch races');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchPlayableRaces = useCallback(async (): Promise<Race[]> => {
    try {
      setLoading(true);
      setError(null);
      const raceList = await raceService.getPlayableRaces();
      setPlayableRaces(raceList);
      return raceList;
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to fetch playable races');
      setError(errorMsg);
      showError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const value = useMemo<RacesContextValue>(() => ({
    races,
    playableRaces,
    loading,
    error,
    fetchRaces,
    fetchPlayableRaces,
  }), [
    races,
    playableRaces,
    loading,
    error,
    fetchRaces,
    fetchPlayableRaces,
  ]);

  return (
    <RacesContext.Provider value={value}>
      {children}
    </RacesContext.Provider>
  );
};

export const useRaces = (): RacesContextValue => {
  const context = useContext(RacesContext);
  if (!context) {
    throw new Error('useRaces must be used within a RacesProvider');
  }
  return context;
};
