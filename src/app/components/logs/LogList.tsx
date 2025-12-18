'use client';

import React, { useEffect, useState } from 'react';
import './LogList.css';
import { api } from '../../../services/apiClient';

interface Participant {
  id: string;
  characterName: string;
  joinedAt: string;
}

interface Location {
  id: string;
  name: string;
}

interface Message {
  username: string;
  createdAt: string;
  message: string;
  skill?: {
    name: string;
    type: string;
  };
}

interface Session {
  id: string;
  name: string;
  locationId: string;
  location?: Location;
  createdAt: string;
  updatedAt: string;
  status: string;
  participantCount: number;
  participants?: Participant[];
}

const LogList = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClosedSessions();
  }, []);

  const fetchClosedSessions = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/sessions/closed');
      setSessions(response.data as Session[]);
      setError(null);
    } catch (error) {
      console.error('Error fetching closed sessions:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const openSessionLogPopup = async (session: Session) => {
    try {
      // Fetch chat messages for this session's location
      const response = await api.get(`/chat/${session.locationId}`);
      const messages = (response.data as Message[]) || [];

      const popupContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Session Log - ${session.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 20px;
              color: white;
            }
            
            .container {
              max-width: 1000px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              border: 1px solid rgba(255, 255, 255, 0.2);
              padding: 30px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid rgba(255, 255, 255, 0.2);
              padding-bottom: 20px;
            }
            
            .header h1 {
              font-size: 2.2rem;
              margin-bottom: 10px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .header-info {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 15px;
            }
            
            .info-card {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 12px;
              padding: 15px;
              text-align: center;
            }
            
            .info-value {
              font-size: 1.3rem;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .info-label {
              opacity: 0.8;
              font-size: 0.9rem;
            }
            
            .participants-section {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 20px;
              margin-bottom: 25px;
            }
            
            .section-title {
              font-size: 1.3rem;
              margin-bottom: 15px;
              color: white;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .participant {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              padding: 12px 15px;
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .participant:last-child {
              margin-bottom: 0;
            }
            
            .participant-name {
              font-weight: 600;
            }
            
            .participant-time {
              opacity: 0.7;
              font-size: 0.9rem;
            }
            
            .messages-section {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 20px;
              margin-bottom: 25px;
              max-height: 500px;
              overflow-y: auto;
            }
            
            .message {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              padding: 12px 15px;
              margin-bottom: 10px;
              border-left: 3px solid rgba(255, 255, 255, 0.3);
            }
            
            .message:last-child {
              margin-bottom: 0;
            }
            
            .message-header {
              font-size: 0.85rem;
              opacity: 0.8;
              margin-bottom: 5px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .message-content {
              font-size: 0.95rem;
              line-height: 1.4;
            }
            
            .message-skill {
              background: rgba(76, 175, 80, 0.3);
              border-radius: 8px;
              padding: 8px 12px;
              margin-top: 8px;
              font-size: 0.85rem;
              border-left: 3px solid rgba(76, 175, 80, 0.8);
            }
            
            .no-content {
              text-align: center;
              opacity: 0.7;
              padding: 30px;
              font-style: italic;
            }
            
            .close-btn {
              display: block;
              width: 200px;
              margin: 20px auto 0;
              padding: 12px 24px;
              background: rgba(255, 255, 255, 0.2);
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 25px;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.3s ease;
              text-align: center;
            }
            
            .close-btn:hover {
              background: rgba(255, 255, 255, 0.3);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }
            
            /* Scrollbar styling */
            .messages-section::-webkit-scrollbar {
              width: 8px;
            }
            
            .messages-section::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 4px;
            }
            
            .messages-section::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.3);
              border-radius: 4px;
            }
            
            .messages-section::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.5);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${session.name}</h1>
              <div class="header-info">
                <div class="info-card">
                  <div class="info-value">${session.location?.name || `Location #${session.locationId}`}</div>
                  <div class="info-label">Location</div>
                </div>
                <div class="info-card">
                  <div class="info-value">${session.participantCount}</div>
                  <div class="info-label">Participants</div>
                </div>
                <div class="info-card">
                  <div class="info-value">${new Date(session.createdAt).toLocaleDateString()}</div>
                  <div class="info-label">Started</div>
                </div>
                <div class="info-card">
                  <div class="info-value">${new Date(session.updatedAt).toLocaleDateString()}</div>
                  <div class="info-label">Ended</div>
                </div>
              </div>
            </div>
            
            <div class="participants-section">
              <h3 class="section-title">Session Participants</h3>
              ${session.participants && session.participants.length > 0 
                ? session.participants.map(participant => `
                  <div class="participant">
                    <span class="participant-name">${participant.characterName}</span>
                    <span class="participant-time">Joined ${new Date(participant.joinedAt).toLocaleDateString()}</span>
                  </div>
                `).join('')
                : '<div class="no-content">No participants recorded</div>'
              }
            </div>
            
            <div class="messages-section">
              <h3 class="section-title">Chat History</h3>
              ${messages.length > 0 
                ? messages.map((message: Message) => `
                  <div class="message">
                    <div class="message-header">
                      <span><strong>${message.username}</strong></span>
                      <span>${new Date(message.createdAt).toLocaleString()}</span>
                    </div>
                    <div class="message-content">${message.message}</div>
                    ${message.skill ? `
                      <div class="message-skill">
                        Used skill: <strong>${message.skill.name}</strong> (${message.skill.type})
                      </div>
                    ` : ''}
                  </div>
                `).join('')
                : '<div class="no-content">No chat messages found for this session</div>'
              }
            </div>
            
            <button class="close-btn" onclick="window.close()">Close Log</button>
          </div>
        </body>
        </html>
      `;

      const popup = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      if (popup) {
        popup.document.write(popupContent);
        popup.document.close();
      }
    } catch (error) {
      console.error('Error opening session log:', error);
      alert('Failed to load session log');
    }
  };

  if (loading) {
    return (
      <div className="log-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading session logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="log-container">
        <div className="error-container">
          <h3>Error Loading Session Logs</h3>
          <p>{error}</p>
          <button onClick={fetchClosedSessions} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="log-container">
      <div className="log-header">
        <h2>Session Logs</h2>
        <p>Browse closed session archives and chat history</p>
      </div>

      {sessions.length === 0 ? (
        <div className="no-logs">
          <div className="no-logs-icon"></div>
          <h3>No Closed Sessions</h3>
          <p>Closed session logs will appear here once sessions are completed.</p>
          <p className="no-logs-subtitle">Active sessions can be found on the Sessions page!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Session Name</th>
                <th>Location</th>
                <th>Participants</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const startDate = new Date(session.createdAt);
                const endDate = new Date(session.updatedAt);
                const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)); // hours
                
                return (
                  <tr key={session.id} className="log-row">
                    <td className="session-cell">
                      <div className="session-info">
                        <span className="session-name">{session.name}</span>
                        <span className="session-dates">
                          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="location-cell">
                      <div className="location-info">
                        <span className="location-name">
                          {session.location?.name || `Location #${session.locationId}`}
                        </span>
                      </div>
                    </td>
                    <td className="participants-cell">
                      <div className="participants-info">
                        <span className="participant-count">{session.participantCount}</span>
                        {session.participants && session.participants.length > 0 && (
                          <div className="participant-preview">
                            {session.participants.slice(0, 2).map((participant, index) => (
                              <span key={index} className="participant-name">
                                {participant.characterName}
                              </span>
                            ))}
                            {session.participants.length > 2 && (
                              <span className="more-participants">
                                +{session.participants.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="duration-cell">
                      <div className="duration-info">
                        <span className="duration">{duration}h</span>
                        <span className="duration-label">Duration</span>
                      </div>
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => openSessionLogPopup(session)}
                        className="action-button log-button"
                        title="Open session log"
                      >
                        Open Log
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LogList; 