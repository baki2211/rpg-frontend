'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { engineLogsService, EngineLog } from '@/services/engineLogsService';
import { useToast } from './ToastContext';

interface EngineLogsContextValue {
  logs: EngineLog[];
  loading: boolean;
  error: string | null;
  fetchLogsByLocation: (locationId: string) => Promise<EngineLog[]>;
}

const EngineLogsContext = createContext<EngineLogsContextValue | undefined>(undefined);

export const useEngineLogs = (): EngineLogsContextValue => {
  const context = useContext(EngineLogsContext);
  if (!context) {
    throw new Error('useEngineLogs must be used within an EngineLogsProvider');
  }
  return context;
};

interface EngineLogsProviderProps {
  children: ReactNode;
}

export const EngineLogsProvider: React.FC<EngineLogsProviderProps> = ({ children }) => {
  const [logs, setLogs] = useState<EngineLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  const fetchLogsByLocation = useCallback(async (locationId: string): Promise<EngineLog[]> => {
    try {
      setLoading(true);
      setError(null);
      const fetchedLogs = await engineLogsService.getLogsByLocation(locationId);
      setLogs(fetchedLogs);
      return fetchedLogs;
    } catch (err: unknown) {
      // Don't show error to user for empty logs - this is expected when no skills have been used
      console.error('Error fetching engine logs:', err);
      setLogs([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const value: EngineLogsContextValue = {
    logs,
    loading,
    error,
    fetchLogsByLocation,
  };

  return (
    <EngineLogsContext.Provider value={value}>
      {children}
    </EngineLogsContext.Provider>
  );
};
