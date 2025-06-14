// API Configuration - automatically detects environment
const getApiConfig = () => {
  // Multiple ways to detect production environment
  const isNodeProduction = process.env.NODE_ENV === 'production';
  const isDeployedDomain = typeof window !== 'undefined' && 
                          !window.location.hostname.includes('localhost') &&
                          !window.location.hostname.includes('127.0.0.1');
  
  // Override for manual testing (you can set this in browser console)
  const manualOverride = typeof window !== 'undefined' && 
                        (window as unknown as { __FORCE_PRODUCTION_API?: boolean }).__FORCE_PRODUCTION_API;

  const isProduction = isNodeProduction || isDeployedDomain || manualOverride;

  const baseUrl = isProduction 
    ? 'https://rpg-be.onrender.com'       // Production backend URL
    : 'http://localhost:5001';            // Local development URL

  const wsUrl = isProduction
    ? 'wss://rpg-be.onrender.com'         // Production WebSocket URL
    : 'ws://localhost:5001';              // Local WebSocket URL



  return {
    baseUrl,
    wsUrl,
    apiUrl: `${baseUrl}/api`,
    uploadsUrl: `${baseUrl}/uploads`,
    isProduction // Export this for debugging
  };
};

export const API_CONFIG = getApiConfig();

// Export individual URLs for convenience
export const { baseUrl: BASE_URL, wsUrl: WS_URL, apiUrl: API_URL, uploadsUrl: UPLOADS_URL } = API_CONFIG; 