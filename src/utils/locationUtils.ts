import { api } from '../services/apiClient';

export const getLocationFromPath = async (pathname: string): Promise<string> => {
  if (pathname.startsWith('/pages/chat/')) {
    const locationId = pathname.split('/pages/chat/')[1];
    try {
      const response = await api.get(`/location/${locationId}`);
      return (response.data as { name: string }).name || `Location ${locationId}`;
    } catch {
      return `Location ${locationId}`;
    }
  }
  if (pathname.startsWith('/pages/map')) return 'Map';
  if (pathname.startsWith('/pages/dashboard')) return 'Dashboard';
  return 'Unknown';
}; 