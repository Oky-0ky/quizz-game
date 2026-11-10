'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { MysteryBoxPrize } from '@/types/game';
import { soundManager } from '@/utils/sound';

const PRIZES: Array<{ id: MysteryBoxPrize; emoji: string; label: string; color: string }> = [
  { id: 'coins_100', emoji: '🪙', label: '+100 Koin', color: '#f59e0b' },
  { id: 'free_item', emoji: '🎁', label: 'Gratis 1 Item', color: '#10b981' },
  { id: 'coins_200', emoji: '💰', label: '+200 Koin', color: '#3b82f6' },
  { id: 'steal', emoji: '🏆', label: 'Curi 100 Koin + 100 Poin', color: '#a855f7' },
];

export default function SpinWheel() {
  const game = useGameStore(state => state.game);
  const revealPrize = useGameStore(state => state.revealMysteryBoxPrize);
  const claimItem = useGameStore(state => state.claimMysteryBoxItem);
  const stealReward = useGameStore(state => state.stealMysteryBoxReward);
  const finish = useGameStore(state => state.finishMysteryBox);
  const [selectionError, setSelectionError] = useState('');
  const pending = game?.pendingMysteryBox;
  const isSpinning = pending?.status === 'spinning';

  const prizeIndex = useMemo(
    () => PRIZES.findIndex(prize => prize.id === pending?.prize),
    [pending?.prize]
  );
  const prize = PRIZES[prizeIndex];
  const spinRotation = prizeIndex < 0 ? 0 : 360 * 5 + 360 - (prizeIndex * 90 + 45);
  const team = game?.teams.find(candidate => candidate.id === pending?.teamId);
  const availableItems = game?.shopItems.filter(item =>
    item.price === 100 && item.isEnabled && item.currentStock > 0
  ) ?? [];
  const opponents = game?.teams.filter(candidate => candidate.id !== pending?.teamId) ?? [];

  useEffect(() => {
    if (!isSpinning) return;

    soundManager.playDice();
    const timer = window.setTimeout(revealPrize, 4600);
    return () => window.clearTimeout(timer);
  }, [isSpinning, revealPrize]);

  if (!pending || !prize || !team) return null;

  const handleClaimItem = (itemId: string) => {
    if (!claimItem(itemId)) {
      setSelectionError('Item tidak tersedia lagi. Silakan pilih item lain.');
      return;
    }
    setSelectionError('');
  };

  const handleSteal = (teamId: string) => {
    if (!stealReward(teamId)) {
      setSelectionError('Hadiah tidak dapat diterapkan. Silakan pilih kelompok lain.');
      return;
    }
    setSelectionError('');
  };

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mystery-box-title"
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/85 p-3 backdrop-blur-md sm:p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.section
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="my-auto w-full max-w-xl rounded-3xl border border-amber-200/30 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 text-white shadow-2xl shadow-purple-950/60 sm:p-7"
        >
          <div className="text-center">
            <div className="mb-1 text-3xl" aria-hidden="true">🎁✨🎡</div>
            <h2 id="mystery-box-title" className="text-2xl font-black tracking-wide text-amber-200 sm:text-3xl">
              KOTAK KEJUTAN
            </h2>
            <p className="mt-1 text-sm text-white/70">
              {team.avatarEmoji} {team.name} memutar Roda Keberuntungan
            </p>
          </div>

          <div className="relative mx-auto my-5 h-56 w-56 sm:h-64 sm:w-64">
            <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 text-3xl drop-shadow-lg" aria-hidden="true">▼</div>
            <motion.div
              aria-label="Roda Keberuntungan"
              className="absolute inset-0 overflow-hidden rounded-full border-[7px] border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.35)]"
              style={{
                background: `conic-gradient(${PRIZES.map((entry, index) =>
                  `${entry.color} ${index * 25}% ${(index + 1) * 25}%`
                ).join(', ')})`,
              }}
              initial={{ rotate: 0 }}
              animate={{ rotate: spinRotation }}
              transition={{ duration: 4.5, ease: [0.12, 0.8, 0.2, 1] }}
            >
              {PRIZES.map((entry, index) => {
                const positions = [
                  'left-[68%] top-[23%]',
                  'left-[68%] top-[68%]',
                  'left-[23%] top-[68%]',
                  'left-[23%] top-[23%]',
                ];
                return (
                  <div
                    key={entry.id}
                    className={`absolute z-10 flex w-[34%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center drop-shadow-md ${positions[index]}`}
                  >
                    <span className="text-2xl sm:text-3xl" aria-hidden="true">{entry.emoji}</span>
                    <span className="text-[9px] font-black leading-tight text-white sm:text-[10px]">{entry.label}</span>
                  </div>
                );
              })}
            </motion.div>
            <div className="absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-amber-100 bg-amber-400 text-2xl shadow-lg sm:h-16 sm:w-16">
              🎡
            </div>
          </div>

          {pending.status === 'spinning' && (
            <p className="animate-pulse text-center font-semibold text-amber-100" aria-live="polite">
              Roda sedang berputar... hadiah dipilih secara acak!
            </p>
          )}

          {pending.status === 'choosing_item' && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-xl font-black text-amber-200">🎁 Kamu mendapat 1 item gratis!</p>
                <p className="mt-1 text-sm text-white/70">Pilih satu item dengan harga tepat 100 koin.</p>
              </div>
              {availableItems.length > 0 ? (
                <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                  {availableItems.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleClaimItem(item.id)}
                      className="flex items-center gap-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{item.name}</span>
                        <span className="text-xs text-emerald-200">100 koin · Gratis</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-white/10 p-3 text-center text-sm text-white/80">
                  Tidak ada item seharga 100 koin yang tersedia di toko saat ini.
                </p>
              )}
              {selectionError && <p className="text-center text-sm text-rose-300" role="alert">{selectionError}</p>}
            </div>
          )}

          {pending.status === 'choosing_target' && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-xl font-black text-amber-200">🏆 Pilih kelompok lawan!</p>
                <p className="mt-1 text-sm text-white/70">Ambil hingga 100 koin dan 100 poin dari satu kelompok.</p>
              </div>
              <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {opponents.map(opponent => (
                  <button
                    key={opponent.id}
                    type="button"
                    onClick={() => handleSteal(opponent.id)}
                    className="flex items-center gap-3 rounded-xl border border-purple-300/30 bg-purple-500/10 p-3 text-left transition hover:border-purple-200 hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  >
                    <span className="text-2xl">{opponent.avatarEmoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{opponent.name}</span>
                      <span className="text-xs text-white/70">💰 {opponent.coins} · ⭐ {opponent.score} poin</span>
                    </span>
                  </button>
                ))}
              </div>
              {selectionError && <p className="text-center text-sm text-rose-300" role="alert">{selectionError}</p>}
            </div>
          )}

          {pending.status === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-2 text-center"
            >
              <p className="text-5xl" aria-hidden="true">{prize.emoji}</p>
              <p className="mt-2 text-2xl font-black text-amber-200 sm:text-3xl">HADIAH DIDAPAT!</p>
              <p className="mt-2 text-lg font-bold" aria-live="polite">{pending.resultMessage}</p>
              <button
                type="button"
                onClick={finish}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 font-black text-slate-950 shadow-lg transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Lanjutkan
              </button>
            </motion.div>
          )}
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
