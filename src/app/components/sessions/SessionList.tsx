'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  name: string;
  locationId: string;
  createdAt: string;
  participantCount: number;
  participants?: number[];
}

const SessionList = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        
        // Use the standard endpoint for getting all sessions
        const response = await fetch('http://localhost:5001/api/sessions/active', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }, 
        }).catch((error) => {
          throw new Error('Network error: ' + error.message);
        });

        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Invalid response format: ${contentType}`);
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          throw new Error(errorData.error || 'Failed to fetch sessions');
        }
        
        const data = await response.json();
        console.log('Sessions data:', data);
        setSessions(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleSessionClick = (sessionId: string) => {
    router.push(`/chat/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <div className="animate-pulse text-gray-600">Loading sessions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Active Chat Sessions</h2>
      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => handleSessionClick(session.id)}
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{session.name}</h3>
                <p className="text-sm text-gray-500">
                  Created: {new Date(session.createdAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  Location ID: {session.locationId}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {session.participantCount} participants
              </div>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No active sessions found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Active sessions will appear here once they are created.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionList;