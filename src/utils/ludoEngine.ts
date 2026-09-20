import {
  GameState,
  Player,
  PlayerColor,
  PlayerType,
  Token,
  GameLog,
  GameMode,
} from '../types/ludo';
import {
  COLOR_START_OFFSET,
  getMainPathIndex,
  isSafeTile,
} from './ludoBoard';

export const ALL_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export function createInitialGameState(
  mode: GameMode = 'local',
  playerConfigs: Partial<Record<PlayerColor, { name: string; type: PlayerType; isActive: boolean }>> = {},
  roomCode?: string,
  isHost?: boolean
): GameState {
  const defaultConfigs: Record<PlayerColor, { name: string; type: PlayerType; isActive: boolean }> = {
    red: { name: 'Red Player', type: 'human', isActive: true },
    green: { name: 'Green Player', type: 'bot', isActive: true },
    yellow: { name: 'Yellow Player', type: 'bot', isActive: true },
    blue: { name: 'Blue Player', type: 'bot', isActive: true },
  };

  const finalConfigs = { ...defaultConfigs, ...playerConfigs };

  const players: Record<PlayerColor, Player> = {} as any;
  const turnOrder: PlayerColor[] = [];

  ALL_COLORS.forEach((color) => {
    const config = finalConfigs[color];
    const tokens: Token[] = [0, 1, 2, 3].map((id) => ({
      id,
      color,
      step: -1, // -1 means in Yard
      isFinished: false,
    }));

    players[color] = {
      color,
      name: config.name,
      type: config.type,
      isActive: config.isActive,
      tokens,
    };

    if (config.isActive) {
      turnOrder.push(color);
    }
  });

  const firstTurn = turnOrder.length > 0 ? turnOrder[0] : 'red';

  return {
    screen: 'playing',
    mode,
    roomCode,

    isHost,
    players,
    turnOrder,
    currentTurnIndex: 0,
    diceValue: null,
    isRolling: false,
    canRoll: true,
    consecutiveSixes: 0,
    hasRolledSix: false,
    winnerOrder: [],
    gameStatus: 'playing',
    logs: [
      {
        id: '1',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `🎮 Game started! ${players[firstTurn].name}'s turn.`,
        color: firstTurn,
      },
    ],
    selectedTokenId: null,
    validTokenMoves: [],
    soundEnabled: true,
  };
}

/**
 * Calculate valid token IDs for active player given dice value
 */
export function calculateValidMoves(state: GameState, diceValue: number): number[] {
  const activeColor = state.turnOrder[state.currentTurnIndex];
  if (!activeColor) return [];

  const player = state.players[activeColor];
  if (!player || !player.isActive) return [];

  const validIds: number[] = [];

  player.tokens.forEach((token) => {
    if (token.isFinished) return;

    // Token in Yard: Needs a 6 to step out to Start position (step 0)
    if (token.step === -1) {
      if (diceValue === 6) {
        validIds.push(token.id);
      }
    } else {
      // Token on Track or Home Stretch: Must not exceed finish (step 57)
      if (token.step + diceValue <= 57) {
        validIds.push(token.id);
      }
    }
  });

  return validIds;
}

/**
 * Advance turn to next active non-won player
 */
export function getNextTurnIndex(state: GameState): number {
  let nextIdx = (state.currentTurnIndex + 1) % state.turnOrder.length;
  // Loop to find next active player who hasn't completed all tokens
  for (let i = 0; i < state.turnOrder.length; i++) {
    const color = state.turnOrder[nextIdx];
    const player = state.players[color];
    const hasWon = player.tokens.every((t) => t.isFinished);
    if (!hasWon) {
      return nextIdx;
    }
    nextIdx = (nextIdx + 1) % state.turnOrder.length;
  }
  return state.currentTurnIndex;
}

/**
 * Process a token move execution on GameState
 */
