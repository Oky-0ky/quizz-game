import { AdventurePathId, BoardMapId, BoardTile, TileType } from '@/types/game';
import { TILE_CONFIG } from '@/data/gameData';
import { ADVENTURE_MAP, getAdventurePath, samplePolyline } from '@/data/adventureMap';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 64;
const TILE_GAP = 4;
const COLS = 10;

/**
 * Generates a snake-pattern board (like classic board games).
 * Row 0 (bottom) goes left→right, row 1 goes right→left, etc.
 * Position 1 = bottom-left (START), position N = top-right or wherever FINISH lands.
 */
export function generateBoard(
  totalTiles: number,
  specialPositions: Record<number, TileType>,
  mapId: BoardMapId = 'adventure',
  pathId: AdventurePathId = 'hutan'
): BoardTile[] {
  if (mapId === 'adventure') {
    return generateAdventureBoard(totalTiles, specialPositions, pathId);
  }

  const tiles: BoardTile[] = [];
  const rows = Math.ceil(totalTiles / COLS);
  const step = TILE_WIDTH + TILE_GAP;

  for (let pos = 1; pos <= totalTiles; pos++) {
    const idx = pos - 1; // 0-based index
    const row = Math.floor(idx / COLS); // 0 = bottom row
    const col = idx % COLS;

    // Snake direction: even rows go left→right, odd rows go right→left
    const isReversed = row % 2 === 1;
    const actualCol = isReversed ? COLS - 1 - col : col;

    // Visual row from bottom: row 0 = bottom
    const visualRow = rows - 1 - row;

    const x = actualCol * step;
    const y = visualRow * step;

    const type: TileType = specialPositions[pos] || 'normal';
    const config = TILE_CONFIG[type];

    // Assign environment based on zone
    const zone = Math.floor(pos / (totalTiles / 8));
    const environments = ['forest', 'village', 'bridge', 'river', 'garden', 'castle', 'meadow', 'cave', 'beach', 'park'];
    const environment = environments[Math.min(zone, environments.length - 1)];

    tiles.push({
      id: pos,
      position: pos,
      type,
      x,
      y,
      label: config.label || String(pos),
      description: config.description || `Kotak ${pos}`,
      color: config.color,
      icon: config.emoji,
      environment,
      effect: getDefaultEffect(type, pos),
    });
  }

  return tiles;
}

function generateAdventureBoard(
  totalTiles: number,
  specialPositions: Record<number, TileType>,
  pathId: AdventurePathId
): BoardTile[] {
  const path = getAdventurePath(pathId);
  const points = samplePolyline(path.waypoints, totalTiles);
  const tiles: BoardTile[] = [];

  for (let pos = 1; pos <= totalTiles; pos++) {
    const type: TileType = specialPositions[pos] || 'normal';
    const config = TILE_CONFIG[type];
    const point = points[pos - 1] || { x: 0, y: 0 };
    tiles.push({
      id: pos,
      position: pos,
      type,
      x: point.x,
      y: point.y,
      label: config.label || String(pos),
      description: config.description || `Kotak ${pos}`,
      color: config.color,
      icon: config.emoji,
      environment: path.id,
      effect: getDefaultEffect(type, pos),
    });
  }

  return tiles;
}

function getDefaultEffect(type: TileType, position: number): BoardTile['effect'] {
  switch (type) {
    case 'reward':
      return { type: 'gain_coins', value: 15 };
    case 'trap':
      return { type: 'move_backward', value: 2 };
    case 'challenge':
      return { type: 'challenge' };
    case 'tax':
      return { type: 'lose_coins', value: 10 };
    case 'rest':
      return { type: 'protection' };
    case 'shortcut':
      return { type: 'shortcut_to', targetTile: Math.min(position + 10, 100) };
    case 'duel':
      return { type: 'duel' };
    default:
      return undefined;
  }
}

export function getTilePixelSize() {
  return { width: TILE_WIDTH, height: TILE_HEIGHT, gap: TILE_GAP, step: TILE_WIDTH + TILE_GAP };
}

export function getBoardDimensions(totalTiles: number, mapId: BoardMapId = 'classic') {
  if (mapId === 'adventure') {
    return {
      width: ADVENTURE_MAP.width,
      height: ADVENTURE_MAP.height,
      rows: 1,
      cols: 1,
    };
  }
  const rows = Math.ceil(totalTiles / COLS);
  const step = TILE_WIDTH + TILE_GAP;
  return {
    width: COLS * step - TILE_GAP,
    height: rows * step - TILE_GAP,
    rows,
    cols: COLS,
  };
}
