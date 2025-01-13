'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const MapPage = () => {
  const router = useRouter();
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
  
  const navigateToChat = (locationId: number) => {
    router.push(`/pages/chat/${locationId}`);
  };

  return (
    <div style={{ position: 'relative', padding: '2rem', backgroundColor: '#b7abab' }}>
      {mapUrl ? (
        <div style={{ position: 'relative' }}>
          <img src={mapUrl} alt="Map-alt" style={{ width: '100%' }} />
          {locations.map((location: any) => (
            <button
              key={location.id}
              style={{
                position: 'absolute',
                top: `${location.yCoordinate}%`,
                left: `${location.xCoordinate}%`,
                transform: 'translate(-50%, -50%)',
                background: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                padding: '5px',
              }}
              
              onClick={() => navigateToChat(location.id)}
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
