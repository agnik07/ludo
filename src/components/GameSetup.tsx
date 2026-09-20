import React, { useState } from 'react';
import { GameMode, PlayerColor, PlayerType, UserProfile, AvatarId } from '../types/ludo';
import { generateRoomCode } from '../utils/multiplayer';
import { AVATARS } from './LoginScreen';
import { Users, Globe, Play, Copy, Check, Bot, User, Sparkles, ArrowLeft } from 'lucide-react';

interface GameSetupProps {
  userProfile: UserProfile;
  onBackToLogin: () => void;
  onStartLocalGame: (
    configs: Record<PlayerColor, { name: string; avatar?: AvatarId; type: PlayerType; isActive: boolean }>
  ) => void;
  onHostOnlineRoom: (
    roomCode: string,
    hostColor: PlayerColor,
    hostName: string,
    hostAvatar: AvatarId
  ) => void;
  onJoinOnlineRoom: (roomCode: string, playerName: string, playerAvatar: AvatarId) => void;
  isConnecting: boolean;
  errorMessage: string | null;
}

export const GameSetup: React.FC<GameSetupProps> = ({
  userProfile,
  onBackToLogin,
  onStartLocalGame,
  onHostOnlineRoom,
  onJoinOnlineRoom,
  isConnecting,
  errorMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'host' | 'join'>('local');

  // Local game state setup
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [localPlayers, setLocalPlayers] = useState<
    Record<PlayerColor, { name: string; avatar?: AvatarId; type: PlayerType; isActive: boolean }>
  >({
    red: { name: userProfile.name, avatar: userProfile.avatar, type: 'human', isActive: true },
    green: { name: 'Green Bot', avatar: 'robot', type: 'bot', isActive: true },
    yellow: { name: 'Yellow Bot', avatar: 'wizard', type: 'bot', isActive: true },
    blue: { name: 'Blue Bot', avatar: 'ninja', type: 'bot', isActive: true },
  });

  // Online Room setup
  const [hostName, setHostName] = useState(userProfile.name);
  const [hostColor, setHostColor] = useState<PlayerColor>(userProfile.preferredColor);
  const [createdCode, setCreatedCode] = useState(() => generateRoomCode());
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinNameInput, setJoinNameInput] = useState(userProfile.name);
  const [copiedLink, setCopiedLink] = useState(false);

  // Check URL query param for auto-fill room code
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCodeInput(roomParam.toUpperCase());
      setActiveTab('join');
    }
  }, []);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    const updated = { ...localPlayers };

    colors.forEach((color, index) => {
      if (index < count) {
        updated[color].isActive = true;
        if (index === 0) {
          updated[color].type = 'human';
          updated[color].name = userProfile.name;
          updated[color].avatar = userProfile.avatar;
        } else {
          updated[color].type = count === 1 ? 'bot' : 'human';
          updated[color].name = count === 1 ? `${color.toUpperCase()} Bot` : `Player ${index + 1}`;
          updated[color].avatar = AVATARS[index % AVATARS.length].id;
        }
      } else {
        updated[color].isActive = false;
      }
    });

    setLocalPlayers(updated);
  };

  const copyShareableLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?room=${createdCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const userAvatarIcon = AVATARS.find((a) => a.id === userProfile.avatar)?.icon || '👑';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl glass-panel p-6 sm:p-8 space-y-6 border border-slate-700/50 relative animate-fadeIn">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Change Profile
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-full border border-slate-800 text-xs font-bold text-slate-200">
            <span>{userAvatarIcon}</span>
            <span>{userProfile.name}</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-400">
            GAME LOBBY
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Select Game Mode & Customize Players/Opponents
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'local'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Local / AI
          </button>
          <button
            onClick={() => setActiveTab('host')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'host'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" /> Host Room
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'join'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" /> Join Room
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg text-center">
            {errorMessage}
          </div>
        )}

        {/* TAB 1: LOCAL PLAY / VS AI */}
        {activeTab === 'local' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Select Active Players
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => handlePlayerCountChange(count)}
                    className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${
                      playerCount === count
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md scale-105'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {count} {count === 1 ? 'Player' : 'Players'}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Customization */}
            <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
              {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map((color) => {
                const conf = localPlayers[color];
                if (!conf.isActive) return null;

                const colorBadgeClass = {
                  red: 'bg-red-500/20 text-red-400 border-red-500/30',
                  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                  yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                }[color];

                return (
                  <div key={color} className="flex items-center gap-3">
                    <div
                      className={`w-24 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase border flex items-center justify-center gap-1 ${colorBadgeClass}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full bg-${color}-500`} />
                      {color}
                    </div>

                    <input
                      type="text"
                      value={conf.name}
                      onChange={(e) =>
                        setLocalPlayers({
                          ...localPlayers,
                          [color]: { ...conf, name: e.target.value },
                        })
                      }
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder={`${color} player name`}
                    />

                    <button
                      onClick={() =>
                        setLocalPlayers({
                          ...localPlayers,
                          [color]: {
                            ...conf,
                            type: conf.type === 'human' ? 'bot' : 'human',
                          },
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        conf.type === 'bot'
                          ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {conf.type === 'bot' ? (
                        <>
                          <Bot className="w-3.5 h-3.5" /> Bot
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5" /> Human
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onStartLocalGame(localPlayers)}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-xl shadow-xl transition-transform active:scale-98 flex items-center justify-center gap-2 text-base tracking-wide"
            >
              <Play className="w-5 h-5 fill-current" /> START GAME NOW
            </button>
          </div>
        )}

        {/* TAB 2: HOST ONLINE ROOM */}
        {activeTab === 'host' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  Your Room Code
                </span>
                <button
                  onClick={() => setCreatedCode(generateRoomCode())}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  Generate New
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-2xl font-black text-emerald-400 tracking-widest font-mono">
                  {createdCode}
                </span>
                <button
                  onClick={copyShareableLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold transition-all"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Host Name
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Choose Your Color Position
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setHostColor(c)}
                      className={`py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                        hostColor === c
                          ? 'border-white text-white shadow-md scale-105 bg-slate-700'
                          : 'border-slate-800 text-slate-400 bg-slate-900/60'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onHostOnlineRoom(createdCode, hostColor, hostName, userProfile.avatar)}
              disabled={isConnecting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-extrabold rounded-xl shadow-xl transition-transform active:scale-98 flex items-center justify-center gap-2 text-base"
            >
              {isConnecting ? (
                <span>Creating Room...</span>
              ) : (
                <>
                  <Globe className="w-5 h-5" /> CREATE ONLINE ROOM
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 3: JOIN ONLINE ROOM */}
        {activeTab === 'join' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enter 6-Digit Room Code
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. LUDO7X"
                  maxLength={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-xl font-bold tracking-widest text-amber-400 text-center uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Player Name
                </label>
                <input
                  type="text"
                  value={joinNameInput}
                  onChange={(e) => setJoinNameInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={() => onJoinOnlineRoom(joinCodeInput, joinNameInput, userProfile.avatar)}
              disabled={isConnecting || !joinCodeInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-95 text-white font-extrabold rounded-xl shadow-xl transition-transform active:scale-98 flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {isConnecting ? (
                <span>Connecting to Room...</span>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> JOIN ONLINE ROOM
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