export function executeMoveToken(
  state: GameState,
  color: PlayerColor,
  tokenId: number,
  diceValue: number
): { newState: GameState; extraTurn: boolean; capturedColor?: PlayerColor } {
  const newState: GameState = JSON.parse(JSON.stringify(state));
  const player = newState.players[color];
  const token = player.tokens.find((t) => t.id === tokenId);

  if (!token) {
    return { newState, extraTurn: false };
  }

  let extraTurn = false;
  let capturedColor: PlayerColor | undefined = undefined;

  // Move token
  if (token.step === -1) {
    token.step = 0; // Exit yard to start position
  } else {
    token.step += diceValue;
  }

  // Check if reached finish (57)
  if (token.step === 57) {
    token.isFinished = true;
    extraTurn = true; // Bonus turn for finishing a token

    addLog(newState, `🎉 ${player.name} got token #${token.id + 1} into HOME!`, color);

    // Check if all 4 tokens finished
    const allFinished = player.tokens.every((t) => t.isFinished);
    if (allFinished && !newState.winnerOrder.includes(color)) {
      newState.winnerOrder.push(color);
      player.rank = newState.winnerOrder.length;
      addLog(newState, `🏆 ${player.name} finished in ${ordinal(player.rank)} Place!`, color);

      // Check game end condition
      const activeUnfinished = newState.turnOrder.filter(
        (c) => !newState.players[c].tokens.every((t) => t.isFinished)
      );
      if (activeUnfinished.length <= 1) {
        newState.gameStatus = 'finished';
        if (activeUnfinished.length === 1) {
          const lastColor = activeUnfinished[0];
          newState.winnerOrder.push(lastColor);
          newState.players[lastColor].rank = newState.winnerOrder.length;
        }
      }
    }
  }

  // Check capture on main track (0 <= step < 52)
  if (token.step >= 0 && token.step < 52) {
    const landingPathIndex = getMainPathIndex(color, token.step);

    if (landingPathIndex !== null && !isSafeTile(landingPathIndex)) {
      // Look for opponent tokens on the exact landing tile
      Object.keys(newState.players).forEach((otherColorKey) => {
        const otherColor = otherColorKey as PlayerColor;
        if (otherColor === color) return;

        const otherPlayer = newState.players[otherColor];
        if (!otherPlayer.isActive) return;

        otherPlayer.tokens.forEach((otherToken) => {
          if (otherToken.step >= 0 && otherToken.step < 52) {
            const otherPathIdx = getMainPathIndex(otherColor, otherToken.step);
            if (otherPathIdx === landingPathIndex) {
              // CAPTURE! Send opponent token back to yard (-1)
              otherToken.step = -1;
              extraTurn = true; // Bonus turn for capturing!
              capturedColor = otherColor;
              addLog(
                newState,
                `⚔️ ${player.name} captured ${otherPlayer.name}'s token!`,
                color
              );
            }
          }
        });
      });
    }
  }

  // Check extra turn for rolling 6 (if not 3rd consecutive 6)
  if (diceValue === 6 && newState.consecutiveSixes < 3) {
    extraTurn = true;
  }

  // Reset roll state
  newState.diceValue = null;
  newState.validTokenMoves = [];
  newState.canRoll = true;

  if (extraTurn && newState.gameStatus === 'playing') {
    addLog(newState, `✨ ${player.name} earned an extra roll!`, color);
  } else if (newState.gameStatus === 'playing') {
    newState.consecutiveSixes = 0;
    newState.currentTurnIndex = getNextTurnIndex(newState);
    const nextColor = newState.turnOrder[newState.currentTurnIndex];
    addLog(newState, `🎲 ${newState.players[nextColor].name}'s turn.`, nextColor);
  }

  return { newState, extraTurn, capturedColor };
}

/**
 * AI Bot Decision Heuristic algorithm
 */
export function selectBotToken(state: GameState, validIds: number[]): number | null {
  if (validIds.length === 0) return null;
  if (validIds.length === 1) return validIds[0];

  const activeColor = state.turnOrder[state.currentTurnIndex];
  const player = state.players[activeColor];
  const diceValue = state.diceValue || 1;

  let bestTokenId = validIds[0];
  let highestScore = -9999;

  validIds.forEach((id) => {
    const token = player.tokens.find((t) => t.id === id);
    if (!token) return;

    let score = 0;

    // 1. Reaching home finish (step 57) is top priority (+5000)
    if (token.step + diceValue === 57) {
      score += 5000;
    }

    // 2. Capturing an opponent token (+3000)
    if (token.step + diceValue < 52 && token.step + diceValue >= 0) {
      const targetStep = token.step === -1 ? 0 : token.step + diceValue;
      const landingPathIdx = getMainPathIndex(activeColor, targetStep);
      if (landingPathIdx !== null && !isSafeTile(landingPathIdx)) {
        Object.keys(state.players).forEach((otherKey) => {
          const otherColor = otherKey as PlayerColor;
          if (otherColor === activeColor) return;
          state.players[otherColor].tokens.forEach((ot) => {
            if (ot.step >= 0 && ot.step < 52) {
              if (getMainPathIndex(otherColor, ot.step) === landingPathIdx) {
                score += 3000;
              }
            }
          });
        });
      }

      // 3. Landing on a safe star spot (+1500)
      if (landingPathIdx !== null && isSafeTile(landingPathIdx)) {
        score += 1500;
      }
    }

    // 4. Exiting Yard on rolling 6 (+1000)
    if (token.step === -1 && diceValue === 6) {
      score += 1000;
    }

    // 5. Advancing token that is furthest along track (+ step value * 10)
    if (token.step >= 0) {
      score += token.step * 10;
    }

    if (score > highestScore) {
      highestScore = score;
      bestTokenId = id;
    }
  });

  return bestTokenId;
}

export function addLog(state: GameState, text: string, color?: PlayerColor) {
  const newLog: GameLog = {
    id: Math.random().toString(36).substring(2, 9),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    text,
    color,
  };
  state.logs = [newLog, ...state.logs.slice(0, 49)];
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
