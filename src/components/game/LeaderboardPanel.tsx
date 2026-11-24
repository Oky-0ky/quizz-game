'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export default function LeaderboardPanel({ onClose }: { onClose: () => void }) {
  const game = useGameStore(s => s.game);
  const getLeaderboard = useGameStore(s => s.getLeaderboard);

  if (!game) return null;
  const teams = getLeaderboard();

  const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣'];
  const rankBgs = [
    'bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border-yellow-500/30',
    'bg-gradient-to-r from-gray-800/40 to-slate-800/40 border-gray-500/30',
    'bg-gradient-to-r from-orange-900/40 to-amber-900/40 border-orange-500/30',
    'bg-gray-800/30 border-gray-700/30',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-800/50 to-amber-800/50 p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-white">🏆 Leaderboard</h2>
            <p className="text-white/60 text-sm">Giliran ke-{game.currentTurn}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl transition-colors">✕</button>
        </div>

        {/* Rankings */}
        <div className="p-5 space-y-3">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-4 border ${rankBgs[i] || rankBgs[3]}`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold w-8 text-center">{rankEmojis[i] || `#${i + 1}`}</div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 flex-shrink-0"
                  style={{ backgroundColor: team.color + '33', borderColor: team.color }}
                >
                  {team.avatarEmoji}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">{team.name}</div>
                  <div className="text-white/50 text-xs">{team.members.map(m => m.name).join(', ')}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                <div>
                  <div className="text-white/50 text-xs">Kotak</div>
                  <div className="text-white font-bold">#{team.position}</div>
                </div>
                <div>
                  <div className="text-yellow-400/70 text-xs">Koin</div>
                  <div className="text-yellow-300 font-bold">💰{team.coins}</div>
                </div>
                <div>
                  <div className="text-white/50 text-xs">Skor</div>
                  <div className="text-white font-bold">{team.score}</div>
                </div>
                <div>
                  <div className="text-green-400/70 text-xs">Benar</div>
                  <div className="text-green-300 font-bold">✅{team.correctAnswers}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-2 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(team.position / game.settings.totalTiles) * 100}%`,
                    backgroundColor: team.color,
                  }}
                />
              </div>
              <div className="text-white/30 text-xs mt-1 text-right">
                {Math.round((team.position / game.settings.totalTiles) * 100)}% perjalanan
              </div>
            </motion.div>
          ))}
        </div>

        {/* Achievements preview */}
        <div className="border-t border-white/10 p-4">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">🏅 Statistik</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {teams[0] && (
              <div className="bg-gray-800/50 rounded-xl p-2 text-center">
                <div className="text-yellow-400">👑 Raja Kuis</div>
                <div className="text-white text-xs">{teams[0].name}</div>
              </div>
            )}
            {(() => {
              const mostCorrect = [...teams].sort((a, b) => b.correctAnswers - a.correctAnswers)[0];
              return mostCorrect ? (
                <div className="bg-gray-800/50 rounded-xl p-2 text-center">
                  <div className="text-green-400">🎯 Paling Benar</div>
                  <div className="text-white text-xs">{mostCorrect.name} ({mostCorrect.correctAnswers})</div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
