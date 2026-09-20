import React from 'react';
import { GameState, PlayerColor, Token } from '../types/ludo';
import { getTokenGridPos } from '../utils/ludoBoard';
import { Star, Shield, Info } from 'lucide-react';

interface LudoBoardProps {
  gameState: GameState;
  onSelectToken: (color: PlayerColor, tokenId: number) => void;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({ gameState, onSelectToken }) => {
  const activeColor = gameState.turnOrder[gameState.currentTurnIndex];
  const activePlayer = gameState.players[activeColor];

  // Helper to map grid (row, col) to cell type/color
  const getCellProperties = (row: number, col: number) => {
    // Red Home Stretch
    if (row === 8 && col >= 2 && col <= 6) return { bg: 'bg-path-red' };
    // Green Home Stretch
    if (col === 8 && row >= 2 && row <= 6) return { bg: 'bg-path-green' };
    // Yellow Home Stretch
    if (row === 8 && col >= 10 && col <= 14) return { bg: 'bg-path-yellow' };
    // Blue Home Stretch
    if (col === 8 && row >= 10 && row <= 14) return { bg: 'bg-path-blue' };

    // Start positions
    if (row === 7 && col === 2) return { bg: 'bg-path-red', isStart: true, color: 'red' };
    if (row === 2 && col === 9) return { bg: 'bg-path-green', isStart: true, color: 'green' };
    if (row === 9 && col === 14) return { bg: 'bg-path-yellow', isStart: true, color: 'yellow' };
    if (row === 14 && col === 7) return { bg: 'bg-path-blue', isStart: true, color: 'blue' };

    // Star Safe Tiles
    if (
      (row === 3 && col === 7) ||
      (row === 7 && col === 13) ||
      (row === 13 && col === 9) ||
      (row === 9 && col === 3)
    ) {
      return { isStar: true, bg: 'bg-safe' };
    }

    return { bg: 'bg-slate-900/60' };
  };

  // Collect token positions
  const tokenMap: Map<string, { token: Token; color: PlayerColor }[]> = new Map();

  Object.keys(gameState.players).forEach((colorKey) => {
    const color = colorKey as PlayerColor;
    const player = gameState.players[color];
    if (!player.isActive) return;

    player.tokens.forEach((token) => {
      const pos = getTokenGridPos(color, token.id, token.step);
      const key = `${pos.row}-${pos.col}`;
      if (!tokenMap.has(key)) {
        tokenMap.set(key, []);
      }
      tokenMap.get(key)!.push({ token, color });
    });
  });

  // Render individual grid cell
  const renderCell = (row: number, col: number) => {
    // Skip rendering if cell falls inside 6x6 Yard bases or 3x3 Center Home
    if (row <= 6 && col <= 6) return null; // Red Yard
    if (row <= 6 && col >= 10) return null; // Green Yard
    if (row >= 10 && col <= 6) return null; // Blue Yard
    if (row >= 10 && col >= 10) return null; // Yellow Yard
    if (row >= 7 && row <= 9 && col >= 7 && col <= 9) return null; // Center Home

    const props = getCellProperties(row, col);
    const key = `${row}-${col}`;
    const tokensHere = tokenMap.get(key) || [];

    // Check if cell contains a movable token
    const movableToken = tokensHere.find(
      ({ token, color }) => color === activeColor && gameState.validTokenMoves.includes(token.id)
    );

    return (
      <div
        key={key}
        onClick={() => movableToken && onSelectToken(movableToken.color, movableToken.token.id)}
        className={`cell ${props.bg} ${movableToken ? 'cursor-pointer ring-2 ring-white/60' : ''}`}
        style={{ gridRow: row, gridColumn: col }}
      >
        {props.isStar && (
          <Star className="w-4 h-4 text-amber-300 opacity-60 pointer-events-none stroke-[2.5]" />
        )}
        {props.isStart && (
          <Shield className="w-3.5 h-3.5 text-white/50 pointer-events-none" />
        )}

        {/* Tokens inside cell */}
        {renderTokensInCell(tokensHere)}
      </div>
    );
  };

  const renderTokensInCell = (tokensHere: { token: Token; color: PlayerColor }[]) => {
    if (tokensHere.length === 0) return null;

    // Single Token
    if (tokensHere.length === 1) {
      const { token, color } = tokensHere[0];
      const isMovable =
        color === activeColor && gameState.validTokenMoves.includes(token.id);

      return (
        <div
          onClick={(e) => {
            if (isMovable) {
              e.stopPropagation();
              onSelectToken(color, token.id);
            }
          }}
          className={`ludo-token token-${color} ${isMovable ? 'movable' : ''}`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
        </div>
      );
    }

    // Stacked Multiple Tokens in same cell
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {tokensHere.map(({ token, color }, idx) => {
          const isMovable =
            color === activeColor && gameState.validTokenMoves.includes(token.id);
          const offset = idx * 3;

          return (
            <div
              key={`${color}-${token.id}`}
              onClick={(e) => {
                if (isMovable) {
                  e.stopPropagation();
                  onSelectToken(color, token.id);
                }
              }}
              className={`ludo-token token-${color} absolute ${isMovable ? 'movable' : ''}`}
              style={{
                width: '75%',
                height: '75%',
                transform: `translate(${offset}px, ${-offset}px)`,
                zIndex: 10 + idx,
              }}
            >
              <span className="text-[10px] font-black text-white">{token.id + 1}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderYardTokens = (color: PlayerColor) => {
    const player = gameState.players[color];
    if (!player.isActive) return null;

    return (
      <div className="yard-inner">
        {player.tokens.map((token) => {
          const isMovable =
            color === activeColor &&
            token.step === -1 &&
            gameState.validTokenMoves.includes(token.id);

          return (
            <div
              key={token.id}
              onClick={() => isMovable && onSelectToken(color, token.id)}
              className={`yard-circle ${isMovable ? 'cursor-pointer ring-2 ring-white/80 animate-pulse' : ''}`}
            >
              {token.step === -1 && (
                <div
                  className={`ludo-token token-${color} ${isMovable ? 'movable' : ''}`}
                  style={{ width: '90%', height: '90%' }}
                >
                  <div className="w-3 h-3 rounded-full bg-white/90" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const cells = [];
  for (let r = 1; r <= 15; r++) {
    for (let c = 1; c <= 15; c++) {
      cells.push(renderCell(r, c));
    }
  }

  // Instruction banner for active player
  let helperText = '';
  if (gameState.validTokenMoves.length > 0) {
    if (gameState.diceValue === 6) {
      helperText = `🎉 You rolled a 6! Tap any highlighted ${activeColor.toUpperCase()} token to release it from yard!`;
    } else {
      helperText = `👉 Tap any highlighted ${activeColor.toUpperCase()} token to move ${gameState.diceValue} steps!`;
    }
  }

  return (
    <div className="w-full flex flex-col items-center gap-2">
      {/* Helper Banner */}
      {helperText && (
        <div className="w-full max-w-md px-3 py-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-indigo-200 animate-fadeIn">
          <Info className="w-4 h-4 shrink-0 text-indigo-400" />
          <span className="text-center">{helperText}</span>
        </div>
      )}

      {/* 15x15 Ludo Board Grid */}
      <div className="ludo-grid">
        {/* Yard Base: Red */}
        <div className="yard-red">{renderYardTokens('red')}</div>

        {/* Yard Base: Green */}
        <div className="yard-green">{renderYardTokens('green')}</div>

        {/* Yard Base: Yellow */}
        <div className="yard-yellow">{renderYardTokens('yellow')}</div>

        {/* Yard Base: Blue */}
        <div className="yard-blue">{renderYardTokens('blue')}</div>

        {/* Center Home */}
        <div className="center-home">
          <div className="triangle-top" />
          <div className="triangle-right" />
          <div className="triangle-bottom" />
          <div className="triangle-left" />

          {/* Home Finished Tokens */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-7 h-7 rounded-full bg-slate-950/90 border border-amber-400/50 flex items-center justify-center text-xs font-black text-amber-300">
              🏆
            </div>
          </div>
        </div>

        {/* 15x15 Track Cells */}
        {cells}
      </div>
    </div>
  );
};
