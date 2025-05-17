'use client';

import { useEffect, useRef, useState } from 'react';

interface WebSocketOptions {
  locationId: string;
  username?: string; 
  onMessage: (message: JSON) => void; 
  onError?: (error: Event) => void; 
  onClose?: (event: CloseEvent) => void;
}
const activeWebSockets: { [key: string]: WebSocket } = {};

const useWebSocket = ({ locationId, username, onMessage, onError, onClose }: WebSocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!locationId) {
      console.error('locationId is required for WebSocket connection.');
      setConnectionStatus('error');
      setErrorMessage('Missing locationId for WebSocket connection.');
      return;
    }

    if (ws.current) {
      console.warn('WebSocket already exists. Not creating a new one.');
      return;
    }

      ws.current = new WebSocket(`ws://localhost:5001/ws/chat?locationId=${locationId}&username=${username}`);

      setConnectionStatus('connecting');
      setErrorMessage('Connecting to WebSocket...');


      ws.current.onopen = () => {
        console.log(`WebSocket connection established for location: ${locationId}`);
        setConnectionStatus('open');
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const formattedMessage = `${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${message.senderName}`;
        console.log('Message received:', formattedMessage);
        onMessage({ ...message, formattedMessage }); // Call the onMessage callback with formatted message
      };

      ws.current.onerror = (event) => {
        console.error(`WebSocket error for location: ${locationId}`, event);
        setConnectionStatus('error');
        setErrorMessage('WebSocket connection encountered an error. Check server logs for more details.');
        if (onError) onError(event);
      };
      
      ws.current.onclose = (event) => {
        console.warn(`WebSocket connection closed for location: ${locationId} Code: ${event.code}, Reason: ${event.reason}`, event);
        setConnectionStatus('closed');
        setErrorMessage('WebSocket connection was closed. Refresh the page to reconnect.');
        delete activeWebSockets[locationId];

        if (onClose) onClose(event);
      };

    return () => {
      if (ws.current) {
        ws.current?.close();
        ws.current = null;
      }
    };
  }, [locationId, onMessage, onError, onClose, username]);

  const sendMessage = (message: JSON, userId: number, username: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ 
        type: 'message', 
        content: message,
        userId: userId,
        username: username
       })); // Match the structure of your message
    } else {
      console.warn('WebSocket is not open. Unable to send message.');
    }
  };

  return { connectionStatus, sendMessage, errorMessage };
};

export default useWebSocket;
