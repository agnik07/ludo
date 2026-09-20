import React, { useState } from 'react';
import { AvatarId, PlayerColor, UserProfile } from '../types/ludo';
import { User, Sparkles, ArrowRight, Shield } from 'lucide-react';

interface LoginScreenProps {
  initialProfile?: UserProfile;
  onLogin: (profile: UserProfile) => void;
}

export const AVATARS: { id: AvatarId; label: string; icon: string }[] = [
  { id: 'king', label: 'King', icon: '👑' },
  { id: 'robot', label: 'Robot', icon: '🤖' },
  { id: 'ninja', label: 'Ninja', icon: '🥷' },
  { id: 'wizard', label: 'Wizard', icon: '🧙' },
  { id: 'dragon', label: 'Dragon', icon: '🐉' },
  { id: 'star', label: 'Star', icon: '⭐' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ initialProfile, onLogin }) => {
  const [name, setName] = useState(initialProfile?.name || 'Player 1');
  const [avatar, setAvatar] = useState<AvatarId>(initialProfile?.avatar || 'king');
  const [preferredColor, setPreferredColor] = useState<PlayerColor>(
    initialProfile?.preferredColor || 'red'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onLogin({
      name: name.trim(),
      avatar,
      preferredColor,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-6 sm:p-8 space-y-6 border border-slate-700/60 shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider border border-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Welcome to Ludo Master
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-400">
            PLAYER LOGIN
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Setup your player profile and choose your avatar to begin!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Player Name
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                required
                maxLength={15}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Avatar Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Choose Avatar
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => setAvatar(av.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    avatar === av.id
                      ? 'bg-indigo-600/30 border-indigo-400 ring-2 ring-indigo-400/50 scale-105'
                      : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-2xl">{av.icon}</span>
                  <span className="text-[11px] font-bold text-slate-200">{av.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Preference Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Preferred Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map((c) => {
                const colorBg = {
                  red: 'bg-red-500',
                  green: 'bg-emerald-500',
                  yellow: 'bg-amber-500',
                  blue: 'bg-blue-500',
                }[c];

                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setPreferredColor(c)}
                    className={`py-2.5 rounded-xl text-xs font-extrabold uppercase border flex items-center justify-center gap-1.5 transition-all ${
                      preferredColor === c
                        ? 'border-white text-white shadow-lg scale-105 bg-slate-800'
                        : 'border-slate-800 text-slate-400 bg-slate-900/40'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${colorBg}`} />
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-xl shadow-xl transition-transform active:scale-98 flex items-center justify-center gap-2 text-base tracking-wide"
          >
            <span>CONTINUE TO GAME LOBBY</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
