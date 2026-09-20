import React from 'react';
import { PlayerColor } from '../types/ludo';
import { Dices } from 'lucide-react';

interface Dice3DProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  activeColor: PlayerColor;
  onRoll: () => void;
  disabled?: boolean;
}

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  isRolling,
  canRoll,
  activeColor,
  onRoll,
  disabled = false,
}) => {
  // Map value to 3D cube rotation angles [rotateX, rotateY]
  const getRotation = (val: number | null): [number, number] => {
    switch (val) {
      case 1:
        return [0, 0];
      case 6:
        return [0, 180];
      case 2:
        return [0, 90];
      case 5:
        return [0, -90];
      case 3:
        return [-90, 0];
      case 4:
        return [90, 0];
      default:
        return [0, 0];
    }
  };

  const [rotX, rotY] = getRotation(value);

  const glowColorClass = {
    red: 'hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] border-red-500/50',
    green: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] border-emerald-500/50',
    yellow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] border-amber-500/50',
    blue: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] border-blue-500/50',
  }[activeColor];

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => canRoll && !disabled && !isRolling && onRoll()}
        className={`dice-container ${glowColorClass} ${
          canRoll && !disabled ? 'cursor-pointer animate-bounce' : 'opacity-90'
        }`}
      >
        <div
          className={`cube ${isRolling ? 'rolling' : ''}`}
          style={{
            transform: isRolling
              ? undefined
              : `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          {/* Face 1 */}
          <div className="cube-face face-1">
            <div className="col-start-2 row-start-2 cube-dot" />
          </div>

          {/* Face 2 */}
          <div className="cube-face face-2">
            <div className="col-start-1 row-start-1 cube-dot" />
            <div className="col-start-3 row-start-3 cube-dot" />
          </div>

          {/* Face 3 */}
          <div className="cube-face face-3">
            <div className="col-start-1 row-start-1 cube-dot" />
            <div className="col-start-2 row-start-2 cube-dot" />
            <div className="col-start-3 row-start-3 cube-dot" />
          </div>

          {/* Face 4 */}
          <div className="cube-face face-4">
            <div className="col-start-1 row-start-1 cube-dot" />
            <div className="col-start-3 row-start-1 cube-dot" />
            <div className="col-start-1 row-start-3 cube-dot" />
            <div className="col-start-3 row-start-3 cube-dot" />
          </div>

          {/* Face 5 */}
          <div className="cube-face face-5">
            <div className="col-start-1 row-start-1 cube-dot" />
            <div className="col-start-3 row-start-1 cube-dot" />
            <div className="col-start-2 row-start-2 cube-dot" />
            <div className="col-start-1 row-start-3 cube-dot" />
            <div className="col-start-3 row-start-3 cube-dot" />
          </div>

          {/* Face 6 */}
          <div className="cube-face face-6">
            <div className="col-start-1 row-start-1 cube-dot" />
            <div className="col-start-3 row-start-1 cube-dot" />
            <div className="col-start-1 row-start-2 cube-dot" />
            <div className="col-start-3 row-start-2 cube-dot" />
            <div className="col-start-1 row-start-3 cube-dot" />
            <div className="col-start-3 row-start-3 cube-dot" />
          </div>
        </div>
      </div>

      <button
        onClick={() => canRoll && !disabled && !isRolling && onRoll()}
        disabled={!canRoll || disabled || isRolling}
        className={`px-5 py-2.5 rounded-xl font-extrabold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
          canRoll && !disabled
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/25'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
        }`}
      >
        <Dices className="w-4 h-4" />
        {isRolling ? 'Rolling...' : canRoll ? 'ROLL DICE' : `Rolled: ${value ?? '-'}`}
      </button>
    </div>
  );
};
