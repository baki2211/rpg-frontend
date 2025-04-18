'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketOptions {
  locationId: string;
  onMessage: (message: any) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

const RECONNECT_DELAYS = [1000, 2000, 3000, 5000, 8000]; // Fibonacci-like sequence for retries

const useWebSocket = ({ locationId, onMessage, onError, onClose }: WebSocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Keep track of whether the component is mounted
  const mounted = useRef(true);

  const connectWebSocket = useCallback(() => {
    if (!mounted.current) return;

    try {
      ws.current = new WebSocket(`ws://localhost:5001?locationId=${locationId}`);

      // Set a timeout for the initial connection
      const connectionTimeout = setTimeout(() => {
        if (ws.current?.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout');
          ws.current?.close();
        }
      }, 5000);

      ws.current.onopen = () => {
        if (!mounted.current) return;
        console.log(`WebSocket connection established for location: ${locationId}`);
        setConnectionStatus('open');
        reconnectAttempt.current = 0;
        clearTimeout(connectionTimeout);
      };

      ws.current.onmessage = (event) => {
        if (!mounted.current) return;
        try {
          const message = JSON.parse(event.data);
          console.log('Message received:', message);
          onMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.current.onerror = (event) => {
        if (!mounted.current) return;
        console.error(`WebSocket error for location: ${locationId}`, event);
        setConnectionStatus('error');
        setErrorMessage('Connection error. Attempting to reconnect...');
        if (onError) onError(event);
      };

      ws.current.onclose = (event) => {
        if (!mounted.current) return;
        console.warn(`WebSocket connection closed for location: ${locationId}`, event);
        setConnectionStatus('closed');
        clearTimeout(connectionTimeout);

        // Implement reconnection logic
        if (reconnectAttempt.current < RECONNECT_DELAYS.length) {
          const delay = RECONNECT_DELAYS[reconnectAttempt.current];
          console.log(`Attempting to reconnect in ${delay}ms...`);
          setTimeout(() => {
            if (mounted.current) {
              reconnectAttempt.current++;
              connectWebSocket();
            }
          }, delay);
        } else {
          setErrorMessage('Unable to establish connection. Please refresh the page.');
        }

        if (onClose) onClose(event);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('error');
      setErrorMessage('Failed to create WebSocket connection');
    }
  }, [locationId, onMessage, onError, onClose]);

  useEffect(() => {
    if (!locationId) {
      console.error('locationId is required for WebSocket connection.');
      setConnectionStatus('error');
      setErrorMessage('Missing locationId for WebSocket connection.');
      return;
    }

    connectWebSocket();

    // Cleanup function
    return () => {
      mounted.current = false;
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [locationId, connectWebSocket]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({ type: 'message', content: message }));
      } catch (error) {
        console.error('Error sending message:', error);
        setErrorMessage('Failed to send message');
      }
    } else {
      console.warn('WebSocket is not open. Message queued for retry.');
      // Optionally implement message queuing here
    }
  }, []);

  return { connectionStatus, sendMessage, errorMessage };
};

export default useWebSocket;
