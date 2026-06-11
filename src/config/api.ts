// API Configuration - automatically detects environment
const getApiConfig = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';

  // Tri-state override: 'true' forces local, 'false' forces prod, unset falls through to heuristics.
  // The explicit-false branch exists so internal corp domains (e.g. app.something.local)
  // can opt out of the LAN-IP / .local auto-detection below.
  const useLocalEnv = process.env.NEXT_PUBLIC_USE_LOCAL_BACKEND;
  const forceLocal = useLocalEnv === 'true';
  const forceProd = useLocalEnv === 'false';

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Check if we're running on a local hostname. Use endsWith for ".local" so we don't
  // accidentally match production hostnames that happen to contain the substring
  // (e.g. "app.localcorp.com").
  const hostname = isBrowser ? window.location.hostname : '';
  const isLocalHostname = isBrowser && (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  );

  // Check if we're running on development ports
  const isLocalPort = isBrowser && (
    window.location.port === '3000' ||
    window.location.port === '3001'
  );

  // Explicit override wins over heuristics in either direction.
  const shouldUseLocal = forceLocal
    || (!forceProd && (isDevelopment || isLocalHostname || isLocalPort));

  const baseUrl = shouldUseLocal
    ? (process.env.NEXT_PUBLIC_LOCAL_BACKEND_URL || 'http://localhost:5001')  // Local development URL
    : (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://arcanerealms.org');     // Production backend URL

  const wsUrl = shouldUseLocal
    ? (process.env.NEXT_PUBLIC_LOCAL_WS_URL || 'ws://localhost:5001')  // Local WebSocket URL
    : (process.env.NEXT_PUBLIC_WS_URL || 'wss://arcanerealms.org');       // Production WebSocket URL

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