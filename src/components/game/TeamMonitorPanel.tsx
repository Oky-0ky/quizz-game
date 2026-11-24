'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { getAdventurePath, ADVENTURE_PATHS } from '@/data/adventureMap';
import { AdventurePathId } from '@/types/game';

/**
 * Panel monitoring di sisi kiri papan permainan.
 * Menampilkan poin (skor), koin, dan posisi tiap kelompok secara live.
 */
export default function TeamMonitorPanel() {
  const game = useGameStore(s => s.game);
  const getLeaderboard = useGameStore(s => s.getLeaderboard);

  if (!game) return null;

  const teams = getLeaderboard();
  const maxPosition = game.settings.totalTiles || 100;
  const currentTeamId = game.teams[game.currentTeamIndex]?.id;

  return (
    <div className="flex flex-col gap-3 p-3 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-white/70 text-xs font-bold uppercase tracking-wider">📊 Monitoring</h2>
        <span className="text-white/40 text-[10px]">Putaran {game.currentTurn}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
        {teams.map((team, i) => {
          const isCurrent = team.id === currentTeamId;
          const progress = Math.min(100, Math.round((team.position / maxPosition) * 100));
          return (
            <motion.div
              key={team.id}
              layout
              className={`rounded-xl border p-2 transition-colors ${isCurrent ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10'
                }`}
              style={{ borderLeftWidth: 4, borderLeftColor: team.color }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{team.avatarEmoji}</span>
                <span className="flex-1 min-w-0 text-white font-bold text-xs truncate" title={team.name}>
                  {team.name}
                </span>
                {isCurrent && <span className="text-yellow-400 text-[10px] animate-pulse">▶</span>}
              </div>

              {/* Designated Track */}
              <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold mt-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                <span>{getAdventurePath(team.pathId || ADVENTURE_PATHS[i % ADVENTURE_PATHS.length].id).emoji}</span>
                <span className="truncate">{getAdventurePath(team.pathId || ADVENTURE_PATHS[i % ADVENTURE_PATHS.length].id).name}</span>
              </div>

              <div className="grid grid-cols-2 gap-1 mt-1.5">
                <div className="bg-black/25 rounded-md px-1.5 py-1">
                  <div className="text-[9px] text-purple-300/80 uppercase leading-none">Poin</div>
                  <div className="text-white font-bold text-sm leading-tight tabular-nums">{team.score}</div>
                </div>
                <div className="bg-black/25 rounded-md px-1.5 py-1">
                  <div className="text-[9px] text-yellow-400/80 uppercase leading-none">Koin</div>
                  <div className="text-yellow-300 font-bold text-sm leading-tight tabular-nums">💰{team.coins}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 text-[10px] text-white/50">
                <span>Kotak #{team.position}</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-0.5 h-1 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: team.color }}
                />
              </div>

              <div className="flex items-center justify-between mt-1 text-[9px] text-white/40">
                <span>✅ {team.correctAnswers} benar</span>
                <span>#{i + 1}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
