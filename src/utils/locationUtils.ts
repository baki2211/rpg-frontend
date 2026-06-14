import { api } from '@/services/apiClient';

export const getLocationFromPath = async (pathname: string): Promise<string> => {
  if (pathname.startsWith('/chat/')) {
    const locationId = pathname.split('/chat/')[1];
    // Remove any additional path segments (e.g., /chat/1/some-sub-page -> just get "1")
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
  if (pathname.startsWith('/map')) return 'Map';
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/skills')) return 'Skills';
  if (pathname.startsWith('/characters')) return 'Characters';
  if (pathname.startsWith('/admin')) return 'Admin';
  if (pathname.startsWith('/login')) return 'Login';
  if (pathname.startsWith('/register')) return 'Register';
  return 'Dashboard'; // Default to Dashboard instead of Unknown
}; 