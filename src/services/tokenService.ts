const TOKEN_KEY = 'auth_token';

// Helper function to decode JWT without verification (for expiration check)
const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const tokenService = {
  // Store token only
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  // Get stored token
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  // Remove token
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!tokenService.getToken();
  },

  // Check if token is close to expiring (within 30 minutes)
  isTokenNearExpiry: (): boolean => {
    const token = tokenService.getToken();
    if (!token) return false;

    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = decoded.exp - now;
    
    // Return true if token expires within 30 minutes (1800 seconds)
    return timeUntilExpiration <= 1800;
  },

  // Check if token is expired
  isTokenExpired: (): boolean => {
    const token = tokenService.getToken();
    if (!token) return true;

    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp <= now;
  }
}; 