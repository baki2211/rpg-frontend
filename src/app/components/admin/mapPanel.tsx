'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../utils/AuthContext';
import { Map, Location } from '../../../types/types';

const AdminMapPanel = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [map, setMap] = useState<File | null>(null);
  const [mapName, setMapName] = useState('');
  const [maps, setMaps] = useState<Map[]>([]);
  const [selectedMapForPreview, setSelectedMapForPreview] = useState<Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationData, setLocationData] = useState({
    name: '',
    description: '',
    xCoordinate: 0,
    yCoordinate: 0,
  });
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null); // For editing a location
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/pages/dashboard'); // Redirect non-admins to the dashboard
    }
    fetchMapsAndLocations();
  }, [user, router]);

  const fetchMapsAndLocations = async () => {
    try {
      // Fetch all maps
      const response = await axios.get('http://localhost:5001/api/maps', {
        withCredentials: true,
      });
      setMaps(response.data);

      // Fetch the main map
      const mainMapResponse = await axios.get('http://localhost:5001/api/maps/main', {
        withCredentials: true,
      });
      const mainMap = mainMapResponse.data;
      setLocations(mainMap?.locations || []);
    } catch (error) {
      console.error('Error fetching maps or locations:', error);
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
    formData.append('map', map);
    formData.append('name', mapName);

    try {
      await axios.post('http://localhost:5001/api/maps/new', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setMap(null);
      setMapName('');
      fetchMapsAndLocations();
    } catch (error) {
      console.error('Failed to upload map:', error);
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
      fetchMapsAndLocations();
    } catch (error) {
      console.error('Failed to set main map:', error);
      setErrorMessage('Failed to update main map');
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const mainMapResponse = await axios.get('http://localhost:5001/api/maps/main', {
        withCredentials: true,
      });
      const mainMapId = mainMapResponse.data.id;

      if (selectedLocation) {
        // Update existing location
        await axios.put(`http://localhost:5001/api/locations/${selectedLocation.id}`, selectedLocation, {
          withCredentials: true,
        });
        setSelectedLocation(null);
      } else {
        // Add a new location
        await axios.post(`http://localhost:5001/api/locations/${mainMapId}/new`, locationData, {
          withCredentials: true,
        });
        setLocationData({ name: '', description: '', xCoordinate: 0, yCoordinate: 0 });
      }

      fetchMapsAndLocations();
    } catch (error) {
      console.error('Failed to save location:', error);
      setErrorMessage('Failed to save location');
    }
  };

  const handleDeleteLocation = async (locationId: number) => {
    try {
      await axios.delete(`http://localhost:5001/api/locations/${locationId}`, {
        withCredentials: true,
      });
      fetchMapsAndLocations();
    } catch (error) {
      console.error('Failed to delete location:', error);
      setErrorMessage('Failed to delete location');
    }
  };

  const handleDeleteMap = async (mapId: number) => {
    const confirm = window.confirm('Are you sure you want to delete this map? This action cannot be undone.');
    if (!confirm) return;
  
    try {
      await axios.delete(`http://localhost:5001/api/maps/${mapId}`, {
        withCredentials: true,
      });
      fetchMapsAndLocations();
    } catch (error) {
      console.error('Failed to delete map:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', padding: '2rem' }}>
    {/* Left: Main panel */}
    <div style={{ flex: 1, marginRight: '2rem' }}>
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
      {maps.map((map) => (
  <div key={map.id} style={{ marginBottom: '1rem' }}>
    <span>{map.name}</span>
    <button
      onClick={() => handleSetMainMap(map.id)}
      disabled={map.isMainMap}
      style={{ marginLeft: '1rem' }}
    >
      {map.isMainMap ? 'Main Map' : 'Set as Main'}
    </button>
    <button
      onClick={() => handleDeleteMap(map.id)}
      disabled={map.isMainMap || maps.length <= 1}
      style={{
        marginLeft: '1rem',
        color: 'white',
        backgroundColor: map.isMainMap || maps.length <= 1 ? 'gray' : 'red',
        border: 'none',
        padding: '0.3rem 0.6rem',
        cursor: map.isMainMap || maps.length <= 1 ? 'not-allowed' : 'pointer',
      }}
    >
      Delete
    </button>
    <button
      onClick={() => setSelectedMapForPreview(map)}
      style={{ marginLeft: '1rem' }}
    >
      Preview
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
            value={selectedLocation ? selectedLocation.name : locationData.name}
            onChange={(e) =>
              selectedLocation
                ? setSelectedLocation({ ...selectedLocation, name: e.target.value })
                : setLocationData({ ...locationData, name: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={selectedLocation ? selectedLocation.description : locationData.description}
            onChange={(e) =>
              selectedLocation
                ? setSelectedLocation({ ...selectedLocation, description: e.target.value })
                : setLocationData({ ...locationData, description: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label>X Coordinate:</label>
          <input
            type="number"
            value={selectedLocation ? selectedLocation.xCoordinate : locationData.xCoordinate}
            onChange={(e) =>
              selectedLocation
                ? setSelectedLocation({
                    ...selectedLocation,
                    xCoordinate: parseFloat(e.target.value),
                  })
                : setLocationData({
                    ...locationData,
                    xCoordinate: parseFloat(e.target.value),
                  })
            }
            required
          />
        </div>
        <div>
          <label>Y Coordinate:</label>
          <input
            type="number"
            value={selectedLocation ? selectedLocation.yCoordinate : locationData.yCoordinate}
            onChange={(e) =>
              selectedLocation
                ? setSelectedLocation({
                    ...selectedLocation,
                    yCoordinate: parseFloat(e.target.value),
                  })
                : setLocationData({
                    ...locationData,
                    yCoordinate: parseFloat(e.target.value),
                  })
            }
            required
          />
        </div>
        <button type="submit">
          {selectedLocation ? 'Update Location' : 'Add Location'}
        </button>
        {selectedLocation && (
          <button onClick={() => setSelectedLocation(null)} style={{ marginLeft: '1rem' }}>
            Cancel
          </button>
        )}
      </form>

      {/* Existing Locations */}
      <h3>Existing Locations</h3>
      <ul>
        {locations.map((location) => (
          <li key={location.id}>
            <strong>{location.name}</strong> - {location.description} - (
            {location.xCoordinate}, {location.yCoordinate})
            <button onClick={() => setSelectedLocation(location)} style={{ marginLeft: '1rem' }}>
              Edit
            </button>
            <button
              onClick={() => handleDeleteLocation(location.id)}
              style={{ marginLeft: '1rem', color: 'red' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
    </div>

    {/* Right: Preview panel */}
    <div style={{ width: '400px' }}>
      <h2>Map Preview</h2>
      {selectedMapForPreview ? (
        <div>
          <p><strong>{selectedMapForPreview.name}</strong></p>
          <img
            src={`http://localhost:5001${selectedMapForPreview.imageUrl}`}
            alt={selectedMapForPreview.name}
            style={{
              maxWidth: '100%',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 0 5px rgba(0,0,0,0.1)',
            }}
          />
          <button
            onClick={() => setSelectedMapForPreview(null)}
            style={{ marginTop: '1rem' }}
          >
            Close Preview
          </button>
        </div>
      ) : (
        <p>No map selected</p>
      )}
    </div>
  </div>
  );
};

export default AdminMapPanel;
