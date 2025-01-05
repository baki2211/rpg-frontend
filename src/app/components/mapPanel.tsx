'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '../utils/AuthContext';
import { Map, Location } from '../../types/types';

const AdminMapPanel = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [map, setMap] = useState<File | null>(null);
  const [mapName, setMapName] = useState('');
  const [maps, setMaps] = useState<Map[]>([]); 
  const [locations, setLocations] = useState([]);
  const [locationData, setLocationData] = useState({
    name: '',
    description: '',
    x: 0,
    y: 0,
  });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/pages/dashboard'); // Redirect non-admins to the dashboard
    }
    fetchMapsAndLocations();
  }, [user, router]);

  const fetchMapsAndLocations = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/maps', {
        withCredentials: true,
      });
      setMaps(response.data); // Store all maps
      const mainMap = response.data.find((map: any) => map.isMainMap);
      setLocations(mainMap?.locations || []); // Use locations of the main map
    } catch (error) {
      setErrorMessage('Failed to fetch maps and locations');
    }
  };

  const handleMapUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!map || !mapName) {
      setErrorMessage('Map name and file are required');
      return;
    }

    const formData = new FormData();
    formData.append('map', map); // The file
    formData.append('name', mapName); // The map name

    try {
      await axios.post('http://localhost:5001/api/maps/new', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setMap(null);
      setMapName('');
      fetchMapsAndLocations(); // Refresh maps and locations
    } catch (error) {
      setErrorMessage('Failed to upload map');
    }
  };

  const handleSetMainMap = async (mapId: number) => {
    if (!mapId) {
      setErrorMessage('Invalid map ID');
      return;
    }
    try {
      await axios.put(`http://localhost:5001/api/maps/${mapId}/main`, {}, { withCredentials: true });
      fetchMapsAndLocations(); // Refresh after updating main map
    } catch (error) {
      setErrorMessage('Failed to update main map');
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Fetch the main map
      const mainMapResponse = await axios.get('http://localhost:5001/api/maps/main', { withCredentials: true });
      console.log('Main Map Response:', mainMapResponse.data);
      const mainMapId = mainMapResponse.data.id;
      console.log('Main Map ID:', mainMapId);
      if (!mainMapId) {
        setErrorMessage('Main map not found');
        return;
      }
  
      // Add a location to the main map
      await axios.post(`http://localhost:5001/api/locations/${mainMapId}/new`, locationData, {
        withCredentials: true,
      });
  
      setLocationData({ name: '', description: '', x: 0, y: 0 });
      fetchMapsAndLocations();
    } catch (error: any) {
      console.error('Failed to add location:', error.response?.data || error.message);
      setErrorMessage('Failed to add location to the main map');
    }
  };
  

  if (!user) {
    return <div>Loading...</div>; // Show a loading state while user is being fetched
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Map Management</h1>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {/* Upload Map */}
      <form onSubmit={handleMapUpload} encType="multipart/form-data">
        <h2>Upload Map</h2>
        <div>
          <label>Map Name:</label>
          <input
            type="text"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            required
          />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setMap(e.target.files?.[0] || null)}
        />
        <button type="submit">Upload Map</button>
      </form>

      {/* List of Maps */}
      <h2>Uploaded Maps</h2>
      {maps.map((map: any) => (
        <div key={map.id}>
          <span>{map.name}</span>
          <button
            onClick={() => handleSetMainMap(map.id)}
            disabled={map.isMainMap}
          >
            {map.isMainMap ? 'Main Map' : 'Set as Main'}
          </button>
        </div>
      ))}

      {/* Manage Locations */}
      <h2>Manage Locations</h2>
      <form onSubmit={handleLocationSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={locationData.name}
            onChange={(e) =>
              setLocationData({ ...locationData, name: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={locationData.description}
            onChange={(e) =>
              setLocationData({ ...locationData, description: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label>X Coordinate:</label>
          <input
            type="number"
            value={locationData.x}
            onChange={(e) =>
              setLocationData({ ...locationData, x: parseFloat(e.target.value) })
            }
            required
          />
        </div>
        <div>
          <label>Y Coordinate:</label>
          <input
            type="number"
            value={locationData.y}
            onChange={(e) =>
              setLocationData({ ...locationData, y: parseFloat(e.target.value) })
            }
            required
          />
        </div>
        <button type="submit">Add Location</button>
      </form>

      {/* Existing Locations */}
      <h3>Existing Locations</h3>
      <ul>
        {locations.map((location: any) => (
          <li key={location.id}>
            {location.name} - {location.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminMapPanel;
