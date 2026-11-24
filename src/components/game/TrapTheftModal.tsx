'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export default function TrapTheftModal() {
  const game = useGameStore(state => state.game);
  const claimTrapCoins = useGameStore(state => state.claimTrapCoins);
  const pending = game?.pendingTrapTheft;
  const team = game?.teams.find(candidate => candidate.id === pending?.teamId);
  const targets = game?.teams.filter(candidate =>
    candidate.id !== pending?.teamId && candidate.coins > 0
  ) ?? [];
  const [error, setError] = useState('');

  if (!pending || !team) return null;

  const handleClaim = (targetTeamId?: string) => {
    if (!claimTrapCoins(targetTeamId)) {
      setError('Koin tidak berhasil diambil. Silakan pilih target lain.');
      return;
    }
    setError('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trap-theft-title"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/85 p-3 backdrop-blur-md sm:p-5"
    >
      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="my-auto w-full max-w-lg rounded-3xl border border-orange-200/30 bg-gradient-to-br from-slate-950 via-red-950 to-orange-950 p-5 text-white shadow-2xl sm:p-7"
      >
        <div className="text-center">
          <div className="mb-2 text-5xl" aria-hidden="true">🕳️🪙</div>
          <h2 id="trap-theft-title" className="text-2xl font-black text-orange-200 sm:text-3xl">
            TERJEBAK!
          </h2>
          <p className="mt-2 text-sm text-white/75">
            {team.avatarEmoji} {team.name}, pilih kelompok lawan untuk mengambil hingga 100 koin.
          </p>
          <p className="mt-1 text-xs text-white/50">
            Jika target memiliki 100 koin atau lebih, pion tidak mundur. Jika kurang dari 100, ambil semua koin yang tersedia dan pion mundur 2 kotak.
          </p>
        </div>

        {targets.length > 0 ? (
          <div className="mt-5 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {targets.map(target => (
              <button
                key={target.id}
                type="button"
                onClick={() => handleClaim(target.id)}
                className="flex items-center gap-3 rounded-xl border border-orange-300/30 bg-white/5 p-3 text-left transition hover:border-orange-200 hover:bg-orange-500/15 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <span className="text-2xl" aria-hidden="true">{target.avatarEmoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{target.name}</span>
                  <span className="text-sm text-amber-200">💰 {target.coins} koin</span>
                </span>
                <span className="shrink-0 rounded-lg bg-orange-500/20 px-2 py-1 text-xs font-bold text-orange-200">
                  Ambil {Math.min(100, target.coins)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-center">
            <p className="text-sm text-white/70">Tidak ada koin lawan yang tersedia untuk dicuri.</p>
            <button
              type="button"
              onClick={() => handleClaim()}
              className="mt-3 rounded-xl bg-orange-600 px-5 py-2.5 font-bold text-white transition hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              Lanjutkan
            </button>
          </div>
        )}

        {error && <p role="alert" className="mt-3 text-center text-sm text-red-200">{error}</p>}
      </motion.section>
    </div>
  );
}
