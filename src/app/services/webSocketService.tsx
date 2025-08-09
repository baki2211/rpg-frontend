import { EventEmitter } from 'events';

interface WebSocketOptions {
  url: string;
  onMessage?: (message: JSON) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onOpen?: (event: Event) => void;
}

export class WebSocketService extends EventEmitter {
  private socket: WebSocket | null = null;
  private url: string;
  private retryCount = 0;
  private retryDelay = 1000; // Start with 1 second
  private maxRetryDelay = 30000; // Max delay of 30 seconds
  private isManualClose = false;
  private isConnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor(private options: WebSocketOptions) {
    super();
    this.url = options.url;
    this.connect();
  }

  private cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.socket) {
      try {
        this.socket.onopen = null;
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.onmessage = null;
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close();
        }
      } catch (error) {
        console.error('Error cleaning up WebSocket:', error);
      }
      this.socket = null;
    }
    this.isConnecting = false;
  }

  private connect() {
    if (this.isConnecting) {
      return;
    }

    // Clean up any existing connection
    this.cleanup();

    this.isConnecting = true;

    try {
      this.socket = new WebSocket(this.url);

      // Set a connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.socket?.readyState !== WebSocket.OPEN) {
          if (this.isDevelopment) {
            console.warn('WebSocket connection timeout - this is normal if the WebSocket server is not running in development');
          } else {
            console.warn('WebSocket connection timeout');
          }
          this.cleanup();
          this.handleReconnect();
        }
      }, 5000); // 5 second timeout

      this.socket.onopen = (event) => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.isConnecting = false;
        this.retryCount = 0;
        this.retryDelay = 1000;
        this.options.onOpen?.(event);
        this.emit('open', event);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.options.onMessage?.(message);
          this.emit('message', message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (event) => {
        // In development, only log the first error to avoid spam
        if (this.isDevelopment && this.retryCount === 0) {
          console.warn('WebSocket connection failed - this is normal if the WebSocket server is not running in development');
        } else if (!this.isDevelopment) {
          console.error('WebSocket error:', event);
        }
        
        this.cleanup();
        
        if (this.options.onError) {
          try {
            this.options.onError(event);
          } catch (error) {
            console.error('Error in onError callback:', error);
          }
        }

        if (this.listenerCount('error') > 0) {
          try {
            this.emit('error', event);
          } catch (error) {
            console.error('Error emitting error event:', error);
          }
        }

        this.handleReconnect();
      };

      this.socket.onclose = (event) => {
        // In development, only log the first close event to avoid spam
        if (this.isDevelopment && this.retryCount === 0) {
          console.warn('WebSocket connection closed - this is normal if the WebSocket server is not running in development');
        } else if (!this.isDevelopment) {
          console.warn('WebSocket connection closed:', event);
        }
        
        this.cleanup();
        
        if (this.options.onClose) {
          try {
            this.options.onClose(event);
          } catch (error) {
            console.error('Error in onClose callback:', error);
          }
        }

        try {
          this.emit('close', event);
        } catch (error) {
          console.error('Error emitting close event:', error);
        }

        if (!this.isManualClose) {
          this.handleReconnect();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.cleanup();
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.isManualClose) return;

    if (this.retryCount < 5) {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      this.reconnectTimeout = setTimeout(() => this.connect(), this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay);
      this.retryCount += 1;
    } else {
      if (this.isDevelopment) {
        console.warn('Max retry attempts reached. WebSocket server may not be running in development.');
      } else {
        console.error('Max retry attempts reached. Unable to reconnect WebSocket.');
      }
    }
  }

  public sendMessage(message: JSON) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else {
      if (this.isDevelopment) {
        console.warn('WebSocket is not open. Messages will be queued when connection is established.');
      } else {
        console.warn('WebSocket is not open. Unable to send message.');
      }
    }
  }

  public close() {
    this.isManualClose = true;
    this.cleanup();
  }
}