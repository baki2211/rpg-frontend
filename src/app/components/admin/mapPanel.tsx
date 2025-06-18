'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../utils/AuthContext';
import { Map, Location } from '../../../types/types';
import './admin.css';
import Image from 'next/image';
import { api } from '../../../services/apiClient';
import { UPLOADS_URL } from '../../../config/api';

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
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/pages/dashboard');
    }
    fetchMapsAndLocations();
  }, [user, router]);

  const fetchMapsAndLocations = async () => {
    try {
      const response = await api.get('/maps');
      setMaps(response.data as Map[]);

      const mainMapResponse = await api.get('/maps/main');
      const mainMap = mainMapResponse.data as { locations: Location[] };
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
      await api.post('/maps/new', formData, {
        headers: {
          'Content-Type': undefined
        }
      });
      setMap(null);
      setMapName('');
      setErrorMessage('');
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
      await api.put(`/maps/${mapId}/main`, {});
      fetchMapsAndLocations();
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to set main map:', error);
      setErrorMessage('Failed to update main map');
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const mainMapResponse = await api.get('/maps/main');
      const mainMapId = (mainMapResponse.data as { id: number }).id;

      if (selectedLocation) {
        await api.put(`/locations/${selectedLocation.id}`, selectedLocation);
        setSelectedLocation(null);
      } else {
        await api.post(`/locations/${mainMapId}/new`, locationData);
        setLocationData({ name: '', description: '', xCoordinate: 0, yCoordinate: 0 });
      }

      setErrorMessage('');
      fetchMapsAndLocations();
    } catch (error) {
      console.error('Failed to save location:', error);
      setErrorMessage('Failed to save location');
    }
  };

  const handleDeleteLocation = async (locationId: number) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await api.delete(`/locations/${locationId}`);
        fetchMapsAndLocations();
        setErrorMessage('');
      } catch (error) {
        console.error('Failed to delete location:', error);
        setErrorMessage('Failed to delete location');
      }
    }
  };

  const handleDeleteMap = async (mapId: number) => {
    const confirm = window.confirm('Are you sure you want to delete this map? This action cannot be undone.');
    if (!confirm) return;

    try {
      await api.delete(`/maps/${mapId}`);
      fetchMapsAndLocations();
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to delete map:', error);
      setErrorMessage('Failed to delete map');
    }
  };

  if (!user) {
    return (
      <div className="admin-panel">
        <div className="admin-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Map & Location Management</h1>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>

        {/* Map Upload Section */}
        <div className="admin-form">
          <h2 className="form-full-width">Upload New Map</h2>
          <form onSubmit={handleMapUpload} encType="multipart/form-data">
            <div className="form-grid">
              <div className="form-group">
                <label>Map Name:</label>
                <input
                  type="text"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  className="form-control"
                  required
                  placeholder="Enter map name..."
                />
              </div>
              
              <div className="form-group">
                <label>Map Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMap(e.target.files?.[0] || null)}
                  className="form-control"
                  required
                />
              </div>
            </div>
            
            <div className="form-full-width">
              <button type="submit" className="btn btn-primary">
                📁 Upload Map
              </button>
            </div>
          </form>
        </div>

        {/* Maps Management Section */}
        <div className="admin-section">
          <h3>Uploaded Maps ({maps.length})</h3>
          <div className="maps-grid">
            {maps.map((mapItem) => (
              <div key={mapItem.id} className="map-card">
                <div className="map-card-header">
                  <h4>{mapItem.name}</h4>
                  {mapItem.isMainMap && <span className="main-map-badge">Main Map</span>}
                </div>
                
                <div className="map-card-actions">
                  <button
                    onClick={() => handleSetMainMap(mapItem.id)}
                    disabled={mapItem.isMainMap}
                    className={`btn ${mapItem.isMainMap ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {mapItem.isMainMap ? '⭐ Main Map' : '🔄 Set as Main'}
                  </button>
                  
                  <button
                    onClick={() => setSelectedMapForPreview(mapItem)}
                    className="btn btn-info"
                  >
                    👁️ Preview
                  </button>
                  
                  <button
                    onClick={() => handleDeleteMap(mapItem.id)}
                    disabled={mapItem.isMainMap || maps.length <= 1}
                    className="btn btn-danger"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {maps.length === 0 && (
            <div className="no-data">
              <p>No maps uploaded yet. Upload your first map above!</p>
            </div>
          )}
        </div>

        {/* Location Management Section */}
        <div className="admin-form">
          <h2 className="form-full-width">{selectedLocation ? 'Edit Location' : 'Add New Location'}</h2>
          <form onSubmit={handleLocationSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Location Name:</label>
                <input
                  type="text"
                  value={selectedLocation ? selectedLocation.name : locationData.name}
                  onChange={(e) =>
                    selectedLocation
                      ? setSelectedLocation({ ...selectedLocation, name: e.target.value })
                      : setLocationData({ ...locationData, name: e.target.value })
                  }
                  className="form-control"
                  required
                  placeholder="Enter location name..."
                />
              </div>

              <div className="form-group form-full-width">
                <label>Description:</label>
                <textarea
                  value={selectedLocation ? selectedLocation.description : locationData.description}
                  onChange={(e) =>
                    selectedLocation
                      ? setSelectedLocation({ ...selectedLocation, description: e.target.value })
                      : setLocationData({ ...locationData, description: e.target.value })
                  }
                  className="form-control"
                  required
                  placeholder="Describe this location..."
                  rows={3}
                />
              </div>

              <div className="form-group">
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
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
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
                  className="form-control"
                  required
                />
              </div>
            </div>
            
            <div className="form-full-width">
              <button type="submit" className="btn btn-primary">
                {selectedLocation ? '✓ Update Location' : '+ Add Location'}
              </button>
              {selectedLocation && (
                <button 
                  type="button" 
                  onClick={() => setSelectedLocation(null)} 
                  className="btn btn-secondary"
                  style={{ marginLeft: '1rem' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Locations List */}
        <div className="admin-table">
          <h3>Existing Locations ({locations.length})</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Description</th>
                <th>Coordinates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id}>
                  <td><strong>{location.name}</strong></td>
                  <td>{location.description}</td>
                  <td>
                    <span className="coordinate-badge">
                      X: {location.xCoordinate}, Y: {location.yCoordinate}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => setSelectedLocation(location)} 
                      className="btn btn-success"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="btn btn-danger"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {locations.length === 0 && (
            <div className="no-data">
              <p>No locations created yet. Add your first location above!</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Preview Panel */}
      {selectedMapForPreview && (
        <div className="map-preview-overlay">
          <div className="map-preview-modal">
            <div className="map-preview-header">
              <h3>{selectedMapForPreview.name}</h3>
              <button
                onClick={() => setSelectedMapForPreview(null)}
                className="btn btn-secondary"
              >
                ✕ Close
              </button>
            </div>
            <div className="map-preview-content">
              <Image
                src={selectedMapForPreview.imageUrl.startsWith('/uploads/') 
                  ? `${UPLOADS_URL.replace('/uploads', '')}${selectedMapForPreview.imageUrl}`
                  : `${UPLOADS_URL}${selectedMapForPreview.imageUrl}`}
                alt={selectedMapForPreview.name}
                width={800}
                height={600}
                className="map-preview-image"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMapPanel;
