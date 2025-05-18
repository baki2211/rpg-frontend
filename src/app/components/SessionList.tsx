'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  name: string;
  locationId: string;
  createdAt: string;
  participantCount: number;
}

const SessionList = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/sessions/location', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const data = await response.json();
        setSessions(data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleSessionClick = (locationId: string) => {
    router.push(`/chat/${locationId}`);
  };

  if (loading) {
    return <div className="p-4">Loading sessions...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Active Chat Sessions</h2>
      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => handleSessionClick(session.locationId)}
            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{session.name}</h3>
                <p className="text-sm text-gray-500">
                  Created: {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {session.participantCount} participants
              </div>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-gray-500">No active sessions found.</p>
        )}
      </div>
    </div>
  );
};

export default SessionList; 