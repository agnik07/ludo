import React, { useState, useEffect, useRef } from 'react';
import {
  GameState,
  PlayerColor,
  PlayerType,
  NetworkMessage,
  UserProfile,
  AvatarId,
  ChatMessage,
} from './types/ludo';
import {
  createInitialGameState,
  calculateValidMoves,
  executeMoveToken,
  selectBotToken,
  addLog,
  getNextTurnIndex,
  getOppositeColor,
} from './utils/ludoEngine';
import { peerNetwork } from './utils/multiplayer';
import { audioSystem } from './utils/audio';
import { LoginScreen } from './components/LoginScreen';
import { GameSetup } from './components/GameSetup';
import { LudoBoard } from './components/LudoBoard';
import { Dice3D } from './components/Dice3D';
import { PlayerCard } from './components/PlayerCard';
import { GameControls } from './components/GameControls';
import { WinModal } from './components/WinModal';

export function App() {
  const [screen, setScreen] = useState<'login' | 'setup' | 'playing'>('login');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localColor, setLocalColor] = useState<PlayerColor | null>(null);

  const gameStateRef = useRef<GameState | null>(null);
  gameStateRef.current = gameState;

  // Sound effect state sync
  useEffect(() => {
    if (gameState) {
      audioSystem.enabled = gameState.soundEnabled;
    }
  }, [gameState?.soundEnabled]);

  // Handle Login Screen Profile Submit
  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile);
    setScreen('setup');
  };

  // Host Online Room
  const handleHostOnlineRoom = async (
    roomCode: string,
    hostColor: PlayerColor,
    hostName: string,
    hostAvatar: AvatarId,
    maxPlayers: number
  ) => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      const playerConfigs: Partial<
        Record<PlayerColor, { name: string; avatar?: AvatarId; type: PlayerType; isActive: boolean }>
      > = {
        red: { name: 'Empty Slot', avatar: 'robot', type: 'bot', isActive: false },
        green: { name: 'Empty Slot', avatar: 'ninja', type: 'bot', isActive: false },
        yellow: { name: 'Empty Slot', avatar: 'wizard', type: 'bot', isActive: false },
        blue: { name: 'Empty Slot', avatar: 'dragon', type: 'bot', isActive: false },
      };

      playerConfigs[hostColor] = {
        name: hostName,
        avatar: hostAvatar,
        type: 'human',
        isActive: true,
      };

      if (maxPlayers === 2) {
        const oppositeColor = getOppositeColor(hostColor);
        playerConfigs[oppositeColor] = {
          name: 'Waiting for Friend...',
          avatar: 'star',
          type: 'remote',
          isActive: true,
        };
      } else if (maxPlayers === 3) {
        const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
        const otherColors = colors.filter((c) => c !== hostColor).slice(0, 2);
        otherColors.forEach((c) => {
          playerConfigs[c] = {
            name: 'Waiting for Player...',
            avatar: 'star',
            type: 'remote',
            isActive: true,
          };
        });
      } else {
        (['red', 'green', 'yellow', 'blue'] as PlayerColor[]).forEach((c) => {
          if (c !== hostColor) {
            playerConfigs[c] = {
              name: 'Waiting for Player...',
              avatar: 'star',
              type: 'remote',
              isActive: true,
            };
          }
        });
      }

      const initialState = createInitialGameState('online', playerConfigs, roomCode, true, maxPlayers);

      await peerNetwork.initHost(
        roomCode,
        (msg, conn) => handleNetworkMessageHost(msg, conn.peer),
        (peerId) => console.log('Client connected:', peerId),
        (peerId) => console.log('Client disconnected:', peerId)
      );

      setLocalColor(hostColor);
      setGameState(initialState);
      setScreen('playing');
      setIsConnecting(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to host online room.');
      setIsConnecting(false);
    }
  };

  // Join Online Room
  const handleJoinOnlineRoom = async (
    roomCode: string,
    playerName: string,
    playerAvatar: AvatarId
  ) => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      await peerNetwork.joinRoom(
        roomCode,
        (msg) => handleNetworkMessageClient(msg),
        () => {
          peerNetwork.broadcast({
            type: 'JOIN_REQUEST',
            senderPeerId: peerNetwork.peerId,
            senderName: playerName,
            senderAvatar: playerAvatar,
            roomCode,
          });
        }
      );
      setIsConnecting(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Could not connect to room. Check room code or host status.');
      setIsConnecting(false);
    }
  };

  // Host handling client network messages
  const handleNetworkMessageHost = (msg: NetworkMessage, senderPeerId: string) => {
    const current = gameStateRef.current;
    if (!current) return;

    if (msg.type === 'JOIN_REQUEST') {
      let assignedColor: PlayerColor | null = null;

      if (current.maxOnlinePlayers === 2) {
        const hostColor = (['red', 'green', 'yellow', 'blue'] as PlayerColor[]).find(
          (c) => current.players[c].isActive && current.players[c].type === 'human'
        ) || 'red';
        const oppColor = getOppositeColor(hostColor);
        if (current.players[oppColor].peerId === undefined) {
          assignedColor = oppColor;
        }
      } else {
        assignedColor = (['red', 'green', 'yellow', 'blue'] as PlayerColor[]).find(
          (c) => current.players[c].isActive && current.players[c].peerId === undefined && current.players[c].type !== 'human'
        ) || null;
      }

      if (!assignedColor) {
        peerNetwork.sendTo(senderPeerId, { type: 'JOIN_REJECT', senderPeerId: peerNetwork.peerId });
        return;
      }

      const updatedState = { ...current };
      updatedState.players[assignedColor] = {
        color: assignedColor,
        name: msg.senderName || 'Online Player',
        avatar: msg.senderAvatar || 'star',
        type: 'remote',
        peerId: senderPeerId,
        isActive: true,
        tokens: updatedState.players[assignedColor].tokens,
      };

      if (!updatedState.turnOrder.includes(assignedColor)) {
        updatedState.turnOrder.push(assignedColor);
      }

      addLog(
        updatedState,
        `🌐 ${msg.senderName} joined room as ${assignedColor.toUpperCase()}!`,
        assignedColor
      );

      setGameState(updatedState);
      peerNetwork.broadcast({
        type: 'STATE_SYNC',
        senderPeerId: peerNetwork.peerId,
        gameState: updatedState,
        color: assignedColor,
      });
    } else if (msg.type === 'ROLL_DICE') {
      handleRollDice();
    } else if (msg.type === 'MOVE_TOKEN' && msg.tokenId !== undefined && msg.color) {
      handleSelectToken(msg.color, msg.tokenId);
    } else if (msg.type === 'CHAT_MESSAGE' && msg.chatMessage) {
      handleReceiveChatMessage(msg.chatMessage);
    }
  };

  // Client handling state sync from host
  const handleNetworkMessageClient = (msg: NetworkMessage) => {
    if (msg.type === 'STATE_SYNC' && msg.gameState) {
      setGameState(msg.gameState as GameState);
      setScreen('playing');
      if (msg.color) {
        setLocalColor(msg.color);
      }
    } else if (msg.type === 'JOIN_REJECT') {
      setErrorMessage('Room is full!');
      peerNetwork.disconnect();
    } else if (msg.type === 'CHAT_MESSAGE' && msg.chatMessage) {
      handleReceiveChatMessage(msg.chatMessage);
    }
  };

  // Start Local / Vs AI Game
  const handleStartLocalGame = (
    configs: Record<PlayerColor, { name: string; avatar?: AvatarId; type: PlayerType; isActive: boolean }>
  ) => {
    const initialState = createInitialGameState('local', configs);
    setLocalColor(null);
    setGameState(initialState);
    setScreen('playing');
  };

  // Roll Dice Action with Instant Broadcast
  const handleRollDice = () => {
    if (!gameState || !gameState.canRoll || gameState.isRolling || gameState.isAnimatingMove) return;

    // IF ONLINE CLIENT: Send ROLL_DICE to Host over P2P connection!
    if (gameState.mode === 'online' && !gameState.isHost) {
      peerNetwork.broadcast({
        type: 'ROLL_DICE',
        senderPeerId: peerNetwork.peerId,
      });
      return;
    }

    audioSystem.playDiceRoll();

    setGameState((prev) => {
      if (!prev) return null;
      const rollingState: GameState = { ...prev, isRolling: true, statusBanner: null };
      if (rollingState.mode === 'online' && rollingState.isHost) {
        peerNetwork.broadcast({
          type: 'STATE_SYNC',
          senderPeerId: peerNetwork.peerId,
          gameState: rollingState,
        });
      }
      return rollingState;
    });

    setTimeout(() => {
      setGameState((prev) => {
        if (!prev) return null;

        const activeColor = prev.turnOrder[prev.currentTurnIndex];
        const diceValue = Math.floor(Math.random() * 6) + 1;

        let consecutiveSixes = prev.consecutiveSixes;
        if (diceValue === 6) {
          consecutiveSixes += 1;
        } else {
          consecutiveSixes = 0;
        }

        const nextState: GameState = {
          ...prev,
          diceValue,
          isRolling: false,
          canRoll: false,
          consecutiveSixes,
        };

        const activePlayer = prev.players[activeColor];

        // Check 3 consecutive 6s rule penalty
        if (consecutiveSixes === 3) {
          addLog(nextState, `⚠️ 3 Consecutive 6s! Turn forfeited for ${activePlayer.name}.`, activeColor);
          nextState.consecutiveSixes = 0;
          nextState.diceValue = null;
          nextState.canRoll = true;
          nextState.currentTurnIndex = getNextTurnIndex(nextState);

          if (nextState.mode === 'online' && nextState.isHost) {
            peerNetwork.broadcast({
              type: 'STATE_SYNC',
              senderPeerId: peerNetwork.peerId,
              gameState: nextState,
            });
          }

          return nextState;
        }

        // Calculate valid moves
        const validMoves = calculateValidMoves(nextState, diceValue);
        nextState.validTokenMoves = validMoves;

        addLog(nextState, `🎲 ${activePlayer.name} rolled a ${diceValue}.`, activeColor);

        // If no valid moves: show banner and auto-pass turn
        if (validMoves.length === 0) {
          nextState.statusBanner = {
            text: `⚠️ No valid moves for ${activePlayer.name} (Rolled ${diceValue}). Passing turn...`,
            type: 'warning',
          };

          setTimeout(() => {
            setGameState((stateBeforePass) => {
              if (!stateBeforePass) return null;
              const passedState = { ...stateBeforePass };
              passedState.diceValue = null;
              passedState.canRoll = true;
              passedState.statusBanner = null;
              passedState.currentTurnIndex = getNextTurnIndex(passedState);
              passedState.consecutiveSixes = 0;

              if (passedState.mode === 'online' && passedState.isHost) {
                peerNetwork.broadcast({
                  type: 'STATE_SYNC',
                  senderPeerId: peerNetwork.peerId,
                  gameState: passedState,
                });
              }

              return passedState;
            });
          }, 1100);
        }

        if (nextState.mode === 'online' && nextState.isHost) {
          peerNetwork.broadcast({
            type: 'STATE_SYNC',
            senderPeerId: peerNetwork.peerId,
            gameState: nextState,
          });
        }

        return nextState;
      });
    }, 600);
  };

  // Step-by-Step Animated Token Movement with Real-Time Frame Streaming
  const handleSelectToken = (color: PlayerColor, tokenId: number) => {
    if (!gameState || gameState.diceValue === null || gameState.isAnimatingMove) return;

    if (gameState.mode === 'online' && !gameState.isHost) {
      peerNetwork.broadcast({
        type: 'MOVE_TOKEN',
        senderPeerId: peerNetwork.peerId,
        color,
        tokenId,
      });
      return;
    }

    const diceValue = gameState.diceValue;
    const player = gameState.players[color];
    const token = player.tokens.find((t) => t.id === tokenId);
    if (!token) return;

    setGameState((prev) => (prev ? { ...prev, isAnimatingMove: true } : null));

    const totalSteps = token.step === -1 ? 1 : diceValue;
    let stepCount = 0;

    const animateInterval = setInterval(() => {
      stepCount++;
      audioSystem.playStepTick(stepCount);

      setGameState((prev) => {
        if (!prev) return null;
        const tempState: GameState = JSON.parse(JSON.stringify(prev));
        const tempToken = tempState.players[color].tokens.find((t) => t.id === tokenId);
        if (tempToken) {
          if (tempToken.step === -1) {
            tempToken.step = 0;
          } else {
            tempToken.step += 1;
          }
        }

        // Stream step frame to online client in real time
        if (tempState.mode === 'online' && tempState.isHost) {
          peerNetwork.broadcast({
            type: 'STATE_SYNC',
            senderPeerId: peerNetwork.peerId,
            gameState: tempState,
          });
        }

        return tempState;
      });

      if (stepCount >= totalSteps) {
        clearInterval(animateInterval);

        setTimeout(() => {
          setGameState((latestState) => {
            if (!latestState) return null;
            const { newState, capturedColor } = executeMoveToken(latestState, color, tokenId, diceValue);
            newState.isAnimatingMove = false;
            newState.statusBanner = null;

            if (capturedColor) {
              audioSystem.playCapture();
            } else if (token.step + diceValue === 57) {
              audioSystem.playHomeEntry();
            } else if (token.step + diceValue >= 52) {
              audioSystem.playSafeSpot();
            }

            if (newState.gameStatus === 'finished') {
              audioSystem.playVictory();
            }

            if (newState.mode === 'online' && newState.isHost) {
              peerNetwork.broadcast({
                type: 'STATE_SYNC',
                senderPeerId: peerNetwork.peerId,
                gameState: newState,
              });
            }

            return newState;
          });
        }, 120);
      }
    }, 130);
  };

  // Send In-Game Chat Message / Quick Emote
  const handleSendMessage = (text: string, emoji?: string) => {
    if (!gameState) return;

    const senderColor = localColor || gameState.turnOrder[gameState.currentTurnIndex];
    const senderName = gameState.players[senderColor]?.name || 'Player';

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      senderName,
      color: senderColor,
      text,
      emoji,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    handleReceiveChatMessage(newMsg);

    if (gameState.mode === 'online') {
      peerNetwork.broadcast({
        type: 'CHAT_MESSAGE',
        senderPeerId: peerNetwork.peerId,
        chatMessage: newMsg,
      });
    }
  };

  const handleReceiveChatMessage = (msg: ChatMessage) => {
    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        chatMessages: [msg, ...(prev.chatMessages || []).slice(0, 25)],
        activeSpeechBubble: {
          color: msg.color,
          text: msg.text,
          emoji: msg.emoji,
          timestamp: Date.now(),
        },
      };
    });

    setTimeout(() => {
      setGameState((prev) => {
        if (!prev) return null;
        return { ...prev, activeSpeechBubble: null };
      });
    }, 3500);
  };

  // Bot Turn Automation Loop
  useEffect(() => {
    if (!gameState || gameState.gameStatus !== 'playing' || gameState.isAnimatingMove) return;

    const activeColor = gameState.turnOrder[gameState.currentTurnIndex];
    const activePlayer = gameState.players[activeColor];

    if (!activePlayer || activePlayer.type !== 'bot') return;

    if (gameState.mode === 'online' && !gameState.isHost) return;

    let timer: NodeJS.Timeout | null = null;

    // Bot Step 1: Roll Dice
    if (gameState.canRoll && !gameState.isRolling) {
      timer = setTimeout(() => {
        handleRollDice();
      }, 700);
    }
    // Bot Step 2: Execute Move
    else if (
      !gameState.canRoll &&
      !gameState.isRolling &&
      gameState.diceValue !== null &&
      gameState.validTokenMoves.length > 0
    ) {
      timer = setTimeout(() => {
        const chosenTokenId = selectBotToken(gameState, gameState.validTokenMoves);
        if (chosenTokenId !== null) {
          handleSelectToken(activeColor, chosenTokenId);
        }
      }, 700);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    gameState?.currentTurnIndex,
    gameState?.canRoll,
    gameState?.isRolling,
    gameState?.isAnimatingMove,
    gameState?.diceValue,
    gameState?.gameStatus,
  ]);

  // Exit Game back to Setup
  const handleExitGame = () => {
    peerNetwork.disconnect();
    setGameState(null);
    setScreen('setup');
  };

  // SCREEN 1: LOGIN
  if (screen === 'login' || !userProfile) {
    return <LoginScreen initialProfile={userProfile || undefined} onLogin={handleLogin} />;
  }

  // SCREEN 2: GAME LOBBY & SETUP
  if (screen === 'setup' || !gameState || gameState.gameStatus === 'setup') {
    return (
      <GameSetup
        userProfile={userProfile}
        onBackToLogin={() => setScreen('login')}
        onStartLocalGame={handleStartLocalGame}
        onHostOnlineRoom={handleHostOnlineRoom}
        onJoinOnlineRoom={handleJoinOnlineRoom}
        isConnecting={isConnecting}
        errorMessage={errorMessage}
      />
    );
  }

  // SCREEN 3: GAME ARENA
  const activeColor = gameState.turnOrder[gameState.currentTurnIndex];
  const activePlayer = gameState.players[activeColor];

  const isMyTurn =
    gameState.mode === 'local' ||
    (localColor !== null && activeColor === localColor && activePlayer.type !== 'bot');

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-2 sm:p-4 max-w-5xl mx-auto animate-fadeIn">
      {/* Header & Controls */}
      <GameControls
        gameState={gameState}
        onToggleSound={() =>
          setGameState((prev) => (prev ? { ...prev, soundEnabled: !prev.soundEnabled } : null))
        }
        onExitGame={handleExitGame}
        onSendMessage={handleSendMessage}
      />

      {/* Status Notification Banner */}
      {gameState.statusBanner && (
        <div className="w-full max-w-md px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 text-center animate-bounce my-1">
          {gameState.statusBanner.text}
        </div>
      )}

      {/* Main Board Layout & Sidebar */}
      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 my-2">
        {/* Left Side: Top 2 Players Cards */}
        <div className="w-full md:w-56 grid grid-cols-2 md:grid-cols-1 gap-2">
          {gameState.turnOrder.slice(0, 2).map((color) => (
            <PlayerCard
              key={color}
              player={gameState.players[color]}
              isCurrentTurn={color === activeColor}
              speechBubble={
                gameState.activeSpeechBubble?.color === color
                  ? gameState.activeSpeechBubble
                  : null
              }
            />
          ))}
        </div>

        {/* Center: Ludo Board */}
        <div className="w-full max-w-lg flex flex-col items-center gap-4">
          <LudoBoard gameState={gameState} onSelectToken={handleSelectToken} />

          {/* Dice Roller */}
          <Dice3D
            value={gameState.diceValue}
            isRolling={gameState.isRolling}
            canRoll={gameState.canRoll && isMyTurn && !gameState.isAnimatingMove}
            activeColor={activeColor}
            onRoll={handleRollDice}
            disabled={!isMyTurn || gameState.isAnimatingMove}
          />
        </div>

        {/* Right Side: Bottom 2 Players Cards */}
        <div className="w-full md:w-56 grid grid-cols-2 md:grid-cols-1 gap-2">
          {gameState.turnOrder.slice(2).map((color) => (
            <PlayerCard
              key={color}
              player={gameState.players[color]}
              isCurrentTurn={color === activeColor}
              speechBubble={
                gameState.activeSpeechBubble?.color === color
                  ? gameState.activeSpeechBubble
                  : null
              }
            />
          ))}
        </div>
      </div>

      {/* Win Celebration Modal */}
      {gameState.gameStatus === 'finished' && (
        <WinModal gameState={gameState} onPlayAgain={handleExitGame} />
      )}
    </div>
  );
}
