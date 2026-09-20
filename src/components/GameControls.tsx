import React, { useState } from 'react';
import { GameState } from '../types/ludo';
import { Volume2, VolumeX, RotateCcw, Copy, Check, Scroll, Globe } from 'lucide-react';

interface GameControlsProps {
  gameState: GameState;
  onToggleSound: () => void;
  onRestartGame: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  onToggleSound,
  onRestartGame,
}) => {
  const [copied, setCopied] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const copyRoomLink = () => {
    if (!gameState.roomCode) return;
    const link = `${window.location.origin}${window.location.pathname}?room=${gameState.roomCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          {gameState.mode === 'online' && gameState.roomCode && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                {gameState.roomCode}
              </span>
              <button
                onClick={copyRoomLink}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="Copy Share Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showLogs
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Scroll className="w-4 h-4" /> Log
          </button>

          <button
            onClick={onToggleSound}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
            title={gameState.soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {gameState.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={onRestartGame}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
            title="New Game Setup"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Move History Drawer */}
      {showLogs && (
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto space-y-1.5 text-xs animate-fadeIn">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Game Activity Log
          </div>
          {gameState.logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-slate-300">
              <span>{log.text}</span>
              <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
