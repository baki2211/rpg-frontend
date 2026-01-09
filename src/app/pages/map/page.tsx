'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UPLOADS_URL } from '../../../config/api';
import { api } from '../../../services/apiClient';

interface Location {
  id: number;
  name: string;
  xCoordinate: number;
  yCoordinate: number;
}

interface MapData {
  imageUrl: string;
  locations: Location[];
}

const MapPage = () => {
  const router = useRouter();
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const response = await api.get('/maps/main');
        const mapData = response.data as MapData;
        setMapUrl(mapData.imageUrl);
        setLocations(mapData.locations || []);
      } catch (error) {
        console.error('Error fetching map:', error);
        setImageError(true);
      }
    };
    fetchMap();
  }, []);

  const getImageUrl = () => {
    if (imageError || !mapUrl) {
      return `${UPLOADS_URL}/placeholder.jpg`;
    }

    // If it's already a full URL, use it as is
    if (mapUrl.startsWith('http')) {
      return mapUrl;
    }

    // If the mapUrl starts with /uploads/, use baseUrl instead of UPLOADS_URL
    if (mapUrl.startsWith('/uploads/')) {
      return `${UPLOADS_URL.replace('/uploads', '')}${mapUrl}`;
    }

    // For all other cases, prepend UPLOADS_URL
    return `${UPLOADS_URL}${mapUrl}`;
  };

  const navigateToChat = (locationId: number) => {
    router.push(`/pages/chat/${locationId}`);
  };

  return (
    <div className="map-page-container">
      {mapUrl ? (
        <div className="map-image-container">
          <Image
            src={getImageUrl()}
            alt="Game Map"
            width={1200}
            height={800}
            className="map-image"
            onError={() => setImageError(true)}
          />
          {locations.map((location: Location) => (
            <button
              key={location.id}
              className="map-location-button"
              style={{
                top: `${location.yCoordinate}%`,
                left: `${location.xCoordinate}%`,
                transform: 'translate(-50%, -50%)',
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
