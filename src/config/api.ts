// API Configuration - automatically detects environment
const getApiConfig = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // For local development, we want to use the local backend
  const isLocalDev = isBrowser && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('.local') ||
     process.env.NEXT_PUBLIC_USE_LOCAL_BACKEND === 'true');

  // Only use production URLs if we're actually in production
  const isProduction = !isLocalDev && process.env.NODE_ENV === 'production';

  const baseUrl = isLocalDev
    ? (process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || 'http://localhost:5001')  // Local development URL
    : 'https://rpg-be.onrender.com';     // Production backend URL

  const wsUrl = isLocalDev
    ? (process.env.NEXT_PUBLIC_LOCAL_WS_URL || 'ws://localhost:5001')  // Local WebSocket URL
    : 'wss://rpg-be.onrender.com';       // Production WebSocket URL

  return {
    baseUrl,
    wsUrl,
    apiUrl: `${baseUrl}/api`,
    uploadsUrl: `${baseUrl}/uploads`,
    isProduction
  };
};

export const API_CONFIG = getApiConfig();

// Export individual URLs for convenience
export const { baseUrl: BASE_URL, wsUrl: WS_URL, apiUrl: API_URL, uploadsUrl: UPLOADS_URL } = API_CONFIG; 