export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type PlayerType = 'human' | 'bot' | 'remote';

export type GameMode = 'local' | 'online';

export type AvatarId = 'king' | 'robot' | 'ninja' | 'wizard' | 'dragon' | 'star';

export interface UserProfile {
  name: string;
  avatar: AvatarId;
  preferredColor: PlayerColor;
}

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
  avatar?: AvatarId;
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

export interface ChatMessage {
  id: string;
  senderName: string;
  color: PlayerColor;
  text: string;
  emoji?: string;
  time: string;
}

export interface StatusBanner {
  text: string;
  type: 'info' | 'warning' | 'success';
}

export interface GameState {
  screen: 'login' | 'setup' | 'playing' | 'finished';
  mode: GameMode;
  maxOnlinePlayers?: number; // 2, 3, or 4
  roomCode?: string;
  isHost?: boolean;
  players: Record<PlayerColor, Player>;
  turnOrder: PlayerColor[];
  currentTurnIndex: number;
  diceValue: number | null;
  isRolling: boolean;
  isAnimatingMove: boolean; // True while token is taking step-by-step walkable hops
  canRoll: boolean;
  consecutiveSixes: number;
  hasRolledSix: boolean;
  winnerOrder: PlayerColor[];
  gameStatus: 'setup' | 'playing' | 'finished';
  logs: GameLog[];
  chatMessages: ChatMessage[];
  activeSpeechBubble?: { color: PlayerColor; text: string; emoji?: string; timestamp: number } | null;
  selectedTokenId: number | null;
  validTokenMoves: number[]; // token IDs that can legally move with current diceValue
  soundEnabled: boolean;
  statusBanner?: StatusBanner | null;
}

export type NetworkMessageType =
  | 'JOIN_REQUEST'
  | 'JOIN_ACCEPT'
  | 'JOIN_REJECT'
  | 'STATE_SYNC'
  | 'ROLL_DICE'
  | 'MOVE_TOKEN'
  | 'CHAT_MESSAGE'
  | 'RESTART_GAME'
  | 'PLAYER_UPDATE'
  | 'HEARTBEAT';

export interface NetworkMessage {
  type: NetworkMessageType;
  senderPeerId: string;
  senderName?: string;
  senderAvatar?: AvatarId;
  roomCode?: string;
  color?: PlayerColor;
  diceValue?: number;
  tokenId?: number;
  chatMessage?: ChatMessage;
  gameState?: Partial<GameState>;
  payload?: any;
}
