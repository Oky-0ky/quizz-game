import { TileType } from '@/types/game';

export const ADVENTURE_MAP = {
  width: 1600,
  height: 900,
  tileSize: 42,
} as const;

export type AdventurePathId = 'hutan' | 'sungai' | 'kota';
export type BoardMapId = 'classic' | 'adventure';

export interface PathLandmark {
  index: number;
  type: TileType;
  icon: string;
}

export interface AdventurePathDef {
  id: AdventurePathId;
  name: string;
  tagline: string;
  emoji: string;
  labelColor: string;
  ribbon: string;
  ribbonDark: string;
  tileFill: string;
  tileStroke: string;
  waypoints: Array<[number, number]>;
  landmarks: PathLandmark[];
}

// Landmark template sama untuk semua jalur (kesetaraan penuh)
const LANDMARK_TEMPLATE: PathLandmark[] = [
  { index: 4,  type: 'mystery', icon: '📦' },
  { index: 7,  type: 'reward',  icon: '⭐' },
  { index: 10, type: 'shop',    icon: '🏪' },
  { index: 13, type: 'duel',    icon: '⚔️' },
  { index: 16, type: 'trap',    icon: '❗' },
  { index: 19, type: 'mystery', icon: '📦' },
  { index: 22, type: 'reward',  icon: '⭐' },
  { index: 25, type: 'shop',    icon: '🏪' },
  { index: 28, type: 'duel',    icon: '⚔️' },
];

export const ADVENTURE_PATHS: AdventurePathDef[] = [
  {
    id: 'hutan',
    name: 'Jalan Hutan',
    tagline: 'Menyusuri rimba yang rindang',
    emoji: '🌳',
    labelColor: '#2d7a2d',
    ribbon: '#a8e0a0',
    ribbonDark: '#5aaa50',
    tileFill: '#d8f5d0',
    tileStroke: '#5aaa50',
    // 30 waypoints - jalur atas berliku, naik-turun seperti di hutan berbukit
    waypoints: [
      [188, 232], [236, 218], [284, 206], [332, 198], [380, 194],
      [428, 198], [476, 210], [524, 224], [570, 236], [616, 240],
      [662, 236], [708, 224], [754, 210], [800, 198], [846, 190],
      [892, 188], [938, 194], [984, 206], [1030, 220], [1076, 232],
      [1120, 238], [1164, 236], [1208, 226], [1252, 212], [1296, 198],
      [1338, 190], [1372, 190], [1400, 198], [1420, 212], [1434, 228],
    ],
    landmarks: LANDMARK_TEMPLATE,
  },
  {
    id: 'sungai',
    name: 'Jalan Sungai',
    tagline: 'Mengikuti aliran sungai yang jernih',
    emoji: '🌊',
    labelColor: '#1a6ea8',
    ribbon: '#90cff0',
    ribbonDark: '#4090c8',
    tileFill: '#cce8fa',
    tileStroke: '#4090c8',
    // 30 waypoints - jalur tengah berliku mengikuti sungai, kebalikan dari hutan
    waypoints: [
      [188, 452], [236, 466], [284, 478], [332, 484], [380, 480],
      [428, 468], [476, 452], [524, 436], [570, 422], [616, 416],
      [662, 418], [708, 428], [754, 444], [800, 460], [846, 472],
      [892, 478], [938, 476], [984, 464], [1030, 448], [1076, 432],
      [1120, 418], [1164, 412], [1208, 416], [1252, 428], [1296, 444],
      [1340, 456], [1376, 460], [1404, 456], [1424, 446], [1434, 434],
    ],
    landmarks: LANDMARK_TEMPLATE,
  },
  {
    id: 'kota',
    name: 'Jalan Kota',
    tagline: 'Melintasi taman dan pasar kota',
    emoji: '🏙️',
    labelColor: '#c05621',
    ribbon: '#f5d8a0',
    ribbonDark: '#d4a040',
    tileFill: '#feebc4',
    tileStroke: '#d4a040',
    // 30 waypoints - jalur bawah berliku, pola berbeda dari hutan dan sungai
    waypoints: [
      [188, 672], [236, 658], [284, 646], [332, 640], [380, 642],
      [428, 652], [476, 668], [524, 684], [570, 694], [616, 698],
      [662, 696], [708, 686], [754, 670], [800, 654], [846, 644],
      [892, 640], [938, 644], [984, 656], [1030, 670], [1076, 684],
      [1120, 692], [1164, 694], [1208, 688], [1252, 674], [1296, 660],
      [1338, 648], [1372, 646], [1400, 652], [1420, 662], [1434, 674],
    ],
    landmarks: LANDMARK_TEMPLATE,
  },
];

export const MAP_LEGEND = [
  { icon: '📦', label: 'Peti Misteri' },
  { icon: '⭐', label: 'Hadiah' },
  { icon: '🏪', label: 'Toko Item' },
  { icon: '⚔️', label: 'Duel' },
  { icon: '❗', label: 'Jebakan' },
] as const;

export function getAdventurePath(id: AdventurePathId | string | undefined): AdventurePathDef {
  return ADVENTURE_PATHS.find(p => p.id === id) || ADVENTURE_PATHS[0];
}

export function polylineLength(points: Array<[number, number]>): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    len += Math.hypot(dx, dy);
  }
  return len;
}

export function pointAlongPolyline(
  points: Array<[number, number]>,
  t: number
): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1 || t <= 0) return { x: points[0][0], y: points[0][1] };
  if (t >= 1) return { x: points[points.length - 1][0], y: points[points.length - 1][1] };
  const total = polylineLength(points);
  let remain = total * t;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    const seg = Math.hypot(dx, dy);
    if (remain <= seg || i === points.length - 1) {
      const u = seg === 0 ? 0 : remain / seg;
      return { x: points[i - 1][0] + dx * u, y: points[i - 1][1] + dy * u };
    }
    remain -= seg;
  }
  return { x: points[points.length - 1][0], y: points[points.length - 1][1] };
}

export function samplePolyline(
  points: Array<[number, number]>,
  count: number
): Array<{ x: number; y: number }> {
  if (!points.length || count <= 0) return [];
  if (count <= 1) return [{ x: points[0][0], y: points[0][1] }];
  return Array.from({ length: count }, (_, i) =>
    pointAlongPolyline(points, i / (count - 1))
  );
}

export function pathToSvg(points: Array<[number, number]>): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return (
    `M ${first[0]} ${first[1]} ` + rest.map(p => `L ${p[0]} ${p[1]}`).join(' ')
  );
}

export const BOARD_MAPS: {
  id: BoardMapId;
  name: string;
  emoji: string;
  desc: string;
}[] = [
  {
    id: 'adventure',
    name: 'Peta Petualangan',
    emoji: '🗺️',
    desc: '3 jalur: Hutan, Sungai, Kota — 30 kotak',
  },
  {
    id: 'classic',
    name: 'Papan Klasik',
    emoji: '🎲',
    desc: 'Grid ular tangga 10 kolom',
  },
];
