/**
 * Safely extracts an error message from various error types
 * Handles Axios errors, standard errors, and unknown error types
 */
export const getErrorMessage = (error: unknown, fallbackMessage = 'An error occurred'): string => {
  // Handle Axios errors with response data
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Return fallback for unknown error types
  return fallbackMessage;
};
