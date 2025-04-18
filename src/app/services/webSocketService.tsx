import { EventEmitter } from 'events';

interface WebSocketOptions {
  url: string;
  onMessage?: (message: any) => void;
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

  constructor(private options: WebSocketOptions) {
    super();
    this.url = options.url;
    this.connect();
  }

  private connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = (event) => {
      console.log('WebSocket connection established');
      this.retryCount = 0; // Reset retry count on successful connection
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
      console.error('WebSocket error:', event);
      this.options.onError?.(event);

      if (this.listenerCount('error') > 0) {
        this.emit('error', event);
      } else {
        console.warn('WebSocket error occurred, but no error listener is attached:', event);
      }
    };

    this.socket.onclose = (event) => {
      console.warn('WebSocket connection closed:', event);
      this.options.onClose?.(event);
      this.emit('close', event);

      if (!this.isManualClose && this.retryCount < 5) {
        console.log(`Retrying WebSocket connection in ${this.retryDelay / 1000} seconds...`);
        setTimeout(() => this.connect(), this.retryDelay);
        this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay); // Exponential backoff
        this.retryCount += 1;
      } else if (this.retryCount >= 5) {
        console.error('Max retry attempts reached. Unable to reconnect WebSocket.');
      }
    };
  }

  public sendMessage(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open. Unable to send message.');
    }
  }

  public close() {
    this.isManualClose = true;
    this.socket?.close();
  }
}