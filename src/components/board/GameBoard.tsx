'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { BoardTile, Team } from '@/types/game';
import { getBoardDimensions } from '@/utils/boardGenerator';
import { TILE_CONFIG } from '@/data/gameData';
import { ADVENTURE_MAP, AdventurePathId, getAdventurePath } from '@/data/adventureMap';
import AdventureMapView from '@/components/board/AdventureMapView';

const TILE_SIZE = 68;
const TILE_GAP = 3;
const STEP = TILE_SIZE + TILE_GAP;

function getTileClass(type: string): string {
  const map: Record<string, string> = {
    normal: 'bg-indigo-100 border-indigo-300',
    start: 'bg-green-200 border-green-400',
    finish: 'bg-yellow-200 border-yellow-400',
    reward: 'bg-amber-200 border-amber-400',
    challenge: 'bg-blue-200 border-blue-400',
    trap: 'bg-red-200 border-red-400',
    shop: 'bg-emerald-200 border-emerald-400',
    mystery: 'bg-purple-200 border-purple-400',
    duel: 'bg-orange-200 border-orange-400',
    shortcut: 'bg-cyan-200 border-cyan-400',
    rest: 'bg-teal-200 border-teal-400',
    tax: 'bg-pink-200 border-pink-400',
  };
  return map[type] || 'bg-gray-200 border-gray-400';
}

function getTileGlow(type: string): string {
  const map: Record<string, string> = {
    start: 'shadow-green-400/50',
    finish: 'shadow-yellow-400/50',
    reward: 'shadow-amber-400/50',
    trap: 'shadow-red-400/50',
    shop: 'shadow-emerald-400/50',
    mystery: 'shadow-purple-400/50',
    duel: 'shadow-orange-400/50',
  };
  return map[type] ? `shadow-md ${map[type]}` : '';
}

// Environment decoration backgrounds
function getTileEnvGradient(env: string | undefined, type: string): string {
  if (type !== 'normal') return '';
  const gradients: Record<string, string> = {
    forest: 'from-green-100 to-emerald-100',
    village: 'from-amber-100 to-yellow-100',
    bridge: 'from-blue-100 to-sky-100',
    river: 'from-cyan-100 to-blue-100',
    garden: 'from-pink-100 to-rose-100',
    castle: 'from-gray-100 to-slate-100',
    meadow: 'from-lime-100 to-green-100',
    cave: 'from-stone-100 to-gray-100',
    beach: 'from-yellow-100 to-amber-100',
    park: 'from-teal-100 to-cyan-100',
  };
  return gradients[env || ''] ? `bg-gradient-to-br ${gradients[env || '']}` : '';
}

// Environment mini-illustrations
function EnvDecor({ env, type }: { env?: string; type: string }) {
  if (type !== 'normal') return null;
  const decors: Record<string, string> = {
    forest: '🌲', village: '🏘️', bridge: '🌉', river: '🌊',
    garden: '🌸', castle: '🏰', meadow: '🌾', cave: '🦇',
    beach: '🌴', park: '⛲',
  };
  const decor = decors[env || ''];
  if (!decor) return null;
  return <div className="absolute top-0.5 right-0.5 text-xs opacity-30 leading-none">{decor}</div>;
}

interface TileProps {
  tile: BoardTile;
  teams: Team[];
  isHovered: boolean;
  onHover: (tile: BoardTile | null) => void;
  onClick: (tile: BoardTile) => void;
}

