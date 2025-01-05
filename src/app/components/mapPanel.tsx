'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '../utils/AuthContext';

const AdminMapPanel = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [map, setMap] = useState<File | null>(null);
  const [mapName, setMapName] = useState('');
  const [locations, setLocations] = useState([]);
  const [mapId, setMapId] = useState<number | null>(null);
  const [locationData, setLocationData] = useState({
    name: '',
    description: '',
    x: 0,
    y: 0,
  });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/pages/dashboard'); // Redirect non-admins to dashboard
    }
    fetchMapAndLocations();
  }, [user, router]);

  const fetchMapAndLocations = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/maps', {
        withCredentials: true,
      });
      setMapId(response.data[0]?.id || null); // Assume one map for now
      setLocations(response.data[0]?.locations || []);
    } catch (error) {
      setErrorMessage('Failed to fetch map and locations');
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
        fetchMapAndLocations(); // Refresh map and locations
    } catch (error) {
        setErrorMessage('Failed to upload map');
    }
};


  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mapId) {
      setErrorMessage('No map available to add location');
      return;
    }

    try {
      await axios.post(`http://localhost:5001/api/locations/${mapId}/new`, locationData, {
        withCredentials: true,
      });
      setLocationData({ name: '', description: '', x: 0, y: 0 });
      fetchMapAndLocations(); // Refresh locations
    } catch (error) {
      setErrorMessage('Failed to add location');
    }
  };

  if (!user) {
    return <div>Loading...</div>; // Show a loading state while user is being fetched
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Map Management</h1>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

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
