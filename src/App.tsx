import React, { useState, useEffect, useRef } from 'react';
import { GameState, PlayerColor, PlayerType, NetworkMessage } from './types/ludo';
import {
  createInitialGameState,
  calculateValidMoves,
  executeMoveToken,
  selectBotToken,
  addLog,
  getNextTurnIndex,
} from './utils/ludoEngine';
import { peerNetwork } from './utils/multiplayer';
import { audioSystem } from './utils/audio';
import { GameSetup } from './components/GameSetup';
import { LudoBoard } from './components/LudoBoard';
import { Dice3D } from './components/Dice3D';
import { PlayerCard } from './components/PlayerCard';
import { GameControls } from './components/GameControls';
import { WinModal } from './components/WinModal';

export function App() {
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

  // 1. Host Online Room
  const handleHostOnlineRoom = async (
    roomCode: string,
    hostColor: PlayerColor,
    hostName: string
  ) => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      const playerConfigs: Partial<Record<PlayerColor, { name: string; type: PlayerType; isActive: boolean }>> = {
        red: { name: 'Empty Slot', type: 'bot', isActive: false },
        green: { name: 'Empty Slot', type: 'bot', isActive: false },
        yellow: { name: 'Empty Slot', type: 'bot', isActive: false },
        blue: { name: 'Empty Slot', type: 'bot', isActive: false },
      };

      playerConfigs[hostColor] = { name: hostName, type: 'human', isActive: true };

      const initialState = createInitialGameState('online', playerConfigs, roomCode, true);

      await peerNetwork.initHost(
        roomCode,
        (msg, conn) => handleNetworkMessageHost(msg, conn.peer),
        (peerId) => console.log('Client connected:', peerId),
        (peerId) => console.log('Client disconnected:', peerId)
      );

      setLocalColor(hostColor);
      setGameState(initialState);
      setIsConnecting(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to host online room.');
      setIsConnecting(false);
    }
  };

  // 2. Join Online Room
  const handleJoinOnlineRoom = async (roomCode: string, playerName: string) => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      await peerNetwork.joinRoom(
        roomCode,
        (msg) => handleNetworkMessageClient(msg),
        () => {
          // Send join request to host
          peerNetwork.broadcast({
            type: 'JOIN_REQUEST',
            senderPeerId: peerNetwork.peerId,
            senderName: playerName,
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
      // Find first inactive slot for joining player
      const availableColor = (['red', 'green', 'yellow', 'blue'] as PlayerColor[]).find(
        (c) => !current.players[c].isActive
      );

      if (!availableColor) {
        peerNetwork.sendTo(senderPeerId, { type: 'JOIN_REJECT', senderPeerId: peerNetwork.peerId });
        return;
      }

      const updatedState = { ...current };
      updatedState.players[availableColor] = {
        color: availableColor,
        name: msg.senderName || 'Online Player',
        type: 'remote',
        peerId: senderPeerId,
        isActive: true,
        tokens: updatedState.players[availableColor].tokens,
      };

      if (!updatedState.turnOrder.includes(availableColor)) {
        updatedState.turnOrder.push(availableColor);
      }

      addLog(updatedState, `🌐 ${msg.senderName} joined room as ${availableColor.toUpperCase()}!`, availableColor);

      setGameState(updatedState);
      peerNetwork.broadcast({
        type: 'STATE_SYNC',
        senderPeerId: peerNetwork.peerId,
        gameState: updatedState,
        color: availableColor,
      });
    } else if (msg.type === 'ROLL_DICE') {
      handleRollDice();
    } else if (msg.type === 'MOVE_TOKEN' && msg.tokenId !== undefined && msg.color) {
      handleSelectToken(msg.color, msg.tokenId);
    }
  };

  // Client handling state sync from host
  const handleNetworkMessageClient = (msg: NetworkMessage) => {
    if (msg.type === 'STATE_SYNC' && msg.gameState) {
      setGameState(msg.gameState as GameState);
      if (msg.color) {
        setLocalColor(msg.color);
      }
    } else if (msg.type === 'JOIN_REJECT') {
      setErrorMessage('Room is full!');
      peerNetwork.disconnect();
    }
  };

  // Start Local / Vs AI Game
  const handleStartLocalGame = (
    configs: Record<PlayerColor, { name: string; type: PlayerType; isActive: boolean }>
  ) => {
    const initialState = createInitialGameState('local', configs);
    setLocalColor(null);
    setGameState(initialState);
  };

  // Roll Dice Action
  const handleRollDice = () => {
    if (!gameState || !gameState.canRoll || gameState.isRolling) return;

    audioSystem.playDiceRoll();

    setGameState((prev) => (prev ? { ...prev, isRolling: true } : null));

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
          return nextState;
        }

        // Calculate valid moves
        const validMoves = calculateValidMoves(nextState, diceValue);
        nextState.validTokenMoves = validMoves;

        addLog(nextState, `🎲 ${activePlayer.name} rolled a ${diceValue}.`, activeColor);

        // If no valid moves: pass turn after short pause
        if (validMoves.length === 0) {
          addLog(nextState, `❌ No valid moves for ${activePlayer.name}.`, activeColor);
          setTimeout(() => {
            setGameState((stateBeforePass) => {
              if (!stateBeforePass) return null;
              const passedState = { ...stateBeforePass };
              passedState.diceValue = null;
              passedState.canRoll = true;
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
          }, 1200);
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

  // Select Token Move Action
  const handleSelectToken = (color: PlayerColor, tokenId: number) => {
    if (!gameState || gameState.diceValue === null) return;

    if (gameState.mode === 'online' && !gameState.isHost) {
      // Send move token request to host
      peerNetwork.broadcast({
        type: 'MOVE_TOKEN',
        senderPeerId: peerNetwork.peerId,
        color,
        tokenId,
      });
      return;
    }

    const diceValue = gameState.diceValue;
    const { newState, capturedColor } = executeMoveToken(gameState, color, tokenId, diceValue);

    // Audio feedback
    if (capturedColor) {
      audioSystem.playCapture();
    } else {
      audioSystem.playTokenMove();
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

    setGameState(newState);
  };

  // Bot Turn Automation Loop
  useEffect(() => {
    if (!gameState || gameState.gameStatus !== 'playing') return;

    const activeColor = gameState.turnOrder[gameState.currentTurnIndex];
    const activePlayer = gameState.players[activeColor];

    if (!activePlayer || activePlayer.type !== 'bot') return;

    // Only host drives bot turns in online mode
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
    gameState?.diceValue,
    gameState?.gameStatus,
  ]);


  // Render Setup Screen if game not started
  if (!gameState || gameState.gameStatus === 'setup') {
    return (
      <GameSetup
        onStartLocalGame={handleStartLocalGame}
        onHostOnlineRoom={handleHostOnlineRoom}
        onJoinOnlineRoom={handleJoinOnlineRoom}
        isConnecting={isConnecting}
        errorMessage={errorMessage}
      />
    );
  }

  const activeColor = gameState.turnOrder[gameState.currentTurnIndex];
  const activePlayer = gameState.players[activeColor];

  // Disable controls if online client and not client's turn
  const isMyTurn =
    gameState.mode === 'local' ||
    (localColor !== null && activeColor === localColor && activePlayer.type !== 'bot');

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-2 sm:p-4 max-w-5xl mx-auto">
      {/* Header & Controls */}
      <GameControls
        gameState={gameState}
        onToggleSound={() =>
          setGameState((prev) => (prev ? { ...prev, soundEnabled: !prev.soundEnabled } : null))
        }
        onRestartGame={() => {
          peerNetwork.disconnect();
          setGameState(null);
        }}
      />

      {/* Main Board Layout & Sidebar */}
      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 my-2">
        {/* Left Side: Top 2 Players Cards */}
        <div className="w-full md:w-56 grid grid-cols-2 md:grid-cols-1 gap-2">
          {gameState.turnOrder.slice(0, 2).map((color) => (
            <PlayerCard
              key={color}
              player={gameState.players[color]}
              isCurrentTurn={color === activeColor}
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
            canRoll={gameState.canRoll && isMyTurn}
            activeColor={activeColor}
            onRoll={handleRollDice}
            disabled={!isMyTurn}
          />
        </div>

        {/* Right Side: Bottom 2 Players Cards */}
        <div className="w-full md:w-56 grid grid-cols-2 md:grid-cols-1 gap-2">
          {gameState.turnOrder.slice(2).map((color) => (
            <PlayerCard
              key={color}
              player={gameState.players[color]}
              isCurrentTurn={color === activeColor}
            />
          ))}
        </div>
      </div>

      {/* Win Celebration Modal */}
      {gameState.gameStatus === 'finished' && (
        <WinModal
          gameState={gameState}
          onPlayAgain={() => {
            peerNetwork.disconnect();
            setGameState(null);
          }}
        />
      )}
    </div>
  );
}
