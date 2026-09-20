import React, { useState } from 'react';
import { GameState } from '../types/ludo';
import { copyToClipboard } from '../utils/multiplayer';
import { ChatDrawer } from './ChatDrawer';
import { Volume2, VolumeX, Copy, Check, Scroll, Globe, LogOut, MessageSquare } from 'lucide-react';

interface GameControlsProps {
  gameState: GameState;
  onToggleSound: () => void;
  onExitGame: () => void;
  onSendMessage: (text: string, emoji?: string) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  onToggleSound,
  onExitGame,
  onSendMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleCopyRoomLink = async () => {
    if (!gameState.roomCode) return;
    const link = `${window.location.origin}${window.location.pathname}?room=${gameState.roomCode}`;
    const ok = await copyToClipboard(link);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow-lg">
        {/* Left Side: Exit Button & Room Code */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-all"
            title="Exit to Lobby"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit Game</span>
          </button>

          {gameState.mode === 'online' && gameState.roomCode && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                {gameState.roomCode}
              </span>
              <button
                onClick={handleCopyRoomLink}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                title="Copy Share Link"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Chat & Log Drawer & Sound */}
        <div className="flex items-center gap-2">
          {/* Chat Button */}
          <button
            onClick={() => setShowChat(true)}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            title="Open Chat & Emotes"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </button>

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
        </div>
      </div>

      {/* Chat & Emotes Modal Drawer */}
      {showChat && (
        <ChatDrawer
          messages={gameState.chatMessages || []}
          onSendMessage={onSendMessage}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm glass-panel p-6 space-y-4 border border-red-500/30 text-center">
            <h3 className="text-xl font-bold text-white">Exit Current Game?</h3>
            <p className="text-slate-300 text-xs">
              Are you sure you want to leave this game? Your match progress will be lost.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  onExitGame();
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Yes, Exit Game
              </button>
            </div>
          </div>
        </div>
      )}

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
