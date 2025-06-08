'use client';

import React, { useEffect, useState } from 'react';
import './SessionList.css';

interface Participant {
  id: string;
  characterName: string;
  joinedAt: string;
}

interface Location {
  id: string;
  name: string;
}

interface Session {
  id: string;
  name: string;
  locationId: string;
  location?: Location;
  createdAt: string;
  status: 'open' | 'closed' | 'frozen';
  isActive: boolean;
  participantCount: number;
  participants?: Participant[];
}

const SessionList = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:5001/api/sessions/active', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }, 
      });

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

  const handleGoHere = (locationId: string) => {
    // Use window.location.href for reliable navigation
    window.location.href = `/pages/chat/${locationId}`;
  };

  const handleToggleFreeze = async (sessionId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'frozen' ? 'open' : 'frozen';
      const action = newStatus === 'frozen' ? 'Freezing' : 'Unfreezing';
      
      const response = await fetch(`http://localhost:5001/api/sessions/${sessionId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action.toLowerCase()} session`);
      }

      const result = await response.json();
      console.log(`✅ Session ${action.toLowerCase()} successful:`, result);
      
      // Show user feedback
      if (newStatus === 'frozen') {
        alert('🧊 Session frozen! Chat state has been saved and cleared.');
      } else {
        alert('🔥 Session unfrozen! Chat state has been restored.');
      }

      // Refresh sessions list
      await fetchSessions();
    } catch (error) {
      console.error(`❌ Error ${currentStatus === 'frozen' ? 'unfreezing' : 'freezing'} session:`, error);
      alert(`Failed to ${currentStatus === 'frozen' ? 'unfreeze' : 'freeze'} session`);
    }
  };

  const handleToggleActive = async (sessionId: string, currentIsActive: boolean) => {
    try {
      // If closing (currentIsActive is true), set status to 'closed'
      // If opening (currentIsActive is false), set status to 'open'
      const newStatus = currentIsActive ? 'closed' : 'open';
      
      console.log(`🔄 Updating session ${sessionId} from ${currentIsActive ? 'active' : 'inactive'} to status: ${newStatus}`);
      
      const response = await fetch(`http://localhost:5001/api/sessions/${sessionId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update session status');
      }

      const updatedSession = await response.json();
      console.log('✅ Session updated successfully:', updatedSession);
      
      // Refresh sessions list
      console.log('🔄 Refreshing sessions list...');
      await fetchSessions();
    } catch (error) {
      console.error('❌ Error updating session status:', error);
      alert('Failed to update session status');
    }
  };

  if (loading) {
    return (
      <div className="session-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-container">
        <div className="error-container">
          <h3>❌ Error Loading Sessions</h3>
          <p>{error}</p>
          <button onClick={fetchSessions} className="retry-button">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="session-container">
      <div className="session-header">
        <h2>🎮 Session Management</h2>
        <p>Manage active gaming sessions and participants</p>
      </div>

      {sessions.length === 0 ? (
        <div className="no-sessions">
          <div className="no-sessions-icon">🏰</div>
          <h3>No Active Sessions</h3>
          <p>Active sessions will appear here once they are created.</p>
          <p className="no-sessions-subtitle">Visit different locations to start or join conversations!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Participants</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className={`session-row ${session.status}`}>
                  <td className="location-cell">
                    <div className="location-info">
                      <span className="location-name">
                        {session.location?.name || `Location #${session.locationId}`}
                      </span>
                      <span className="session-name">{session.name}</span>
                    </div>
                  </td>
                  <td className="participants-cell">
                    <div className="participants-info">
                      <span className="participant-count">👥 {session.participantCount}</span>
                      {session.participants && session.participants.length > 0 && (
                        <div className="participant-names">
                          {session.participants.slice(0, 3).map((participant, index) => (
                            <span key={index} className="participant-name">
                              {participant.characterName}
                            </span>
                          ))}
                          {session.participants.length > 3 && (
                            <span className="more-participants">
                              +{session.participants.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="created-cell">
                    <div className="date-info">
                      <span className="date">{new Date(session.createdAt).toLocaleDateString()}</span>
                      <span className="time">{new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        onClick={() => handleToggleFreeze(session.id, session.status)}
                        className={`action-button freeze-button ${session.status === 'frozen' ? 'frozen' : ''}`}
                        title={session.status === 'frozen' ? 'Unfreeze session' : 'Freeze session'}
                      >
                        {session.status === 'frozen' ? '🔥 Unfreeze' : '❄️ Freeze'}
                      </button>
                      
                      <button
                        onClick={() => handleToggleActive(session.id, session.isActive)}
                        className={`action-button active-button ${session.isActive ? 'active' : 'inactive'}`}
                        title={session.isActive ? 'Close session' : 'Open session'}
                      >
                        {session.isActive ? '🔒 Close' : '🔓 Open'}
                      </button>
                      
                      <button
                        onClick={() => handleGoHere(session.locationId)}
                        className="action-button go-button"
                        title="Go to this location"
                      >
                        🚀 Go Here
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SessionList;