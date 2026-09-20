import Peer, { DataConnection } from 'peerjs';
import { NetworkMessage, GameState, PlayerColor } from '../types/ludo';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class PeerNetwork {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  public peerId: string = '';
  public isHost: boolean = false;
  public roomCode: string = '';

  private onMessageCallback?: (msg: NetworkMessage, conn: DataConnection) => void;
  private onConnectCallback?: (peerId: string) => void;
  private onDisconnectCallback?: (peerId: string) => void;

  constructor() {}

  public initHost(
    roomCode: string,
    onMessage: (msg: NetworkMessage, conn: DataConnection) => void,
    onConnect?: (peerId: string) => void,
    onDisconnect?: (peerId: string) => void
  ): Promise<string> {
    this.isHost = true;
    this.roomCode = roomCode;
    this.onMessageCallback = onMessage;
    this.onConnectCallback = onConnect;
    this.onDisconnectCallback = onDisconnect;

    const hostPeerId = `ludo-app-room-${roomCode.toUpperCase()}`;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(hostPeerId, {
        debug: 1,
      });

      this.peer.on('open', (id) => {
        this.peerId = id;
        console.log('[Multiplayer Host] Opened room:', id);
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        console.log('[Multiplayer Host] Incoming connection from:', conn.peer);
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('[Multiplayer Host Error]', err);
        // If ID taken, try generating alternative ID
        if (err.type === 'unavailable-id') {
          reject(new Error('Room code already in use. Please try creating a new room code.'));
        } else {
          reject(err);
        }
      });
    });
  }

  public joinRoom(
    roomCode: string,
    onMessage: (msg: NetworkMessage, conn: DataConnection) => void,
    onConnect?: (peerId: string) => void,
    onDisconnect?: (peerId: string) => void
  ): Promise<string> {
    this.isHost = false;
    this.roomCode = roomCode;
    this.onMessageCallback = onMessage;
    this.onConnectCallback = onConnect;
    this.onDisconnectCallback = onDisconnect;

    const hostPeerId = `ludo-app-room-${roomCode.toUpperCase()}`;

    return new Promise((resolve, reject) => {
      this.peer = new Peer({
        debug: 1,
      });

      this.peer.on('open', (id) => {
        this.peerId = id;
        console.log('[Multiplayer Client] Open peer ID:', id);

        // Connect to host
        const conn = this.peer!.connect(hostPeerId, {
          reliable: true,
        });

        this.setupConnection(conn);

        conn.on('open', () => {
          console.log('[Multiplayer Client] Connected to host room');
          resolve(id);
        });

        conn.on('error', (err) => {
          console.error('[Multiplayer Client Connect Error]', err);
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        console.error('[Multiplayer Client Error]', err);
        reject(err);
      });
    });
  }

  private setupConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);

    conn.on('open', () => {
      if (this.onConnectCallback) {
        this.onConnectCallback(conn.peer);
      }
    });

    conn.on('data', (data: any) => {
      try {
        const msg = data as NetworkMessage;
        if (this.onMessageCallback) {
          this.onMessageCallback(msg, conn);
        }
      } catch (e) {
        console.error('Failed to parse network message', e);
      }
    });

    conn.on('close', () => {
      console.log('[Multiplayer] Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      if (this.onDisconnectCallback) {
        this.onDisconnectCallback(conn.peer);
      }
    });

    conn.on('error', (err) => {
      console.error('[Multiplayer Connection Error]', conn.peer, err);
    });
  }

  public broadcast(msg: NetworkMessage) {
    msg.senderPeerId = this.peerId;
    const dataStr = JSON.stringify(msg);
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  public sendTo(peerId: string, msg: NetworkMessage) {
    msg.senderPeerId = this.peerId;
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(msg);
    }
  }

  public disconnect() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const peerNetwork = new PeerNetwork();
