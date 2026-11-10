'use client';

import { motion } from 'framer-motion';
import { BoardTile, Team } from '@/types/game';
import {
  ADVENTURE_MAP,
  ADVENTURE_PATHS,
  MAP_LEGEND,
  AdventurePathId,
  getAdventurePath,
  pathToSvg,
  pointAlongPolyline,
} from '@/data/adventureMap';

interface Props {
  board: BoardTile[];
  teams: Team[];
  totalTiles: number;
  activePathId: AdventurePathId;
  currentTeamIndex?: number;
  hoveredTile: BoardTile | null;
  onHoverTile: (tile: BoardTile | null) => void;
}

// Scattered tree positions across the map
const TREE_SPOTS: Array<[number, number, number]> = [
  [260, 310, 1.0],
  [310, 290, 0.85],
  [340, 330, 1.1],
  [280, 360, 0.9],
  [390, 285, 0.95],
  [430, 310, 1.05],
  [460, 285, 0.8],
  [500, 320, 1.0],
  [540, 295, 0.9],
  [570, 330, 1.1],
  [610, 300, 0.85],
  [650, 320, 1.0],
  [690, 295, 0.9],
  [730, 325, 1.1],
  [770, 300, 0.95],
  [810, 315, 1.0],
  [850, 285, 0.85],
  [880, 320, 1.1],
  [920, 300, 0.9],
  [960, 320, 1.0],
  [1000, 290, 0.85],
  [1040, 315, 1.05],
  [1080, 285, 0.95],
  [1120, 310, 1.0],
  [1160, 290, 0.9],
  [1200, 310, 1.1],
  [1240, 285, 0.85],
  [1280, 310, 1.0],
  [700, 760, 1.0],
  [760, 780, 0.9],
  [820, 760, 1.1],
  [880, 775, 0.85],
  [940, 760, 1.0],
  [1000, 775, 0.95],
  [1050, 760, 1.05],
  [1100, 778, 0.9],
  [1150, 762, 1.1],
  [380, 760, 0.95],
  [430, 775, 1.0],
  [475, 760, 0.85],
];

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ellipse cx="0" cy="-18" rx="12" ry="14" fill="#3a9e38" opacity="0.9" />
      <ellipse cx="0" cy="-28" rx="9" ry="11" fill="#2e8c2c" opacity="0.95" />
      <rect x="-3" y="-5" width="6" height="12" rx="2" fill="#8B5E3C" />
    </g>
  );
}

function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity="0.88">
      <ellipse cx="0" cy="0" rx="30" ry="18" fill="white" />
      <ellipse cx="22" cy="4" rx="22" ry="14" fill="white" />
      <ellipse cx="-20" cy="4" rx="18" ry="13" fill="white" />
      <ellipse cx="4" cy="-10" rx="20" ry="15" fill="white" />
    </g>
  );
}

