'use client';

import { useEffect, useRef, useState } from 'react';

interface WebSocketOptions {
  locationId: string;
  username?: string; 
  onMessage: (message: any) => void; 
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
      let retryDelay = 1000; // Start with 1 second
      const maxRetryDelay = 30000; // Max delay of 30 seconds
      let retryCount = 0;

      setConnectionStatus('connecting');
      setErrorMessage('Connecting to WebSocket...');


      ws.current.onopen = () => {
        console.log(`WebSocket connection established for location: ${locationId}`);
        setConnectionStatus('open');
        retryCount = 0; // Reset retry count on successful connection
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Message received:', JSON.parse(event.data));
        onMessage(message); // Call the onMessage callback
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
  }, [locationId, onMessage, onError, onClose]);

  const sendMessage = (message: any, userId: any, username: any) => {
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
