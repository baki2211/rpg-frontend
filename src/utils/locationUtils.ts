import { api } from '../services/apiClient';

export const getLocationFromPath = async (pathname: string): Promise<string> => {
  if (pathname.startsWith('/pages/chat/')) {
    const locationId = pathname.split('/pages/chat/')[1];
    // Remove any additional path segments (e.g., /pages/chat/1/some-sub-page -> just get "1")
    const cleanLocationId = locationId.split('/')[0];
    try {
      const response = await api.get(`/locations/byId/${cleanLocationId}`);
      return (response.data as { location: { name: string } }).location?.name || 
             (response.data as { name: string }).name || 
             `Location ${cleanLocationId}`;
    } catch (error) {
      console.warn(`Failed to fetch location name for ${cleanLocationId}:`, error);
      return `Location ${cleanLocationId}`;
    }
  }
  if (pathname.startsWith('/pages/map')) return 'Map';
  if (pathname.startsWith('/pages/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/pages/skills')) return 'Skills';
  if (pathname.startsWith('/pages/characters')) return 'Characters';
  if (pathname.startsWith('/pages/admin')) return 'Admin';
  if (pathname.startsWith('/pages/login')) return 'Login';
  if (pathname.startsWith('/pages/register')) return 'Register';
  return 'Dashboard'; // Default to Dashboard instead of Unknown
}; 