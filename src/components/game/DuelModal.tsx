'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export default function DuelModal() {
  const game = useGameStore(s => s.game);
  const submitDuelAnswer = useGameStore(s => s.submitDuelAnswer);
  const endTurn = useGameStore(s => s.endTurn);
  const startDuel = useGameStore(s => s.startDuel);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [timeLeft] = useState(30);

  if (!game) return null;

  const duel = game.activeDuel;
  const currentTeam = game.teams[game.currentTeamIndex];
  const otherTeams = game.teams.filter(t => t.id !== currentTeam.id);

  // Start duel phase: select opponent
  if (!duel && game.phase === 'duel') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900 rounded-3xl p-6 w-full max-w-md border border-orange-500/30 shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">⚔️</div>
            <h2 className="font-display text-2xl text-white">Pilih Lawan Duel!</h2>
            <p className="text-white/60 text-sm mt-1">{currentTeam.name} siap untuk bertarung!</p>
          </div>

          <div className="space-y-3 mb-6">
            {otherTeams.map(team => (
              <motion.button
                key={team.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTeamId(t => t === team.id ? null : team.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  selectedTeamId === team.id
                    ? 'bg-orange-600/30 border-orange-500'
                    : 'bg-gray-800 border-gray-700 hover:border-orange-500/50'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
                  style={{ backgroundColor: team.color + '33', borderColor: team.color }}
                >
                  {team.avatarEmoji}
                </div>
                <div className="text-left">
                  <div className="font-bold text-white">{team.name}</div>
                  <div className="text-white/50 text-sm">Kotak #{team.position} · {team.coins} koin</div>
                </div>
                {selectedTeamId === team.id && <div className="ml-auto text-orange-400 text-xl">⚔️</div>}
              </motion.button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={endTurn}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-2xl font-semibold transition-colors"
            >
              Lewati
            </button>
            <button
              onClick={() => {
                if (selectedTeamId) {
                  startDuel(currentTeam.id, selectedTeamId, {
                    winnerCoins: 15,
                    loserPenalty: 'move_back',
                    loserPenaltyValue: 2,
                    swapPositions: false,
                  });
                }
              }}
              disabled={!selectedTeamId}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 text-white py-3 rounded-2xl font-bold transition-all"
            >
              ⚔️ Duel!
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!duel) return null;

  const challenger = game.teams.find(t => t.id === duel.challengerTeamId);
  const defender = game.teams.find(t => t.id === duel.defendingTeamId);
  const question = duel.question;

  if (duel.phase === 'resolved') {
    const winner = duel.winnerId ? game.teams.find(t => t.id === duel.winnerId) : null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm border border-white/20 text-center shadow-2xl"
        >
          <div className="text-6xl mb-4">{winner ? '🏆' : '🤝'}</div>
          <h2 className="font-display text-2xl text-white mb-2">
            {winner ? `${winner.name} Menang!` : 'Duel Seri!'}
          </h2>
          {winner && (
            <div className="text-yellow-400 font-bold">+{duel.stakes.winnerCoins} koin</div>
          )}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-white/60">
              <span>{challenger?.name}</span>
              <span className={duel.challengerCorrect ? 'text-green-400' : 'text-red-400'}>
                {duel.challengerCorrect ? '✅ Benar' : '❌ Salah'}
              </span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>{defender?.name}</span>
              <span className={duel.defenderCorrect ? 'text-green-400' : 'text-red-400'}>
                {duel.defenderCorrect ? '✅ Benar' : '❌ Salah'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const isChallenger = duel.phase === 'challenger_answering';
  const activeTeam = isChallenger ? challenger : defender;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-3xl p-6 w-full max-w-lg border border-orange-500/30 shadow-2xl"
      >
        {/* Duel header */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <div className="text-center">
            <div className="text-3xl mb-1">{challenger?.avatarEmoji}</div>
            <div className="text-white text-sm font-bold">{challenger?.name}</div>
            {duel.challengerAnswer !== undefined && (
              <div className={`text-xs font-bold ${duel.challengerCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {duel.challengerCorrect ? '✅' : '❌'}
              </div>
            )}
          </div>
          <div className="text-3xl font-display text-orange-400">⚔️ VS ⚔️</div>
          <div className="text-center">
            <div className="text-3xl mb-1">{defender?.avatarEmoji}</div>
            <div className="text-white text-sm font-bold">{defender?.name}</div>
          </div>
        </div>

        <div className="text-center text-white/60 text-sm mb-4">
          Giliran: <span className="font-bold text-orange-400">{activeTeam?.name}</span>
        </div>

        {/* Question */}
        {question && (
          <div className="bg-gray-800 rounded-2xl p-4 mb-5">
            <p className="text-white font-semibold">{question.text}</p>
          </div>
        )}

        {/* Answer */}
        {question && (
          <div className="space-y-3">
            {question.options ? (
              question.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => submitDuelAnswer(activeTeam!.id, opt, timeLeft)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-orange-400 text-white font-semibold transition-all"
                >
                  <span className="text-orange-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))
            ) : (
              <div className="flex gap-2">
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Ketik jawaban..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-400"
                />
                <button
                  onClick={() => { submitDuelAnswer(activeTeam!.id, answer, timeLeft); setAnswer(''); }}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-4 rounded-xl font-bold transition-colors"
                >
                  ✓
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 text-center text-white/40 text-xs">
          Stakes: Pemenang +{duel.stakes.winnerCoins} koin · Kalah mundur {duel.stakes.loserPenaltyValue} kotak
        </div>
      </motion.div>
    </div>
  );
}
