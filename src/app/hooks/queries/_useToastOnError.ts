'use client';

import { useEffect } from 'react';
import { useToast } from '@/app/contexts/ToastContext';
import { getErrorMessage } from '@/utils/errorHandling';

export function useToastOnError(error: unknown, fallback: string) {
  const { showError } = useToast();
  useEffect(() => {
    if (error) showError(getErrorMessage(error, fallback));
  }, [error, fallback, showError]);
}
