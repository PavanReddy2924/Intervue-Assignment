import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(serverUrl?: string): Socket {
    if (!this.socket) {
      // Determine the correct server URL based on the current environment
      let url = serverUrl;
      if (!url) {
        const currentOrigin = window.location.origin;
        if (currentOrigin.includes('webcontainer-api.io')) {
          // In webcontainer environment, use the same protocol and host but different port
          url = currentOrigin.replace(':5173', ':3001');
        } else if (currentOrigin.startsWith('https://')) {
          // If frontend is HTTPS, use HTTPS for backend too
          url = 'https://localhost:3001';
        } else {
          // Default to HTTP for local development
          url = 'http://localhost:3001';
        }
      }

      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
        timeout: 5000,
      });
    }
    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default SocketService;