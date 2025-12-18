// API Configuration - automatically detects environment
const getApiConfig = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Check for explicit local backend setting first
  const useLocalBackend = process.env.NEXT_PUBLIC_USE_LOCAL_BACKEND === 'true';
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check if we're running on a local hostname
  const isLocalHostname = isBrowser && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.includes('.local')
  );
  
  // Check if we're running on development ports
  const isLocalPort = isBrowser && (
    window.location.port === '3000' ||
    window.location.port === '3001'
  );
  
  // Use local backend if any of these conditions are true
  const shouldUseLocal = useLocalBackend || isDevelopment || isLocalHostname || isLocalPort;

  const baseUrl = shouldUseLocal
    ? (process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || 'http://localhost:5001')  // Local development URL
    : 'https://arcanerealms.org';     // Production backend URL

  const wsUrl = shouldUseLocal
    ? (process.env.NEXT_PUBLIC_LOCAL_WS_URL || 'ws://localhost:5001')  // Local WebSocket URL
    : 'wss://arcanerealms.org';       // Production WebSocket URL

  return {
    baseUrl,
    wsUrl,
    apiUrl: `${baseUrl}/api`,
    uploadsUrl: `${baseUrl}/uploads`,
    isProduction: !shouldUseLocal
  };
};

export const API_CONFIG = getApiConfig();

// Export individual URLs for convenience
export const { baseUrl: BASE_URL, wsUrl: WS_URL, apiUrl: API_URL, uploadsUrl: UPLOADS_URL } = API_CONFIG; 