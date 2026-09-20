import React from 'react';
import { GameState, PlayerColor, Token } from '../types/ludo';
import { getTokenGridPos, SAFE_INDICES, MAIN_PATH } from '../utils/ludoBoard';
import { Star, Shield } from 'lucide-react';

interface LudoBoardProps {
  gameState: GameState;
  onSelectToken: (color: PlayerColor, tokenId: number) => void;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({ gameState, onSelectToken }) => {
  const activeColor = gameState.turnOrder[gameState.currentTurnIndex];

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

    return (
      <div
        key={key}
        className={`cell ${props.bg}`}
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
          onClick={() => isMovable && onSelectToken(color, token.id)}
          className={`ludo-token token-${color} ${isMovable ? 'movable' : ''}`}
        >
          <div className="w-2 h-2 rounded-full bg-white/80" />
        </div>
      );
    }

    // Stacked Multiple Tokens in same cell
    const isAnyMovable = tokensHere.some(
      ({ token, color }) => color === activeColor && gameState.validTokenMoves.includes(token.id)
    );

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {tokensHere.map(({ token, color }, idx) => {
          const isMovable =
            color === activeColor && gameState.validTokenMoves.includes(token.id);
          const offset = idx * 3;

          return (
            <div
              key={`${color}-${token.id}`}
              onClick={() => isMovable && onSelectToken(color, token.id)}
              className={`ludo-token token-${color} absolute ${isMovable ? 'movable' : ''}`}
              style={{
                width: '70%',
                height: '70%',
                transform: `translate(${offset}px, ${-offset}px)`,
                zIndex: 10 + idx,
              }}
            >
              <span className="text-[9px] font-black text-white">{token.id + 1}</span>
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
            <div key={token.id} className="yard-circle">
              {token.step === -1 && (
                <div
                  onClick={() => isMovable && onSelectToken(color, token.id)}
                  className={`ludo-token token-${color} ${isMovable ? 'movable' : ''}`}
                  style={{ width: '85%', height: '85%' }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white/90" />
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

  return (
    <div className="w-full flex justify-center items-center p-2">
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
