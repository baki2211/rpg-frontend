'use client';

import { useEffect, useRef, useState } from 'react';

interface WebSocketOptions {
  locationId: string;
  onMessage: (message: any) => void; // Callback to handle received messages
  onError?: (error: Event) => void; // Optional callback for handling errors
  onClose?: (event: CloseEvent) => void; // Optional callback for handling close events
}

const useWebSocket = ({ locationId, onMessage, onError, onClose }: WebSocketOptions) => {
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
    let retryDelay = 1000; // Start with 1 second
    const maxRetryDelay = 30000; // Max delay of 30 seconds
    let retryCount = 0;

    const connectWebSocket = () => {
      ws.current = new WebSocket(`ws://localhost:5002?locationId=${locationId}`);

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
        console.warn(`WebSocket connection closed for location: ${locationId}`, event);
        setConnectionStatus('closed');

        // if (retryCount < 5) {
        //   console.log(`Retrying WebSocket connection in ${retryDelay / 1000} seconds...`);
        //   setTimeout(connectWebSocket, retryDelay);
        //   retryDelay = Math.min(retryDelay * 2, maxRetryDelay); // Exponential backoff
        //   retryCount += 1;
        // } else {
        //   console.error('Max retry attempts reached. Unable to reconnect WebSocket.');
        //   setErrorMessage('Max retry attempts reached. Please refresh the page.');
        // }

        if (onClose) onClose(event);
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current?.close();
        ws.current = null;
      }
    };
  }, [locationId, onMessage, onError, onClose]);

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'message', content: message })); // Match the structure of your message
    } else {
      console.warn('WebSocket is not open. Unable to send message.');
    }
  };

  return { connectionStatus, sendMessage, errorMessage };
};

export default useWebSocket;
