import type { ApiError, ApiErrorCode } from '../services/apiClient';

export const isApiError = (error: unknown): error is ApiError => {
  return (
    error instanceof Error &&
    error.name === 'ApiError' &&
    'config' in error
  );
};

export const getErrorCode = (error: unknown): ApiErrorCode | undefined => {
  return isApiError(error) ? error.code : undefined;
};

export const getErrorStatus = (error: unknown): number | undefined => {
  return isApiError(error) ? error.response?.status : undefined;
};

export const getErrorMessage = (error: unknown, fallbackMessage = 'An error occurred'): string => {
  if (isApiError(error)) {
    const body = error.response?.data as { message?: string } | undefined;
    if (body?.message) {
      return body.message;
    }
    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
};
