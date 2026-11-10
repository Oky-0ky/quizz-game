'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

interface ConfettiConfig {
  delay: number;
  color: string;
  left: number;
  duration: number;
  size: number;
}

function makeConfetti(count: number, colors: string[]): ConfettiConfig[] {
  return Array.from({ length: count }).map(() => ({
    delay: Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    left: Math.random() * 100,
    duration: 2 + Math.random() * 3,
    size: 8 + Math.random() * 8,
  }));
}

function ConfettiPiece({ piece }: { piece: ConfettiConfig }) {
  return (
    <div
      className="confetti-piece fixed rounded-sm"
      style={{
        left: `${piece.left}%`,
        top: '-20px',
        backgroundColor: piece.color,
        width: piece.size,
        height: piece.size,
        '--delay': `${piece.delay}s`,
        '--duration': `${piece.duration}s`,
        animationDelay: `${piece.delay}s`,
        animationDuration: `${piece.duration}s`,
      } as React.CSSProperties}
    />
  );
}

export default function ResultsPage() {
  const game = useGameStore(s => s.game);
  const computeAchievements = useGameStore(s => s.computeAchievements);
  const getLeaderboard = useGameStore(s => s.getLeaderboard);

  // Generate confetti after mount so the render stays pure (no Math.random during render)
  const [confettiPieces, setConfettiPieces] = useState<ConfettiConfig[]>([]);
  useEffect(() => {
    const confettiColors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#ec4899', '#06b6d4'];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfettiPieces(makeConfetti(50, confettiColors));
  }, []);

  if (!game) return null;

  const rankings = getLeaderboard();
  const achievements = computeAchievements();
  const duration = game.endedAt && game.startedAt ? Math.round((game.endedAt - game.startedAt) / 60000) : 0;

  const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
  const podiumH = [140, 200, 120];
  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-gray-900 relative overflow-hidden">
      {/* Confetti */}
      {confettiPieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} />
      ))}

      <div className="relative z-10 max-w-4xl mx-auto p-6 pb-20">
        {/* Trophy Header */}
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 150, delay: 0.3 }}
          className="text-center mb-10 pt-10"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-8xl mb-4"
          >
            🏆
          </motion.div>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-2">PERMAINAN SELESAI!</h1>
          <p className="text-white/60 text-lg">
            {duration} menit · {game.currentTurn} giliran · {game.settings.totalTiles} kotak
          </p>
        </motion.div>

        {/* Podium */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center items-end gap-4 mb-12"
        >
          {podiumOrder.map((rankIdx, displayIdx) => {
            const team = rankings[rankIdx];
            if (!team) return <div key={displayIdx} className="w-32" />;
            
            const height = podiumH[displayIdx];
            const isWinner = rankIdx === 0;
            
            return (
              <motion.div
                key={team.id}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 + displayIdx * 0.2, type: 'spring' }}
                className="text-center"
              >
                <motion.div
                  animate={isWinner ? { y: [0, -10, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="text-4xl mb-2">{team.avatarEmoji}</div>
                  <div className="font-bold text-white text-sm mb-1">{team.name}</div>
                  <div className="text-white/50 text-xs mb-2">{team.score} poin</div>
                </motion.div>
                
                <div
                  className={`rounded-t-2xl flex items-end justify-center pb-4 transition-all ${
                    isWinner
                      ? 'bg-gradient-to-t from-yellow-600 to-yellow-400 w-36'
                      : rankIdx === 1
                        ? 'bg-gradient-to-t from-gray-500 to-gray-400 w-32'
                        : 'bg-gradient-to-t from-orange-700 to-orange-500 w-28'
                  }`}
                  style={{ height }}
                >
                  <div className="text-4xl font-display text-white/90">{rankEmojis[rankIdx]}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Full Rankings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-black/30 backdrop-blur-sm rounded-3xl p-6 border border-white/10 mb-8"
        >
          <h2 className="font-display text-2xl text-white mb-4">📊 Hasil Lengkap</h2>
          <div className="space-y-3">
            {rankings.map((team, i) => (
              <motion.div
                key={team.id}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.4 + i * 0.15 }}
                className="bg-gray-800/60 rounded-2xl p-4 border border-white/5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl font-bold w-8">{rankEmojis[i] || `#${i + 1}`}</div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
                    style={{ backgroundColor: team.color + '33', borderColor: team.color }}
                  >
                    {team.avatarEmoji}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white">{team.name}</div>
                    <div className="text-white/40 text-xs">{team.members.map(m => m.name).join(', ')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-white/40 text-xs">Kotak</div>
                    <div className="text-white font-bold">#{team.position}</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-yellow-400/60 text-xs">Koin</div>
                    <div className="text-yellow-300 font-bold">{team.coins}</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-blue-400/60 text-xs">Skor</div>
                    <div className="text-blue-300 font-bold">{team.score}</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-green-400/60 text-xs">✅ Benar</div>
                    <div className="text-green-300 font-bold">{team.correctAnswers}</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-2">
                    <div className="text-orange-400/60 text-xs">⚔️ Duel</div>
                    <div className="text-orange-300 font-bold">{team.duelWins}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="bg-black/30 backdrop-blur-sm rounded-3xl p-6 border border-white/10 mb-8"
        >
          <h2 className="font-display text-2xl text-white mb-4">🏅 Penghargaan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.map(ach => {
              const team = rankings.find(t => t.id === ach.teamId);
              return (
                <motion.div
                  key={ach.id}
                  whileHover={{ scale: 1.05, y: -3 }}
                  className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 rounded-2xl p-4 border border-yellow-500/20 text-center"
                >
                  <div className="text-3xl mb-2">{ach.emoji}</div>
                  <div className="font-bold text-white text-sm">{ach.name}</div>
                  <div className="text-white/50 text-xs mt-1">{team?.name}</div>
                  <div className="text-white/30 text-xs">{ach.description}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Play again */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="text-center"
        >
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-display text-xl px-10 py-4 rounded-2xl shadow-xl transition-all transform hover:scale-105"
          >
            🎮 Main Lagi!
          </button>
        </motion.div>
      </div>
    </div>
  );
}
