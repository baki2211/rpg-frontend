'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../utils/AuthContext';

export const useAuthenticatedWebSocket = (
  url: string,
  onOpen?: (event: Event, socket: WebSocket) => void,
  onMessage?: (event: MessageEvent, socket: WebSocket) => void,
  onError?: (event: Event, socket: WebSocket) => void,
  onClose?: (event: CloseEvent, socket: WebSocket) => void,
  autoReconnect = true
) => {
  const { isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    const socket = new WebSocket(url);
    wsRef.current = socket;

    socket.onopen = (event) => {
      console.log('WebSocket opened:', url);
      onOpen?.(event, socket);
    };

    socket.onmessage = (event) => {
      onMessage?.(event, socket);
    };

    socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      onError?.(event, socket);
      socket.close();
    };

    socket.onclose = (event) => {
      console.warn('WebSocket closed:', event.reason);
      onClose?.(event, socket);
      if (autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Reconnecting WebSocket:', url);
          connect();
        }, 3000);
      }
    };
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [url, isAuthenticated]);

  return wsRef;
};
