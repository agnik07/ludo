import React from 'react';
import { Player, PlayerColor } from '../types/ludo';
import { AVATARS } from './LoginScreen';
import { Bot, User, Globe, Trophy } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  speechBubble?: { text: string; emoji?: string } | null;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentTurn,
  speechBubble,
}) => {
  if (!player.isActive) return null;

  const finishedCount = player.tokens.filter((t) => t.isFinished).length;
  const avatarEmoji = AVATARS.find((a) => a.id === player.avatar)?.icon || '👑';

  const colorStyles: Record<PlayerColor, { border: string; bg: string; badge: string; text: string }> = {
    red: {
      border: 'border-red-500/50',
      bg: 'bg-red-500/15',
      badge: 'bg-red-500/20 text-red-300 border-red-500/30',
      text: 'text-red-400',
    },
    green: {
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-500/15',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      text: 'text-emerald-400',
    },
    yellow: {
      border: 'border-amber-500/50',
      bg: 'bg-amber-500/15',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      text: 'text-amber-400',
    },
    blue: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/15',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      text: 'text-blue-400',
    },
  };

  const style = colorStyles[player.color];

  return (
    <div
      className={`p-3 rounded-xl border relative transition-all ${
        isCurrentTurn
          ? `${style.bg} ${style.border} ring-2 ring-${player.color}-400/80 shadow-xl scale-102 animate-pulse`
          : 'bg-slate-900/40 border-slate-800 opacity-85'
      }`}
    >
      {/* Floating Animated Speech Bubble */}
      {speechBubble && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-slate-900 border border-indigo-400/70 text-white font-bold text-xs rounded-2xl shadow-xl animate-bounce whitespace-nowrap flex items-center gap-1">
          {speechBubble.emoji && <span className="text-base">{speechBubble.emoji}</span>}
          <span>{speechBubble.text}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-indigo-400/70 rotate-45" />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-xl">{avatarEmoji}</span>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm text-slate-200 truncate">{player.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
              {player.color}
            </span>
          </div>
        </div>

        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${style.badge}`}>
          {player.type === 'bot' ? (
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3" /> BOT
            </span>
          ) : player.type === 'remote' ? (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> ONLINE
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> YOU
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>
            <strong className="text-white">{finishedCount}</strong> / 4 Home
          </span>
        </div>

        {player.rank && (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-extrabold text-[11px] rounded border border-amber-500/40">
            #{player.rank} Place
          </span>
        )}
      </div>
    </div>
  );
};
