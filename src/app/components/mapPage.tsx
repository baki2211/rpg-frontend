'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MapPage = () => {
  const [mapUrl, setMapUrl] = useState('');
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchMapAndLocations = async () => {
      try {
        const mainMapResponse = await axios.get('http://localhost:5001/api/maps/main', { withCredentials: true });
        setMapUrl(`http://localhost:5001${mainMapResponse.data.imageUrl}`);
        setLocations(mainMapResponse.data.locations || []);
      } catch (error) {
        console.error('Failed to fetch main map and locations');
      }
    };
  
    fetchMapAndLocations();
  }, []);
  

  return (
    <div style={{ position: 'relative', padding: '2rem' }}>
      {mapUrl ? (
        <div style={{ position: 'relative' }}>
          <img src={mapUrl} alt="Map-alt" style={{ width: '100%' }} />
          {locations.map((location: any) => (
            <button
              key={location.id}
              style={{
                position: 'absolute',
                top: `${location.y}%`,
                left: `${location.x}%`,
                transform: 'translate(-50%, -50%)',
                background: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                padding: '5px',
              }}
              onClick={() => alert(`Open chat for ${location.name}`)}
            >
              {location.name}
            </button>
          ))}
        </div>
      ) : (
        <p>No map available</p>
      )}
    </div>
  );
};

export default MapPage;
