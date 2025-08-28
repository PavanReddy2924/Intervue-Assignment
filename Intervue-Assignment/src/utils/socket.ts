import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../config";

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

  connect(serverUrl: string = SOCKET_URL): Socket {
    if (!this.socket) {
      this.socket = io(serverUrl, {
        transports: ["websocket", "polling"],
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
