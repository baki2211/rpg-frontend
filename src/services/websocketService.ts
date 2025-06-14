import { WS_URL } from '../config/api';

export interface WebSocketConfig {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private url: string;

  constructor(endpoint: string, config: WebSocketConfig = {}) {
    this.url = `${WS_URL}${endpoint}`;
    this.config = config;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = (event) => {
      console.log('WebSocket connected:', this.url);
      this.config.onOpen?.(event);
    };

    this.ws.onmessage = (event) => {
      this.config.onMessage?.(event);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', this.url);
      this.config.onClose?.(event);
    };

    this.ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.config.onError?.(event);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: unknown) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Convenience functions for common WebSocket connections
export const createChatWebSocket = (locationId: number, username: string, config: WebSocketConfig) => {
  const endpoint = `/ws/chat?locationId=${locationId}&username=${encodeURIComponent(username)}`;
  return new WebSocketService(endpoint, config);
};

export const createPresenceWebSocket = (userId: number, username: string, config: WebSocketConfig) => {
  const endpoint = `/ws/presence?userId=${userId}&username=${encodeURIComponent(username)}`;
  return new WebSocketService(endpoint, config);
}; 