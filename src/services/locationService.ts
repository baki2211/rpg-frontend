import { api } from './apiClient';
import { Location } from '../types/types';

class LocationService {
  async getLocationById(locationId: string): Promise<Location> {
    const response = await api.get<Location | { location: Location }>(`/locations/byId/${locationId}`);
    const data = response.data as { location?: Location } & Partial<Location>;
    return data.location ?? (data as Location);
  }
}

export const locationService = new LocationService();
