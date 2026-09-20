import { GridPos, PlayerColor } from '../types/ludo';

// 52 Common Track Path Coordinates (0 to 51)
// Index 0 is Red Start
export const MAIN_PATH: GridPos[] = [
  { row: 7, col: 2 },   // 0: Red Start (SAFE)
  { row: 7, col: 3 },   // 1
  { row: 7, col: 4 },   // 2
  { row: 7, col: 5 },   // 3
  { row: 7, col: 6 },   // 4
  { row: 6, col: 7 },   // 5
  { row: 5, col: 7 },   // 6
  { row: 4, col: 7 },   // 7
  { row: 3, col: 7 },   // 8: Green Star (SAFE)
  { row: 2, col: 7 },   // 9
  { row: 1, col: 7 },   // 10
  { row: 1, col: 8 },   // 11
  { row: 1, col: 9 },   // 12
  { row: 2, col: 9 },   // 13: Green Start (SAFE)
  { row: 3, col: 9 },   // 14
  { row: 4, col: 9 },   // 15
  { row: 5, col: 9 },   // 16
  { row: 6, col: 9 },   // 17
  { row: 7, col: 10 },  // 18
  { row: 7, col: 11 },  // 19
  { row: 7, col: 12 },  // 20
  { row: 7, col: 13 },  // 21: Yellow Star (SAFE)
  { row: 7, col: 14 },  // 22
  { row: 7, col: 15 },  // 23
  { row: 8, col: 15 },  // 24
  { row: 9, col: 15 },  // 25
  { row: 9, col: 14 },  // 26: Yellow Start (SAFE)
  { row: 9, col: 13 },  // 27
  { row: 9, col: 12 },  // 28
  { row: 9, col: 11 },  // 29
  { row: 9, col: 10 },  // 30
  { row: 10, col: 9 },  // 31
  { row: 11, col: 9 },  // 32
  { row: 12, col: 9 },  // 33
  { row: 13, col: 9 },  // 34: Blue Star (SAFE)
  { row: 14, col: 9 },  // 35
  { row: 15, col: 9 },  // 36
  { row: 15, col: 8 },  // 37
  { row: 15, col: 7 },  // 38
  { row: 14, col: 7 },  // 39: Blue Start (SAFE)
  { row: 13, col: 7 },  // 40
  { row: 12, col: 7 },  // 41
  { row: 11, col: 7 },  // 42
  { row: 10, col: 7 },  // 43
  { row: 9, col: 6 },   // 44
  { row: 9, col: 5 },   // 45
  { row: 9, col: 4 },   // 46
  { row: 9, col: 3 },   // 47: Red Star (SAFE)
  { row: 9, col: 2 },   // 48
  { row: 9, col: 1 },   // 49
  { row: 8, col: 1 },   // 50
  { row: 7, col: 1 },   // 51
];

// Starting offset index on MAIN_PATH for each color
export const COLOR_START_OFFSET: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// Home Stretch tiles (steps 52 to 56) leading to step 57 (Finished Home Center)
export const HOME_STRETCH: Record<PlayerColor, GridPos[]> = {
  red: [
    { row: 8, col: 2 }, // 52
    { row: 8, col: 3 }, // 53
    { row: 8, col: 4 }, // 54
    { row: 8, col: 5 }, // 55
    { row: 8, col: 6 }, // 56
    { row: 8, col: 7 }, // 57 (Center Home)
  ],
  green: [
    { row: 2, col: 8 }, // 52
    { row: 3, col: 8 }, // 53
    { row: 4, col: 8 }, // 54
    { row: 5, col: 8 }, // 55
    { row: 6, col: 8 }, // 56
    { row: 7, col: 8 }, // 57 (Center Home)
  ],
  yellow: [
    { row: 8, col: 14 }, // 52
    { row: 8, col: 13 }, // 53
    { row: 8, col: 12 }, // 54
    { row: 8, col: 11 }, // 55
    { row: 8, col: 10 }, // 56
    { row: 8, col: 9 },  // 57 (Center Home)
  ],
  blue: [
    { row: 14, col: 8 }, // 52
    { row: 13, col: 8 }, // 53
    { row: 12, col: 8 }, // 54
    { row: 11, col: 8 }, // 55
    { row: 10, col: 8 }, // 56
    { row: 9, col: 8 },  // 57 (Center Home)
  ],
};

// Token coordinates when in Home Yard (step = -1)
export const YARD_POSITIONS: Record<PlayerColor, GridPos[]> = {
  red: [
    { row: 3, col: 3 },
    { row: 3, col: 4 },
    { row: 4, col: 3 },
    { row: 4, col: 4 },
  ],
  green: [
    { row: 3, col: 12 },
    { row: 3, col: 13 },
    { row: 4, col: 12 },
    { row: 4, col: 13 },
  ],
  yellow: [
    { row: 12, col: 12 },
    { row: 12, col: 13 },
    { row: 13, col: 12 },
    { row: 13, col: 13 },
  ],
  blue: [
    { row: 12, col: 3 },
    { row: 12, col: 4 },
    { row: 13, col: 3 },
    { row: 13, col: 4 },
  ],
};

// Safe path indices on MAIN_PATH (8 total)
export const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

/**
 * Get row and col for a token given its color and step
 */
export function getTokenGridPos(color: PlayerColor, tokenId: number, step: number): GridPos {
  if (step === -1) {
    return YARD_POSITIONS[color][tokenId];
  }
  if (step >= 52) {
    const stretchIdx = Math.min(step - 52, 5);
    return HOME_STRETCH[color][stretchIdx];
  }

  // Calculate position on common path (0 to 51)
  const pathIndex = (COLOR_START_OFFSET[color] + step) % 52;
  return MAIN_PATH[pathIndex];
}

/**
 * Get main path index for a token given its color and step
 */
export function getMainPathIndex(color: PlayerColor, step: number): number | null {
  if (step < 0 || step >= 52) return null;
  return (COLOR_START_OFFSET[color] + step) % 52;
}

/**
 * Check if a main path index is a safe tile
 */
export function isSafeTile(pathIndex: number | null): boolean {
  if (pathIndex === null) return false;
  return SAFE_INDICES.includes(pathIndex);
}
