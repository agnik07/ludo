export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type PlayerType = 'human' | 'bot' | 'remote';

export type GameMode = 'local' | 'online';

export interface GridPos {
  row: number; // 1 to 15 (1-indexed for CSS grid)
  col: number; // 1 to 15 (1-indexed for CSS grid)
}

export interface Token {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  step: number; // -1: in home yard; 0 to 51: main path; 52 to 56: home stretch; 57: finished home!
  isFinished: boolean;
}

export interface Player {
  color: PlayerColor;
  name: string;
  type: PlayerType;
  peerId?: string; // WebRTC Peer ID if remote player
  isActive: boolean;
  tokens: Token[];
  rank?: number; // 1 for winner, 2 for runner up, etc.
}

export interface GameLog {
  id: string;
  time: string;
  text: string;
  color?: PlayerColor;
}

export interface GameState {
  mode: GameMode;
  roomCode?: string;
  isHost?: boolean;
  players: Record<PlayerColor, Player>;
  turnOrder: PlayerColor[];
  currentTurnIndex: number;
  diceValue: number | null;
  isRolling: boolean;
  canRoll: boolean;
  consecutiveSixes: number;
  hasRolledSix: boolean;
  winnerOrder: PlayerColor[];
  gameStatus: 'setup' | 'playing' | 'finished';
  logs: GameLog[];
  selectedTokenId: number | null;
  validTokenMoves: number[]; // token IDs that can legally move with current diceValue
  soundEnabled: boolean;
}

export type NetworkMessageType =
  | 'JOIN_REQUEST'
  | 'JOIN_ACCEPT'
  | 'JOIN_REJECT'
  | 'STATE_SYNC'
  | 'ROLL_DICE'
  | 'MOVE_TOKEN'
  | 'RESTART_GAME'
  | 'PLAYER_UPDATE'
  | 'HEARTBEAT';

export interface NetworkMessage {
  type: NetworkMessageType;
  senderPeerId: string;
  senderName?: string;
  roomCode?: string;
  color?: PlayerColor;
  diceValue?: number;
  tokenId?: number;
  gameState?: Partial<GameState>;
  payload?: any;
}
