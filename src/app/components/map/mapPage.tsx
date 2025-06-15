'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../config/api';
import { api } from '../../../services/apiClient';

interface Location {
  id: number;
  name: string;
  xCoordinate: number;
  yCoordinate: number;
}

const MapPage = () => {
  const router = useRouter();
  const [mapUrl, setMapUrl] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchMapAndLocations = async () => {
      try {
        const mainMapResponse = await api.get('/maps/main');
        const responseData = mainMapResponse.data as { imageUrl: string; locations: Location[] };
        setMapUrl(`${BASE_URL}${responseData.imageUrl}`);
        setLocations(responseData.locations || []);
      } catch (error) {
        console.error('Failed to fetch main map and locations', error);
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
          <Image 
            src={imageError ? `${BASE_URL}/uploads/placeholder.jpg` : mapUrl} 
            alt="Game Map" 
            width={1200}
            height={800}
            style={{ width: '100%', height: 'auto' }}
            onError={() => setImageError(true)}
          />
          {locations.map((location: Location) => (
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