export default function AdventureMapView({
  board,
  teams,
  totalTiles,
  activePathId,
  currentTeamIndex = 0,
  hoveredTile,
  onHoverTile,
}: Props) {
  const { width: W, height: H, tileSize } = ADVENTURE_MAP;
  const currentTeam = teams[currentTeamIndex] || teams[0];
  const currentTeamPathId = currentTeam?.pathId || activePathId;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="block rounded-[28px] shadow-2xl"
      style={{ background: '#7bbfe8' }}
    >
      <defs>
        {/* Sky gradient */}
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4fb3e8" />
          <stop offset="35%" stopColor="#7ecef5" />
          <stop offset="60%" stopColor="#a0dba8" />
          <stop offset="100%" stopColor="#5db86a" />
        </linearGradient>

        {/* Ground/grass gradient */}
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6cc85a" />
          <stop offset="100%" stopColor="#4a9e3a" />
        </linearGradient>

        {/* River gradient */}
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4aaad4" />
          <stop offset="50%" stopColor="#62c0ef" />
          <stop offset="100%" stopColor="#3a90c0" />
        </linearGradient>

        {/* Wood gradient */}
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8b870" />
          <stop offset="100%" stopColor="#b87838" />
        </linearGradient>

        {/* Wood dark gradient */}
        <linearGradient id="woodDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c89050" />
          <stop offset="100%" stopColor="#8a5020" />
        </linearGradient>

        {/* School roof gradient */}
        <linearGradient id="schoolRoof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e05050" />
          <stop offset="100%" stopColor="#c03030" />
        </linearGradient>

        {/* Balloon body gradient */}
        <linearGradient id="balloon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="30%" stopColor="#ffd93d" />
          <stop offset="60%" stopColor="#6bceff" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        {/* House roof gradient */}
        <linearGradient id="houseRoof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e06040" />
          <stop offset="100%" stopColor="#c04020" />
        </linearGradient>

        {/* Soft shadow filter */}
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.35" />
        </filter>

        {/* Tile shadow filter */}
        <filter id="tileShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="3" stdDeviation="2" floodOpacity="0.3" />
        </filter>

        {/* Text shadow filter */}
        <filter id="textShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* ── BACKGROUND ── */}
      <rect x="0" y="0" width={W} height={H} fill="url(#sky)" rx="28" />

      {/* Ground / grass strip at the bottom */}
      <rect x="0" y="760" width="1600" height="140" fill="#4a9e38" />
      <ellipse cx="800" cy="760" rx="900" ry="70" fill="#5ab848" />

      {/* Far mountains (bluish, behind everything) */}
      <path
        d="M 0 320 L 100 190 L 220 300 L 360 160 L 500 290 L 650 155 L 800 275 L 960 145 L 1110 268 L 1270 135 L 1420 260 L 1550 170 L 1600 240 L 1600 420 L 0 420 Z"
        fill="#7a8eaa"
        opacity="0.6"
      />
      {/* Snow caps on far mountains */}
      <path d="M 100 190 L 120 210 L 80 210 Z" fill="white" opacity="0.8" />
      <path d="M 360 160 L 385 185 L 335 185 Z" fill="white" opacity="0.8" />
      <path d="M 650 155 L 675 182 L 625 182 Z" fill="white" opacity="0.8" />
      <path d="M 960 145 L 988 174 L 932 174 Z" fill="white" opacity="0.8" />
      <path d="M 1270 135 L 1298 162 L 1242 162 Z" fill="white" opacity="0.8" />

      {/* Mid mountains (dark green) */}
      <path
        d="M 0 390 L 150 265 L 300 375 L 460 248 L 620 368 L 790 242 L 960 362 L 1130 240 L 1300 358 L 1480 248 L 1600 330 L 1600 500 L 0 500 Z"
        fill="#4a8a3c"
        opacity="0.8"
      />

      {/* Front hills (bright green) */}
      <path
        d="M 0 450 L 160 340 L 320 448 L 500 318 L 680 440 L 860 308 L 1040 428 L 1220 300 L 1400 420 L 1600 340 L 1600 560 L 0 560 Z"
        fill="#5aa040"
        opacity="0.9"
      />

      {/* ── CLOUDS ── */}
      <Cloud x={320} y={55} scale={1.3} />
      <Cloud x={560} y={40} scale={1.0} />
      <Cloud x={780} y={62} scale={1.5} />
      <Cloud x={1050} y={45} scale={1.1} />
      <Cloud x={1280} y={58} scale={1.2} />
      <Cloud x={130} y={70} scale={0.9} />
      <Cloud x={1480} y={48} scale={1.0} />

      {/* ── RIVER (between sungai and kota paths) ── */}
      <path
        d="M 300 570 C 480 555, 560 590, 740 572 C 920 554, 1000 598, 1180 575 C 1360 552, 1460 582, 1600 568 L 1600 630 C 1460 644, 1360 614, 1180 637 C 1000 660, 920 616, 740 634 C 560 652, 480 618, 300 632 Z"
        fill="url(#river)"
        opacity="0.85"
      />
      {/* River shimmer lines */}
      <path
        d="M 400 590 C 520 580, 620 598, 740 586"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      <path
        d="M 900 574 C 1020 562, 1120 586, 1240 574"
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      <path
        d="M 350 610 C 450 600, 550 618, 680 606"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
        strokeLinecap="round"
      />

      {/* ── BRIDGE over river ── */}
      <g transform="translate(820, 574)">
        {/* Bridge deck */}
        <rect x="-40" y="0" width="80" height="12" rx="4" fill="#c8a060" stroke="#8a6030" strokeWidth="2" />
        {/* Bridge pillars */}
        <rect x="-30" y="10" width="8" height="30" rx="2" fill="#a08040" />
        <rect x="22" y="10" width="8" height="30" rx="2" fill="#a08040" />
        {/* Railings */}
        <line x1="-36" y1="0" x2="-36" y2="-14" stroke="#a08040" strokeWidth="3" />
        <line x1="36" y1="0" x2="36" y2="-14" stroke="#a08040" strokeWidth="3" />
        <line x1="-36" y1="-14" x2="36" y2="-14" stroke="#a08040" strokeWidth="2" />
        {/* Bridge text */}
        <text x="0" y="-20" textAnchor="middle" fontSize="10" fill="#6a4020" fontWeight="bold">🌉 Jembatan</text>
      </g>

      {/* ── FOREST AREA (near hutan path, left side) ── */}
      <Tree x={210} y={180} scale={1.3} />
      <Tree x={238} y={168} scale={1.1} />
      <Tree x={262} y={176} scale={1.2} />
      <Tree x={245} y={190} scale={0.9} />
      <Tree x={225} y={195} scale={1.0} />
      <Tree x={270} y={188} scale={1.1} />
      <Tree x={290} y={175} scale={1.0} />
      <Tree x={310} y={183} scale={0.95} />

      {/* ── CITY BUILDINGS (near kota path, center-right) ── */}
      <g transform="translate(700, 720)">
        {/* Building 1 */}
        <rect x="0" y="-55" width="38" height="55" rx="2" fill="#d4b896" stroke="#b89060" strokeWidth="2" />
        <rect x="0" y="-60" width="38" height="8" rx="1" fill="#c09050" />
        <rect x="6" y="-45" width="8" height="10" rx="1" fill="#88c4e8" />
        <rect x="20" y="-45" width="8" height="10" rx="1" fill="#88c4e8" />
        <rect x="6" y="-28" width="8" height="10" rx="1" fill="#88c4e8" />
        <rect x="20" y="-28" width="8" height="10" rx="1" fill="#88c4e8" />

        {/* Building 2 */}
        <rect x="46" y="-70" width="30" height="70" rx="2" fill="#c8a0c0" stroke="#a070a0" strokeWidth="2" />
        <rect x="46" y="-76" width="30" height="9" rx="1" fill="#b080b0" />
        <rect x="51" y="-58" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="62" y="-58" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="51" y="-42" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="62" y="-42" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="51" y="-26" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="62" y="-26" width="7" height="9" rx="1" fill="#88c4e8" />

        {/* Building 3 */}
        <rect x="84" y="-45" width="34" height="45" rx="2" fill="#b8d8b0" stroke="#80a870" strokeWidth="2" />
        <rect x="84" y="-50" width="34" height="8" rx="1" fill="#90b880" />
        <rect x="90" y="-36" width="8" height="10" rx="1" fill="#88c4e8" />
        <rect x="104" y="-36" width="8" height="10" rx="1" fill="#88c4e8" />
        <rect x="90" y="-20" width="8" height="10" rx="1" fill="#88c4e8" />
        <rect x="104" y="-20" width="8" height="10" rx="1" fill="#88c4e8" />
      </g>

      {/* More city buildings */}
      <g transform="translate(850, 720)">
        <rect x="0" y="-60" width="32" height="60" rx="2" fill="#f0d8b0" stroke="#c8a870" strokeWidth="2" />
        <rect x="0" y="-66" width="32" height="9" rx="1" fill="#d8b870" />
        <rect x="5" y="-50" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="18" y="-50" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="5" y="-34" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="18" y="-34" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="11" y="-15" width="10" height="15" rx="1" fill="#c8a870" />

        <rect x="40" y="-50" width="28" height="50" rx="2" fill="#d0c8e8" stroke="#a090c8" strokeWidth="2" />
        <rect x="40" y="-56" width="28" height="8" rx="1" fill="#b8a8d8" />
        <rect x="44" y="-40" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="56" y="-40" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="44" y="-24" width="7" height="9" rx="1" fill="#88c4e8" />
        <rect x="56" y="-24" width="7" height="9" rx="1" fill="#88c4e8" />
      </g>

      {/* ── SCATTERED TREES ── */}
      {TREE_SPOTS.map(([tx, ty, ts], i) => (
        <Tree key={i} x={tx} y={ty} scale={ts} />
      ))}

      {/* ── HOT AIR BALLOON (top right) ── */}
      <g transform="translate(1200, 65)" filter="url(#soft)">
        {/* Balloon body */}
        <ellipse cx="0" cy="0" rx="40" ry="50" fill="url(#balloon)" opacity="0.95" />
        {/* Balloon stripes */}
        <path d="M -40 0 C -40 -28, 40 -28, 40 0" fill="#ff6b6b" opacity="0.3" />
        <path d="M -38 10 C -38 -5, 38 -5, 38 10" fill="#ffd93d" opacity="0.3" />
        {/* Basket ropes */}
        <line x1="-28" y1="48" x2="-14" y2="68" stroke="#8a6020" strokeWidth="2" />
        <line x1="28" y1="48" x2="14" y2="68" stroke="#8a6020" strokeWidth="2" />
        {/* Basket */}
        <rect x="-18" y="68" width="36" height="20" rx="4" fill="#c8900e" stroke="#8a6020" strokeWidth="2" />
        <text x="0" y="82" textAnchor="middle" fontSize="13">🎈</text>
        {/* Balloon face */}
        <text x="0" y="10" textAnchor="middle" fontSize="20" dominantBaseline="middle">😊</text>
      </g>

      {/* ── START — HOUSE (left side, centered between all 3 paths) ── */}
      {/* House illustration */}
      <g transform="translate(32, 365)" filter="url(#soft)">
        {/* House body */}
        <rect x="0" y="30" width="80" height="60" rx="4" fill="#f5e8d0" stroke="#c8a070" strokeWidth="3" />
        {/* Roof */}
        <polygon points="40,0 -6,38 86,38" fill="url(#houseRoof)" />
        <polygon points="40,0 -6,38 86,38" fill="none" stroke="#a04020" strokeWidth="2" strokeLinejoin="round" />
        {/* Chimney */}
        <rect x="52" y="8" width="10" height="22" rx="2" fill="#c89060" stroke="#8a5030" strokeWidth="1.5" />
        {/* Door */}
        <rect x="30" y="62" width="20" height="28" rx="4" fill="#c87030" stroke="#8a4010" strokeWidth="2" />
        <circle cx="47" cy="77" r="2.5" fill="#f8d060" />
        {/* Windows */}
        <rect x="6" y="44" width="20" height="18" rx="3" fill="#88c4e8" stroke="#6090c0" strokeWidth="2" />
        <line x1="16" y1="44" x2="16" y2="62" stroke="#6090c0" strokeWidth="1" />
        <line x1="6" y1="53" x2="26" y2="53" stroke="#6090c0" strokeWidth="1" />
        <rect x="54" y="44" width="20" height="18" rx="3" fill="#88c4e8" stroke="#6090c0" strokeWidth="2" />
        <line x1="64" y1="44" x2="64" y2="62" stroke="#6090c0" strokeWidth="1" />
        <line x1="54" y1="53" x2="74" y2="53" stroke="#6090c0" strokeWidth="1" />
        {/* Garden fence */}
        <line x1="0" y1="90" x2="80" y2="90" stroke="#c8a060" strokeWidth="2" />
        {/* Flowers */}
        <text x="8" y="90" fontSize="12">🌸</text>
        <text x="58" y="90" fontSize="12">🌻</text>
        {/* Smoke from chimney */}
        <ellipse cx="52" cy="4" rx="4" ry="4" fill="white" opacity="0.6" />
        <ellipse cx="48" cy="-4" rx="5" ry="5" fill="white" opacity="0.4" />
        <ellipse cx="52" cy="-13" rx="6" ry="6" fill="white" opacity="0.25" />
      </g>

      {/* START sign (wooden board) */}
      <g filter="url(#soft)">
        <rect x="18" y="440" width="150" height="56" rx="12" fill="url(#woodDark)" stroke="#5a3010" strokeWidth="4" />
        {/* Wood grain lines */}
        <line x1="30" y1="450" x2="30" y2="486" stroke="#7a4818" strokeWidth="1" opacity="0.4" />
        <line x1="50" y1="448" x2="50" y2="488" stroke="#7a4818" strokeWidth="1" opacity="0.3" />
        <line x1="70" y1="448" x2="70" y2="488" stroke="#7a4818" strokeWidth="1" opacity="0.4" />
        <line x1="90" y1="448" x2="90" y2="488" stroke="#7a4818" strokeWidth="1" opacity="0.3" />
        <line x1="110" y1="448" x2="110" y2="488" stroke="#7a4818" strokeWidth="1" opacity="0.4" />
        <line x1="130" y1="448" x2="130" y2="488" stroke="#7a4818" strokeWidth="1" opacity="0.3" />
        <line x1="150" y1="450" x2="150" y2="486" stroke="#7a4818" strokeWidth="1" opacity="0.4" />
        {/* Nails */}
        <circle cx="28" cy="453" r="3" fill="#888" />
        <circle cx="160" cy="453" r="3" fill="#888" />
        <circle cx="28" cy="483" r="3" fill="#888" />
        <circle cx="160" cy="483" r="3" fill="#888" />
        <text x="93" y="464" textAnchor="middle" fontSize="15" fontWeight="900" fill="#ffe8a0" fontFamily="serif" letterSpacing="2">🏠 START</text>
        <text x="93" y="484" textAnchor="middle" fontSize="13" fontWeight="700" fill="#f0d070" fontFamily="serif" letterSpacing="1">RUMAH</text>
      </g>

      {/* Arrow pointing right from START */}
      <path d="M 170 468 L 195 468 L 185 460 M 195 468 L 185 476" stroke="#f0c040" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* ── FINISH — SCHOOL (right side) ── */}
      <g transform="translate(1448, 310)" filter="url(#soft)">
        {/* School main building */}
        <rect x="0" y="30" width="120" height="100" rx="4" fill="#f5f0e8" stroke="#c0b080" strokeWidth="3" />
        {/* School roof */}
        <polygon points="60,0 -8,38 128,38" fill="url(#schoolRoof)" />
        <polygon points="60,0 -8,38 128,38" fill="none" stroke="#a02020" strokeWidth="2" strokeLinejoin="round" />
        {/* Star on roof */}
        <text x="60" y="28" textAnchor="middle" fontSize="16">⭐</text>
        {/* School sign */}
        <rect x="20" y="38" width="80" height="20" rx="3" fill="#e05050" />
        <text x="60" y="52" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">SEKOLAH</text>
        {/* School windows */}
        <rect x="8" y="68" width="22" height="20" rx="3" fill="#88c4e8" stroke="#5090c0" strokeWidth="1.5" />
        <line x1="19" y1="68" x2="19" y2="88" stroke="#5090c0" strokeWidth="1" />
        <line x1="8" y1="78" x2="30" y2="78" stroke="#5090c0" strokeWidth="1" />
        <rect x="38" y="68" width="22" height="20" rx="3" fill="#88c4e8" stroke="#5090c0" strokeWidth="1.5" />
        <line x1="49" y1="68" x2="49" y2="88" stroke="#5090c0" strokeWidth="1" />
        <line x1="38" y1="78" x2="60" y2="78" stroke="#5090c0" strokeWidth="1" />
        <rect x="68" y="68" width="22" height="20" rx="3" fill="#88c4e8" stroke="#5090c0" strokeWidth="1.5" />
        <line x1="79" y1="68" x2="79" y2="88" stroke="#5090c0" strokeWidth="1" />
        <line x1="68" y1="78" x2="90" y2="78" stroke="#5090c0" strokeWidth="1" />
        <rect x="94" y="68" width="22" height="20" rx="3" fill="#88c4e8" stroke="#5090c0" strokeWidth="1.5" />
        <line x1="105" y1="68" x2="105" y2="88" stroke="#5090c0" strokeWidth="1" />
        <line x1="94" y1="78" x2="116" y2="78" stroke="#5090c0" strokeWidth="1" />
        {/* Door */}
        <rect x="46" y="98" width="28" height="32" rx="4" fill="#c87030" stroke="#8a4010" strokeWidth="2" />
        <circle cx="71" cy="115" r="2.5" fill="#f8d060" />
        {/* Door arch */}
        <path d="M 46 102 Q 60 92 74 102" fill="#c87030" stroke="#8a4010" strokeWidth="2" />
        {/* School steps */}
        <rect x="38" y="130" width="44" height="6" rx="1" fill="#d0c0a0" />
        <rect x="34" y="136" width="52" height="6" rx="1" fill="#c0b090" />
      </g>

      {/* Flagpole with checkered flag */}
      <g transform="translate(1448, 310)">
        <line x1="-15" y1="130" x2="-15" y2="-10" stroke="#888" strokeWidth="3" />
        {/* Checkered flag */}
        <rect x="-15" y="-10" width="6" height="6" fill="black" />
        <rect x="-9" y="-10" width="6" height="6" fill="white" />
        <rect x="-3" y="-10" width="6" height="6" fill="black" />
        <rect x="-15" y="-4" width="6" height="6" fill="white" />
        <rect x="-9" y="-4" width="6" height="6" fill="black" />
        <rect x="-3" y="-4" width="6" height="6" fill="white" />
      </g>

      {/* School bus */}
      <g transform="translate(1448, 465)">
        {/* Bus body */}
        <rect x="-10" y="0" width="120" height="44" rx="8" fill="#f5d020" stroke="#c8a000" strokeWidth="3" />
        {/* Bus front */}
        <rect x="100" y="8" width="22" height="28" rx="4" fill="#f5d020" stroke="#c8a000" strokeWidth="3" />
        {/* Bus windshield */}
        <rect x="102" y="11" width="16" height="14" rx="3" fill="#88c4e8" />
        {/* Bus door */}
        <rect x="2" y="6" width="16" height="30" rx="3" fill="#c8a000" stroke="#a08000" strokeWidth="1.5" />
        {/* Bus windows */}
        <rect x="22" y="6" width="16" height="18" rx="3" fill="#88c4e8" stroke="#c8a000" strokeWidth="1.5" />
        <rect x="44" y="6" width="16" height="18" rx="3" fill="#88c4e8" stroke="#c8a000" strokeWidth="1.5" />
        <rect x="66" y="6" width="16" height="18" rx="3" fill="#88c4e8" stroke="#c8a000" strokeWidth="1.5" />
        {/* Bus wheels */}
        <circle cx="20" cy="46" r="12" fill="#333" />
        <circle cx="20" cy="46" r="6" fill="#888" />
        <circle cx="20" cy="46" r="3" fill="#555" />
        <circle cx="90" cy="46" r="12" fill="#333" />
        <circle cx="90" cy="46" r="6" fill="#888" />
        <circle cx="90" cy="46" r="3" fill="#555" />
        {/* BUS text */}
        <text x="55" y="30" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#c8a000">🚌 BUS SEKOLAH</text>
      </g>

      {/* FINISH sign */}
      <g filter="url(#soft)">
        <rect x="1448" y="516" width="150" height="56" rx="12" fill="#e04040" stroke="#a01010" strokeWidth="4" />
        <text x="1523" y="539" textAnchor="middle" fontSize="15" fontWeight="900" fill="white" fontFamily="serif" letterSpacing="2">🏁 FINISH</text>
        <text x="1523" y="560" textAnchor="middle" fontSize="13" fontWeight="700" fill="#ffe8e8" fontFamily="serif" letterSpacing="1">SEKOLAH</text>
      </g>

      {/* Arrow pointing left toward FINISH */}
      <path d="M 1440 544 L 1415 544 L 1425 536 M 1415 544 L 1425 552" stroke="#e04040" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* ── TITLE PLAQUE (top-left) ── */}
      <g filter="url(#soft)">
        <rect x="12" y="12" width="210" height="52" rx="12" fill="url(#wood)" stroke="#8a5020" strokeWidth="3" />
        <text x="117" y="34" textAnchor="middle" fontSize="13" fontWeight="900" fill="#3a1a08" fontFamily="serif">🗺️ PETA</text>
        <text x="117" y="52" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5a3010" fontFamily="serif">PETUALANGAN</text>
      </g>

      {/* ── BANNER (top center) ── */}
      <g filter="url(#soft)">
        {/* Banner rope */}
        <path d="M 580 20 Q 800 50 1020 20" stroke="#8a6020" strokeWidth="2" fill="none" />
        {/* Banner cloth */}
        <path d="M 580 20 Q 800 60 1020 20 L 1020 50 Q 800 80 580 50 Z" fill="#e8c050" stroke="#c8a030" strokeWidth="2" opacity="0.95" />
        <text x="800" y="52" textAnchor="middle" fontSize="20" fontWeight="900" fill="#5a3010" fontFamily="serif">🎲 QUIZ BOARD ADVENTURE 🎲</text>
      </g>

      {/* ══════════════════════════════════════════
           PATH RIBBONS — 3 separate winding paths
         ══════════════════════════════════════════ */}
      {ADVENTURE_PATHS.map((path, pathIdx) => {
        const isCurrentTurnPath = currentTeamPathId === path.id;
        const svgD = pathToSvg(path.waypoints);
        return (
          <g key={path.id}>
            {/* Glowing active track halo when it's this track's turn */}
            {isCurrentTurnPath && (
              <path
                d={svgD}
                fill="none"
                stroke="#fde047"
                strokeWidth={28}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.45}
                filter="url(#soft)"
              />
            )}
            {/* Shadow layer */}
            <path
              d={svgD}
              fill="none"
              stroke="rgba(0,0,0,0.28)"
              strokeWidth={22}
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(0,4)"
            />
            {/* Main ribbon */}
            <path
              d={svgD}
              fill="none"
              stroke={path.ribbonDark}
              strokeWidth={20}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Highlight ribbon */}
            <path
              d={svgD}
              fill="none"
              stroke={path.ribbon}
              strokeWidth={14}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner dashed lane line */}
            <path
              d={svgD}
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={3}
              strokeDasharray="8 6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}

      {/* ══════════════════════════════════════════
           PATH LABELS — left side of each path
         ══════════════════════════════════════════ */}
      {ADVENTURE_PATHS.map((path, pathIdx) => {
        const assignedTeam = teams.find((t, i) => (t.pathId || ADVENTURE_PATHS[i % ADVENTURE_PATHS.length].id) === path.id);
        const isCurrentTurn = currentTeamPathId === path.id;
        const [wx, wy] = path.waypoints[0];
        const lx = wx - 110;
        const ly = wy;

        return (
          <g key={`label-${path.id}`}>
            {/* Active glow backing */}
            {isCurrentTurn && (
              <rect
                x={lx - 68}
                y={ly - 26}
                width={136}
                height={52}
                rx={14}
                fill="#facc15"
                opacity={0.35}
                filter="url(#soft)"
              />
            )}
            {/* Main plaque */}
            <rect
              x={lx - 64}
              y={ly - 22}
              width={128}
              height={44}
              rx={12}
              fill={isCurrentTurn ? '#1e1b4b' : path.labelColor}
              stroke={isCurrentTurn ? '#fbbf24' : '#ffffff88'}
              strokeWidth={isCurrentTurn ? 3 : 1.5}
              filter="url(#soft)"
            />
            {/* Track Name */}
            <text
              x={lx}
              y={ly - 6}
              textAnchor="middle"
              fontSize="12"
              fontWeight="900"
              fill={isCurrentTurn ? '#fde047' : 'white'}
              fontFamily="sans-serif"
            >
              {path.emoji} Jalur {pathIdx + 1}: {path.name}
            </text>
            {/* Assigned Team */}
            {assignedTeam ? (
              <text
                x={lx}
                y={ly + 10}
                textAnchor="middle"
                fontSize="10"
                fill="white"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {assignedTeam.avatarEmoji} {assignedTeam.name.length > 11 ? assignedTeam.name.slice(0, 10) + '…' : assignedTeam.name}
              </text>
            ) : (
              <text
                x={lx}
                y={ly + 10}
                textAnchor="middle"
                fontSize="9"
                fill="rgba(255,255,255,0.85)"
                fontFamily="sans-serif"
              >
                {path.tagline}
              </text>
            )}
            {/* Turn badge indicator */}
            {isCurrentTurn && (
              <g transform={`translate(${lx}, ${ly + 22})`}>
                <rect x="-36" y="-3" width="72" height="15" rx="6" fill="#f59e0b" />
                <text x="0" y="8" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#000">
                  ▶ GILIRAN
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* ══════════════════════════════════════════
           TILES — all 3 paths, 30 tiles each
         ══════════════════════════════════════════ */}
      {ADVENTURE_PATHS.map((path, pathIdx) => {
        const assignedTeam = teams.find((t, i) => (t.pathId || ADVENTURE_PATHS[i % ADVENTURE_PATHS.length].id) === path.id);
        const isCurrentTurn = currentTeamPathId === path.id;

        return (
          <g key={`tiles-${path.id}`}>
            {path.waypoints.map((wp, idx) => {
              const tileNum = idx + 1; // 1 to 30
              const tileType = board[idx]?.type ?? 'normal';
              const isStart = idx === 0;
              const isFinish = idx === path.waypoints.length - 1;
              const landmark = path.landmarks.find((l) => l.index === idx);
              const isHovered = hoveredTile?.position === tileNum;
              const boardTile = board[idx];
              const isPawnHere = assignedTeam && assignedTeam.position === tileNum;

              const ts = tileSize;
              const hw = ts / 2;

              let fill = path.tileFill;
              let stroke = path.tileStroke;
              let strokeW = 1.8;

              if (isStart) { fill = '#fef9c3'; stroke = '#ca8a04'; strokeW = 3; }
              else if (isFinish) { fill = '#d1fae5'; stroke = '#059669'; strokeW = 3; }
              else if (tileType === 'reward') { fill = '#fef3c7'; stroke = '#d97706'; }
              else if (tileType === 'mystery') { fill = '#ede9fe'; stroke = '#7c3aed'; }
              else if (tileType === 'shop') { fill = '#fce7f3'; stroke = '#be185d'; }
              else if (tileType === 'duel') { fill = '#fee2e2'; stroke = '#dc2626'; }
              else if (tileType === 'trap') { fill = '#fff7ed'; stroke = '#ea580c'; }

              if (isPawnHere) {
                stroke = assignedTeam.color;
                strokeW = 3.5;
              }

              if (isHovered) {
                fill = '#fffde7';
                stroke = '#f59e0b';
                strokeW = 3.8;
              }

              return (
                <g
                  key={`tile-${path.id}-${idx}`}
                  transform={`translate(${wp[0]},${wp[1]})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => boardTile && onHoverTile({ ...boardTile, environment: path.id, label: `${path.name} Kotak #${tileNum}` })}
                  onMouseLeave={() => onHoverTile(null)}
                  filter={isHovered ? 'url(#soft)' : 'url(#tileShadow)'}
                >
                  {/* Tile background */}
                  <rect
                    x={-hw}
                    y={-hw}
                    width={ts}
                    height={ts}
                    rx={8}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeW}
                  />

                  {/* Special tile overlay shimmer */}
                  {(isStart || isFinish) && (
                    <rect
                      x={-hw + 2}
                      y={-hw + 2}
                      width={ts - 4}
                      height={(ts - 4) / 2}
                      rx={6}
                      fill="rgba(255,255,255,0.4)"
                    />
                  )}

                  {/* Landmark icon */}
                  {landmark && (
                    <text
                      x={0}
                      y={-5}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={isStart || isFinish ? 16 : 14}
                    >
                      {isStart ? '🏠' : isFinish ? '🏫' : landmark.icon}
                    </text>
                  )}

                  {/* Start / Finish special icons */}
                  {isStart && !landmark && (
                    <text x={0} y={-5} textAnchor="middle" dominantBaseline="middle" fontSize={16}>🏠</text>
                  )}
                  {isFinish && !landmark && (
                    <text x={0} y={-5} textAnchor="middle" dominantBaseline="middle" fontSize={16}>🏫</text>
                  )}

                  {/* Tile number */}
                  <text
                    x={0}
                    y={landmark || isStart || isFinish ? hw - 7 : 0}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={landmark || isStart || isFinish ? 10 : 13}
                    fontWeight="bold"
                    fill={isStart ? '#92400e' : isFinish ? '#065f46' : stroke}
                    fontFamily="sans-serif"
                  >
                    {isStart ? 'S' : isFinish ? 'F' : tileNum}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* ══════════════════════════════════════════
           TEAM PIONS — Each team on their OWN PATH!
         ══════════════════════════════════════════ */}
      {teams.map((team, ti) => {
        // Resolve team's designated path
        const pathId = team.pathId || ADVENTURE_PATHS[ti % ADVENTURE_PATHS.length].id;
        const teamPath = getAdventurePath(pathId);
        const pos = Math.min(Math.max(1, team.position), teamPath.waypoints.length);
        const targetWp = teamPath.waypoints[pos - 1] || teamPath.waypoints[0];
        const isCurrentTurn = ti === currentTeamIndex;

        // In case multiple teams share the same path, give small offset
        const samePathTeams = teams.filter((t, idx) => (t.pathId || ADVENTURE_PATHS[idx % ADVENTURE_PATHS.length].id) === pathId);
        const samePathIndex = samePathTeams.findIndex(t => t.id === team.id);
        const offsetX = samePathTeams.length > 1 ? (samePathIndex % 2 === 0 ? -12 : 12) : 0;
        const offsetY = samePathTeams.length > 1 ? Math.floor(samePathIndex / 2) * -10 : 0;

        return (
          <motion.g
            key={team.id}
            animate={{ x: targetWp[0] + offsetX, y: targetWp[1] + offsetY - 22 }}
            transition={{ type: 'spring', stiffness: 140, damping: 16 }}
            filter="url(#soft)"
          >
            {/* Pulsing indicator under current turn's pion */}
            {isCurrentTurn && (
              <circle
                cx={0}
                cy={0}
                r={24}
                fill="none"
                stroke="#facc15"
                strokeWidth={3}
                strokeDasharray="4 3"
                className="animate-spin"
                style={{ animationDuration: '4s' }}
              />
            )}
            {/* Pion shadow */}
            <ellipse cx={0} cy={24} rx={13} ry={5} fill="rgba(0,0,0,0.3)" />
            {/* Pion base/ring */}
            <circle
              cx={0}
              cy={0}
              r={18}
              fill={team.color}
              stroke="white"
              strokeWidth={3.5}
            />
            {/* Pion avatar emoji */}
            <text x={0} y={1} textAnchor="middle" dominantBaseline="middle" fontSize={16}>
              {team.avatarEmoji}
            </text>
            {/* Team name & position pill */}
            <rect
              x={-34}
              y={20}
              width={68}
              height={18}
              rx={6}
              fill={isCurrentTurn ? '#1e1b4b' : 'rgba(0,0,0,0.75)'}
              stroke={isCurrentTurn ? '#fbbf24' : 'rgba(255,255,255,0.3)'}
              strokeWidth={isCurrentTurn ? 2 : 1}
            />
            <text
              x={0}
              y={29}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill="white"
              fontWeight="bold"
            >
              {team.name.length > 9 ? team.name.slice(0, 8) + '…' : team.name} #{team.position}
            </text>
          </motion.g>
        );
      })}

      {/* ══════════════════════════════════════════
           LEGEND BAR — bottom
         ══════════════════════════════════════════ */}
      <g>
        {/* Legend background */}
        <rect x="300" y="860" width="1000" height="34" rx="10" fill="rgba(0,0,0,0.5)" />
        {MAP_LEGEND.map((item, i) => {
          const lx = 330 + i * 200;
          return (
            <g key={i}>
              <text x={lx} y={881} textAnchor="middle" fontSize="14">{item.icon}</text>
              <text x={lx + 16} y={881} fontSize="11" fill="white" fontWeight="600" dominantBaseline="middle">
                {item.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
