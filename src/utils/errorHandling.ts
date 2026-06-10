// Pulls a user-facing message off the apiClient envelope (see docs/api.md "Error Contract"),
// falling back to a plain Error.message, raw string, or the supplied default.
export const getErrorMessage = (error: unknown, fallbackMessage = 'An error occurred'): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
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
