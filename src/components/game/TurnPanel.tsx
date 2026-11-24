'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Team } from '@/types/game';
import { getAdventurePath } from '@/data/adventureMap';

interface TurnPanelProps {
  onOpenShop: () => void;
  onOpenInventory: () => void;
}

function TeamCard({ team, isCurrent }: { team: Team; isCurrent: boolean }) {
  return (
    <motion.div
      animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`rounded-2xl p-3 border transition-all ${
        isCurrent
          ? 'bg-white/10 border-white/30 shadow-lg'
          : 'bg-white/5 border-white/10 opacity-70'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xl border-2 flex-shrink-0"
          style={{ backgroundColor: team.color + '33', borderColor: team.color }}
        >
          {team.avatarEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm truncate flex items-center gap-1">
            {team.name}
            {isCurrent && <span className="text-yellow-400 text-xs animate-pulse">▶</span>}
          </div>
          <div className="text-white/50 text-xs truncate">{team.members.map(m => m.name).join(', ')}</div>
          <div className="text-[10px] text-amber-300 font-semibold mt-0.5 flex items-center gap-1">
            <span>{getAdventurePath(team.pathId || 'hutan').emoji}</span>
            <span>{getAdventurePath(team.pathId || 'hutan').name}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 text-center">
        <div className="bg-black/20 rounded-lg py-1">
          <div className="text-xs text-white/50">Kotak</div>
          <div className="font-bold text-white text-sm">#{team.position}</div>
        </div>
        <div className="bg-black/20 rounded-lg py-1">
          <div className="text-xs text-yellow-400/70">Koin</div>
          <div className="font-bold text-yellow-300 text-sm">💰{team.coins}</div>
        </div>
        <div className="bg-black/20 rounded-lg py-1">
          <div className="text-xs text-white/50">Skor</div>
          <div className="font-bold text-white text-sm">{team.score}</div>
        </div>
      </div>

      {/* Effects */}
      {team.isProtected && (
        <div className="mt-2 text-xs text-cyan-300 bg-cyan-500/10 rounded-lg px-2 py-1 text-center">
          🛡️ Perlindungan Aktif
        </div>
      )}
      {team.skipTurns > 0 && (
        <div className="mt-2 text-xs text-orange-300 bg-orange-500/10 rounded-lg px-2 py-1 text-center">
          ⏸️ Lewati {team.skipTurns} giliran
        </div>
      )}

      {/* Inventory count */}
      <div className="mt-2 flex gap-1 flex-wrap items-center">
        {team.inventory.map(inv => (
          <span key={inv.id} className="text-sm" title={inv.item.name}>
            {inv.item.emoji}
            {inv.quantity > 1 && <sup className="text-xs text-white/60">×{inv.quantity}</sup>}
          </span>
        ))}
        <span className="text-[10px] text-white/45 self-center">
          {team.inventory.reduce((total, item) => total + item.quantity, 0)} item
        </span>
      </div>
    </motion.div>
  );
}

function DiceButton() {
  const game = useGameStore(s => s.game);
  const rollDice = useGameStore(s => s.rollDice);

  if (!game) return null;
  const isDiceMode = game.settings.enableDice || game.settings.movementMode === 'dice';
  if (!isDiceMode || !game.questionAnsweredCorrectly) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={rollDice}
      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-display text-lg py-3 rounded-2xl shadow-lg transition-all"
    >
      👣 Maju 1 Kotak
      {game.diceResult && (
        <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-base">= {game.diceResult}</span>
      )}
    </motion.button>
  );
}

export default function TurnPanel({ onOpenShop, onOpenInventory }: TurnPanelProps) {
  const game = useGameStore(s => s.game);
  const startTurn = useGameStore(s => s.startTurn);
  const endTurn = useGameStore(s => s.endTurn);
  const pauseGame = useGameStore(s => s.pauseGame);
  const resumeGame = useGameStore(s => s.resumeGame);

  if (!game) return null;

  const currentTeam = game.teams[game.currentTeamIndex];
  const isPaused = game.phase === 'paused';
  const canStartTurn = game.phase === 'playing' && !isPaused && !game.questionAnswerSubmitted;

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      {/* Game info */}
      <div className="bg-gradient-to-r from-purple-800/50 to-indigo-800/50 rounded-2xl p-3 border border-purple-500/20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/60 text-xs">Giliran ke-{game.currentTurn}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPaused ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300'}`}>
            {isPaused ? '⏸ Jeda' : '▶ Aktif'}
          </span>
        </div>
        <div className="font-display text-white text-lg">
          {currentTeam ? `Giliran: ${currentTeam.name}` : 'Memuat...'}
        </div>
        {currentTeam && (
          <div className="text-xs text-amber-300 font-semibold mt-1 flex items-center gap-1.5">
            <span>{getAdventurePath(currentTeam.pathId || 'hutan').emoji}</span>
            <span>Jalur: {getAdventurePath(currentTeam.pathId || 'hutan').name}</span>
            <span className="text-white/60">· Kotak #{currentTeam.position}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        {canStartTurn && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startTurn}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-display text-lg py-3 rounded-2xl shadow-lg transition-all"
          >
            ❓ Ambil Soal!
          </motion.button>
        )}

        <DiceButton />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenShop}
            disabled={!game.settings.enableShop}
            className="bg-emerald-700/50 hover:bg-emerald-700/70 disabled:opacity-40 text-emerald-200 border border-emerald-500/30 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1"
          >
            🏪 Toko
          </button>
          <button
            onClick={onOpenInventory}
            className="bg-blue-700/50 hover:bg-blue-700/70 text-blue-200 border border-blue-500/30 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1"
          >
            🎒 Inventaris
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={isPaused ? resumeGame : pauseGame}
            className="bg-orange-700/50 hover:bg-orange-700/70 text-orange-200 border border-orange-500/30 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            {isPaused ? '▶ Lanjut' : '⏸ Jeda'}
          </button>
          {game.phase === 'tile_effect' && (
            <button
              onClick={endTurn}
              className="bg-purple-700/50 hover:bg-purple-700/70 text-purple-200 border border-purple-500/30 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              ⏭ Lanjut
            </button>
          )}
        </div>
      </div>

      {/* Teams list */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Semua Kelompok</h3>
        {game.teams.map((team, i) => (
          <TeamCard
            key={team.id}
            team={team}
            isCurrent={i === game.currentTeamIndex}
          />
        ))}
      </div>

      {/* Quick legend */}
      <div className="bg-black/20 rounded-xl p-2 text-xs text-white/40 text-center">
        Putaran {game.currentTurn} · {game.settings.totalTiles} kotak · Mode: {game.settings.gameMode}
      </div>
    </div>
  );
}
