import React, { useEffect } from 'react';
import { GameState, PlayerColor } from '../types/ludo';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Award } from 'lucide-react';

interface WinModalProps {
  gameState: GameState;
  onPlayAgain: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({ gameState, onPlayAgain }) => {
  useEffect(() => {
    // Fire confetti celebration burst
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const firstWinnerColor = gameState.winnerOrder[0];
  const firstWinner = firstWinnerColor ? gameState.players[firstWinnerColor] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 space-y-6 border border-amber-500/30 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 animate-bounce">
          <Trophy className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
            GAME OVER!
          </h2>
          {firstWinner && (
            <p className="text-lg font-bold text-white">
              👑 {firstWinner.name} Wins First Place!
            </p>
          )}
        </div>

        {/* Leaderboard Ranks */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 text-left">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Final Standings
          </div>
          {gameState.winnerOrder.map((color, index) => {
            const player = gameState.players[color];
            const rankLabel = ['1st Place', '2nd Place', '3rd Place', '4th Place'][index];
            const medalEmoji = ['🥇', '🥈', '🥉', '🎗️'][index];

            return (
              <div
                key={color}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{medalEmoji}</span>
                  <span className="font-bold text-sm text-slate-200">{player.name}</span>
                </div>
                <span className="text-xs font-extrabold text-amber-300 px-2 py-1 bg-amber-500/10 rounded border border-amber-500/30">
                  {rankLabel}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-xl shadow-xl transition-transform active:scale-98 flex items-center justify-center gap-2 text-base"
        >
          <RotateCcw className="w-5 h-5" /> PLAY AGAIN
        </button>
      </div>
    </div>
  );
};