function Tile({ tile, teams, isHovered, onHover, onClick }: TileProps) {
  const teamsOnTile = teams.filter(t => t.position === tile.position);
  const config = TILE_CONFIG[tile.type as keyof typeof TILE_CONFIG] || TILE_CONFIG.normal;

  const isSpecial = tile.type !== 'normal';
  const size = TILE_SIZE;

  return (
    <div
      className={`absolute select-none cursor-pointer transition-all duration-150 rounded-lg border-2 overflow-hidden
        ${getTileClass(tile.type)}
        ${getTileGlow(tile.type)}
        ${isHovered ? 'z-20 scale-110 brightness-110' : 'z-0'}
        ${isSpecial ? 'shadow-sm' : ''}
      `}
      style={{
        left: tile.x,
        top: tile.y,
        width: size,
        height: size,
      }}
      onMouseEnter={() => onHover(tile)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(tile)}
    >
      {/* Background gradient for environment */}
      {!isSpecial && (
        <div className={`absolute inset-0 ${getTileEnvGradient(tile.environment, tile.type)}`} />
      )}

      {/* Tile number */}
      <div className={`absolute top-0.5 left-1 text-xs font-bold leading-none
        ${tile.type === 'finish' ? 'text-yellow-700' : tile.type === 'start' ? 'text-green-700' : 'text-gray-500/70'}`}>
        {tile.position}
      </div>

      {/* Environment decor */}
      <EnvDecor env={tile.environment} type={tile.type} />

      {tile.position % 3 === 0 && tile.position < 100 && (
        <div className="absolute top-0 right-0.5 z-10 text-[10px]" title="Kotak hadiah">🎁</div>
      )}

      {/* Special tile content */}
      {isSpecial && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xl leading-none">{config.emoji}</div>
          {(tile.type === 'start' || tile.type === 'finish') && (
            <div className="text-xs font-display font-black mt-0.5" style={{ fontSize: '9px' }}>{config.label}</div>
          )}
        </div>
      )}

      {/* Pions */}
      {teamsOnTile.length > 0 && (
        <div className="absolute bottom-0.5 left-0 right-0 flex justify-center gap-0.5 z-10">
          {teamsOnTile.slice(0, 4).map(team => (
            <motion.div
              key={team.id}
              layoutId={`team-pion-${team.id}`}
              initial={{ scale: 0, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="text-base leading-none drop-shadow-md"
              style={{ filter: `drop-shadow(0 0 3px ${team.color})` }}
              title={team.name}
            >
              {team.avatarEmoji}
            </motion.div>
          ))}
        </div>
      )}

      {/* Active highlight pulse for special tiles */}
      {(tile.type === 'finish' || tile.type === 'start') && (
        <div className="absolute inset-0 rounded-lg animate-pulse opacity-20"
          style={{ backgroundColor: tile.type === 'finish' ? '#fbbf24' : '#4ade80' }} />
      )}
    </div>
  );
}



export default function GameBoard() {
  const game = useGameStore(s => s.game);
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; ox: number; oy: number; dist?: number }>({ x: 0, y: 0, ox: 0, oy: 0 });

  const [zoom, setZoom] = useState(0.85);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 });
  const [hoveredTile, setHoveredTile] = useState<BoardTile | null>(null);

  const settings = game?.settings;
  const isAdventure = (settings?.boardMapId ?? 'adventure') === 'adventure';
  const dims = getBoardDimensions(settings?.totalTiles ?? 100, settings?.boardMapId ?? 'adventure');
  const boardW = isAdventure ? ADVENTURE_MAP.width : dims.cols * STEP;
  const boardH = isAdventure ? ADVENTURE_MAP.height : dims.rows * STEP;

  // Auto-fit zoom on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          const fitZoom = Math.min(
            (clientWidth - 60) / (boardW + 80),
            (clientHeight - 60) / (boardH + 80),
            1.2
          );
          if (fitZoom > 0) {
            setZoom(Number(Math.max(0.35, fitZoom).toFixed(2)));
          }
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [boardW, boardH]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom(z => Math.min(2.5, Math.max(0.3, Number((z + delta).toFixed(2)))));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-tile]')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y });
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: dragStart.ox + (e.clientX - dragStart.x),
      y: dragStart.oy + (e.clientY - dragStart.y),
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // Touch handlers for mobile & tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        ox: offset.x,
        oy: offset.y,
      };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setOffset({
        x: touchStartRef.current.ox + (touch.clientX - touchStartRef.current.x),
        y: touchStartRef.current.oy + (touch.clientY - touchStartRef.current.y),
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - touchStartRef.current.dist) * 0.005;
      setZoom(z => Math.min(2.5, Math.max(0.3, Number((z + delta).toFixed(2)))));
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setOffset({ x: 0, y: 0 });
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const fitZoom = Math.min(
        (clientWidth - 60) / (boardW + 80),
        (clientHeight - 60) / (boardH + 80),
        1.2
      );
      setZoom(Number(Math.max(0.35, fitZoom).toFixed(2)));
    } else {
      setZoom(0.85);
    }
  };

  if (!game) return null;

  const { board, teams } = game;

  // Scroll to current team pion
  const currentTeam = teams[game.currentTeamIndex] || teams[0];

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900 select-none touch-none">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        <button onClick={() => setZoom(z => Math.min(2.5, Number((z + 0.15).toFixed(2))))} className="w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-xl font-bold text-lg backdrop-blur flex items-center justify-center border border-white/20 transition-colors shadow-lg">+</button>
        <button onClick={() => setZoom(z => Math.max(0.3, Number((z - 0.15).toFixed(2))))} className="w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-xl font-bold text-lg backdrop-blur flex items-center justify-center border border-white/20 transition-colors shadow-lg">−</button>
        <button onClick={resetView} className="w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-xl text-sm backdrop-blur flex items-center justify-center border border-white/20 transition-colors shadow-lg" title="Fit Screen">🏠</button>
        <div className="bg-black/60 backdrop-blur text-white/70 text-xs rounded-xl px-2 py-1 text-center border border-white/20 shadow-lg">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Current turn indicator */}
      <div className="absolute top-4 left-4 z-30">
        <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-xl">
          <div className="text-white/60 text-xs font-semibold">Giliran Aktif</div>
          <div className="font-bold text-white flex items-center gap-2 mt-0.5">
            <span className="text-xl">{currentTeam?.avatarEmoji || '🦅'}</span>
            <span style={{ color: currentTeam?.color || '#3b82f6' }}>{currentTeam?.name || 'Kelompok'}</span>
          </div>
          <div className="text-white/60 text-xs mt-0.5">Kotak #{currentTeam?.position ?? 1} · 💰 {currentTeam?.coins ?? 0} koin</div>
          {isAdventure && (
            <div className="text-amber-300 text-[11px] mt-1 font-bold flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
              <span>{getAdventurePath(currentTeam?.pathId || 'hutan').emoji}</span>
              <span>{getAdventurePath(currentTeam?.pathId || 'hutan').name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Board drag container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Transform wrapper */}
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease',
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: -boardH / 2,
            marginLeft: -boardW / 2,
          }}
        >
          {/* Board background */}
          <div
            className="relative rounded-3xl overflow-visible"
            style={{
              width: boardW + (isAdventure ? 24 : 60),
              height: boardH + (isAdventure ? 24 : 60),
              margin: isAdventure ? '-12px' : '-30px',
              padding: isAdventure ? '12px' : '30px',
              background: isAdventure
                ? 'linear-gradient(180deg, #5fa8d3 0%, #3d7c47 100%)'
                : 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #166534 100%)',
              boxShadow: '0 0 60px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Wood border effect */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ border: isAdventure ? '10px solid' : '12px solid', borderColor: '#78350f', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)' }} />

            {isAdventure ? (
              <div ref={boardRef} className="relative" style={{ width: boardW, height: boardH }}>
                <AdventureMapView
                  board={board}
                  teams={teams}
                  totalTiles={settings?.totalTiles ?? 30}
                  activePathId={(currentTeam?.pathId || settings?.adventurePathId || 'hutan') as AdventurePathId}
                  currentTeamIndex={game.currentTeamIndex}
                  hoveredTile={hoveredTile}
                  onHoverTile={setHoveredTile}
                />
              </div>
            ) : (
              <>
                <div className="absolute inset-3 rounded-2xl opacity-30 pointer-events-none"
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 10px)' }} />

                <svg
                  className="absolute top-7 left-7 pointer-events-none"
                  style={{ width: boardW, height: boardH }}
                  viewBox={`0 0 ${boardW} ${boardH}`}
                >
                  {board.map((tile, i) => {
                    if (i === 0) return null;
                    const prev = board[i - 1];
                    const cx1 = prev.x + TILE_SIZE / 2;
                    const cy1 = prev.y + TILE_SIZE / 2;
                    const cx2 = tile.x + TILE_SIZE / 2;
                    const cy2 = tile.y + TILE_SIZE / 2;
                    return (
                      <line key={tile.id} x1={cx1} y1={cy1} x2={cx2} y2={cy2}
                        stroke="rgba(200,169,110,0.45)" strokeWidth="3" strokeDasharray="4 4" />
                    );
                  })}
                </svg>

                <div className="absolute top-8 left-8 text-4xl opacity-30 pointer-events-none select-none">🌳</div>
                <div className="absolute top-8 right-8 text-4xl opacity-30 pointer-events-none select-none">🏰</div>
                <div className="absolute bottom-8 left-8 text-4xl opacity-30 pointer-events-none select-none">🌊</div>
                <div className="absolute bottom-8 right-8 text-4xl opacity-30 pointer-events-none select-none">🦁</div>

                <div ref={boardRef} className="relative" style={{ width: boardW, height: boardH }}>
                  {board.map(tile => (
                    <Tile
                      key={tile.id}
                      tile={tile}
                      teams={teams}
                      isHovered={hoveredTile?.id === tile.id}
                      onHover={t => setHoveredTile(t)}
                      onClick={tile => setHoveredTile(tile)}
                    />
                  ))}
                </div>

                <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-3 flex-wrap opacity-80 pointer-events-none">
                  {(['reward', 'challenge', 'trap', 'shop', 'mystery', 'duel'] as const).map(type => (
                    <div key={type} className="flex items-center gap-1 text-white/90 text-xs bg-black/40 px-2 py-0.5 rounded-md">
                      <div className={`w-3.5 h-3.5 rounded border ${getTileClass(type)}`} />
                      <span>{TILE_CONFIG[type].label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredTile && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm shadow-xl border border-white/20">
              <span className="font-bold">{TILE_CONFIG[hoveredTile.type as keyof typeof TILE_CONFIG]?.emoji} Kotak {hoveredTile.position}</span>
              <span className="text-white/60 ml-2">— {TILE_CONFIG[hoveredTile.type as keyof typeof TILE_CONFIG]?.description}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
