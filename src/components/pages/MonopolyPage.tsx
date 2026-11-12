'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  MonopolyItemId,
  MonopolyRules,
  MonopolyTeam,
  monopolyBuildingName,
  useMonopolyStore,
} from '@/store/monopolyStore';
import { getMonopolyGridPosition } from '@/data/monopolyBoard';

const ITEM_DETAILS: Record<MonopolyItemId, { name: string; emoji: string }> = {
  jail_card: { name: 'Kartu Bebas Penjara', emoji: '🗝️' },
  rent_shield: { name: 'Perisai Sewa', emoji: '🛡️' },
  takeover_card: { name: 'Kartu Pengambilalihan', emoji: '⚔️' },
  bonus_coin: { name: 'Koin Bonus', emoji: '🪙' },
};

const ADMIN_RULE_FIELDS: Array<{ key: keyof MonopolyRules; label: string }> = [
  { key: 'startingCash', label: 'Modal awal' },
  { key: 'goSalary', label: 'Gaji GO' },
  { key: 'bailCost', label: 'Biaya bebas penjara' },
  { key: 'correctAnswerReward', label: 'Hadiah jawaban benar' },
  { key: 'wrongAnswerPenalty', label: 'Hukuman jawaban salah' },
  { key: 'incomeTax', label: 'Income Tax' },
  { key: 'superTax', label: 'Super Tax' },
  { key: 'chanceReward', label: 'Hadiah Chance' },
  { key: 'chanceFine', label: 'Denda Chance' },
  { key: 'communityReward', label: 'Hadiah Community Chest' },
  { key: 'communityFine', label: 'Denda Community Chest' },
  { key: 'diceWeight1', label: 'Bobot dadu angka 1' },
  { key: 'diceWeight2', label: 'Bobot dadu angka 2' },
  { key: 'diceWeight3', label: 'Bobot dadu angka 3' },
  { key: 'diceWeight4', label: 'Bobot dadu angka 4' },
  { key: 'diceWeight5', label: 'Bobot dadu angka 5' },
  { key: 'diceWeight6', label: 'Bobot dadu angka 6' },
];

const formatDuration = (seconds: number | null) => {
  if (seconds === null) return '';
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

function wealth(team: MonopolyTeam, game: NonNullable<ReturnType<typeof useMonopolyStore.getState>['game']>) {
  return team.coins + team.properties.reduce((total, tileId) => {
    const tile = game.board[tileId];
    const property = game.properties[tileId];
    const buildingValue = (tile.developmentCost ?? 0) * (property?.buildingLevel ?? 0);
    return total + (tile.price ?? 0) + buildingValue;
  }, 0);
}

export default function MonopolyPage() {
  const game = useMonopolyStore(state => state.game);
  const rollDice = useMonopolyStore(state => state.rollDice);
  const payBail = useMonopolyStore(state => state.payBail);
  const advanceMovement = useMonopolyStore(state => state.advanceMovement);
  const answerQuestion = useMonopolyStore(state => state.answerQuestion);
  const buyProperty = useMonopolyStore(state => state.buyProperty);
  const declinePurchase = useMonopolyStore(state => state.declinePurchase);
  const completeAction = useMonopolyStore(state => state.completeAction);
  const dismissCard = useMonopolyStore(state => state.dismissCard);
  const upgradeProperty = useMonopolyStore(state => state.upgradeProperty);
  const useJailCard = useMonopolyStore(state => state.useJailCard);
  const startJailQuestion = useMonopolyStore(state => state.startJailQuestion);
  const useRentShield = useMonopolyStore(state => state.useRentShield);
  const useBonusCoin = useMonopolyStore(state => state.useBonusCoin);
  const useTakeoverCard = useMonopolyStore(state => state.useTakeoverCard);
  const takeoverProperty = useMonopolyStore(state => state.takeoverProperty);
  const finishTurn = useMonopolyStore(state => state.finishTurn);
  const tickTime = useMonopolyStore(state => state.tickTime);
  const clearGame = useMonopolyStore(state => state.clearGame);
  const adminBoard = useMonopolyStore(state => state.board);
  const adminRules = useMonopolyStore(state => state.rules);
  const swapBoardTiles = useMonopolyStore(state => state.swapBoardTiles);
  const resetBoard = useMonopolyStore(state => state.resetBoard);
  const updateRules = useMonopolyStore(state => state.updateRules);
  const updateTileEconomy = useMonopolyStore(state => state.updateTileEconomy);
  const setPhase = useGameStore(state => state.setPhase);
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminSourceId, setAdminSourceId] = useState<number | null>(null);
  const [adminTargetId, setAdminTargetId] = useState(1);
  const [adminEconomyTileId, setAdminEconomyTileId] = useState<number | null>(null);
  const [adminPrice, setAdminPrice] = useState<string | null>(null);
  const [adminRent, setAdminRent] = useState<string | null>(null);
  const [adminDevelopmentCost, setAdminDevelopmentCost] = useState<string | null>(null);
  const gameStatus = game?.status;
  const gameDurationType = game?.duration.type;
  const gameStage = game?.stage;
  const movementRemaining = game?.movementRemaining;

  useEffect(() => {
    if (gameStatus !== 'playing' || gameDurationType !== 'time') return;
    const timer = window.setInterval(tickTime, 1000);
    return () => window.clearInterval(timer);
  }, [gameStatus, gameDurationType, tickTime]);

  useEffect(() => {
    if (gameStage !== 'moving') return;
    const timer = window.setTimeout(advanceMovement, 300);
    return () => window.clearTimeout(timer);
  }, [gameStage, movementRemaining, advanceMovement]);

  const currentTeamId = game?.order[game.currentIndex];
  const currentTeam = game?.teams.find(team => team.id === currentTeamId);
  const rolling = game?.stage === 'moving';
  const sortedTeams = useMemo(() => game ? [...game.teams].sort((a, b) => {
    if (game.winnerId === a.id) return -1;
    if (game.winnerId === b.id) return 1;
    return wealth(b, game) - wealth(a, game) || b.quizCorrect - a.quizCorrect;
  }) : [], [game]);
  const selectedTile = selectedTileId === null ? null : game?.board[selectedTileId] ?? null;
  const adminSourceTileId = adminSourceId ?? adminBoard.find(tile => tile.type === 'jail')?.id ?? 1;
  const configurableTiles = adminBoard.filter(tile => (
    tile.type === 'property' || tile.type === 'rail' || tile.type === 'air' ||
    tile.type === 'cruise' || tile.type === 'space' || tile.type === 'utility'
  ));
  const selectedAdminEconomyTileId = adminEconomyTileId ?? configurableTiles[0]?.id ?? 1;
  const selectedAdminEconomyTile = adminBoard[selectedAdminEconomyTileId];

  if (!game) return null;

  const leaveGame = () => {
    clearGame();
    setPhase('lobby');
  };

  const itemCount = (itemId: MonopolyItemId) => currentTeam?.inventory[itemId] ?? 0;
  const property = game.pendingTileId === null ? undefined : game.properties[game.pendingTileId];
  const pendingTile = game.pendingTileId === null ? undefined : game.board[game.pendingTileId];
  const buyCost = pendingTile?.price ?? 0;
  const takeoverCost = buyCost * 2;
  const upgradeCost = pendingTile?.developmentCost ?? 0;
  const developmentGroup = pendingTile?.groupId
    ? game.board.filter(tile => tile.type === 'property' && tile.groupId === pendingTile.groupId)
    : [];
  const canDevelop = Boolean(
    property &&
    pendingTile?.type === 'property' &&
    developmentGroup.length > 0 &&
    developmentGroup.every(tile => game.properties[tile.id]?.ownerId === currentTeam?.id) &&
    property.buildingLevel === Math.min(...developmentGroup.map(tile => game.properties[tile.id]?.buildingLevel ?? 0)),
  );

  if (game.status === 'finished') {
    const champion = game.teams.find(team => team.id === game.winnerId);
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 text-white">
        <div className="mx-auto max-w-3xl py-8">
          <section className="rounded-3xl border border-white/15 bg-white/10 p-6 text-center shadow-2xl backdrop-blur md:p-10">
            <div className="mb-3 text-6xl">👑</div>
            <h1 className="font-display text-3xl md:text-5xl">Kerajaan Dikuasai!</h1>
            <p className="mt-3 text-xl text-amber-200">{champion?.avatar} {champion?.name} menjadi juara!</p>
            <p className="mt-1 text-white/60">Peringkat berdasarkan saldo dan nilai properti; skor kuis menjadi pemecah nilai seri.</p>
            <div className="mt-7 space-y-3 text-left">
              {sortedTeams.map((team, index) => (
                <div key={team.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <span className="w-8 text-center text-xl font-black text-amber-300">#{index + 1}</span>
                  <span className="text-2xl">{team.avatar}</span>
                  <span className="min-w-0 flex-1 truncate font-bold">{team.name}</span>
                  <span className="text-right">
                    <span className="block font-black text-yellow-200">{wealth(team, game)} total</span>
                    <span className="text-xs text-white/60">{team.coins} tunai · {team.properties.length} properti · {team.quizCorrect} benar</span>
                  </span>
                </div>
              ))}
            </div>
            <button onClick={leaveGame} className="mt-7 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3 font-black shadow-lg transition hover:scale-105">
              KEMBALI KE PILIHAN MODE
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,#193b42_0%,#101a32_48%,#100d25_100%)] p-3 text-white md:p-6">
      <header className="mx-auto mb-4 flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-400/15 p-3 text-3xl">🎲</div>
          <div>
            <h1 className="font-display text-xl text-amber-200 md:text-3xl">MONOPOLY WORLD QUIZ</h1>
            <p className="text-xs text-white/60 md:text-sm">40 petak kota dunia · jawab kuis, lempar dua dadu, dan kuasai properti!</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsAdminOpen(true)} className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-400/20 md:px-4 md:text-sm">
            ⚙️ Admin
          </button>
          <button onClick={leaveGame} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 md:px-4 md:text-sm">
            ← Keluar
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="relative mx-auto aspect-square w-full max-w-[780px] overflow-hidden rounded-[1.7rem] border-[6px] border-amber-950/70 bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 p-1 shadow-[0_24px_70px_rgba(0,0,0,.4)] sm:rounded-[2.4rem] sm:border-[10px] sm:p-2">
          <div className="grid h-full w-full grid-cols-11 grid-rows-11 gap-0">
            {game.board.map(tile => {
              const { row, column } = getMonopolyGridPosition(tile.id);
              const owned = game.properties[tile.id];
              const owner = owned ? game.teams.find(team => team.id === owned.ownerId) : undefined;
              const tokens = game.teams.filter(team => team.position === tile.id);
              const isSelected = selectedTileId === tile.id;
              const corner = [0, 10, 20, 30].includes(tile.id);
              const squareLabel = tile.type === 'go' ? 'GO' : `kotak ${tile.id}`;
              return (
                <button
                  key={tile.id}
                  onClick={() => setSelectedTileId(tile.id)}
                  style={{
                    gridRow: row,
                    gridColumn: column,
                    borderColor: owner?.color ?? tile.groupColor ?? undefined,
                    boxShadow: owner ? `inset 0 0 0 2px ${owner.color}` : undefined,
                  }}
                  className={`relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-lg border p-0.5 text-center transition-all hover:z-10 hover:scale-[1.04] sm:rounded-xl sm:p-1 ${
                    isSelected ? 'z-10 ring-2 ring-yellow-300 ring-offset-1 ring-offset-emerald-950' : ''
                  } ${corner ? 'bg-amber-100 text-slate-900' : 'bg-slate-50 text-slate-800'}`}
                  aria-label={`${tile.name}, ${squareLabel}`}
                >
                  {tile.groupColor && <span className="absolute inset-x-0 top-0 h-1 sm:h-2" style={{ backgroundColor: owner?.color ?? tile.groupColor }} />}
                  <span className={`leading-none ${corner ? 'text-sm sm:text-2xl' : 'text-xs sm:text-lg'}`}>{tile.icon}</span>
                  <span className={`mt-0.5 line-clamp-2 w-full break-words font-extrabold leading-tight ${corner ? 'text-[6px] sm:text-[10px]' : 'text-[5px] sm:text-[9px]'}`}>
                    {tile.name}
                  </span>
                  {tile.price !== undefined && <span className="hidden text-[8px] font-bold text-emerald-800 sm:block">{tile.price} 🪙</span>}
                  {owned && <span className="text-[5px] font-black sm:text-[8px]">{monopolyBuildingName(owned.buildingLevel)}</span>}
                  {!!tokens.length && (
                    <span className="absolute bottom-0 right-0 flex -space-x-1 sm:bottom-0.5 sm:right-0.5">
                      {tokens.map(token => (
                        <span key={token.id} className="flex h-3 w-3 items-center justify-center rounded-full border border-white text-[7px] shadow sm:h-5 sm:w-5 sm:text-[10px]" style={{ backgroundColor: token.color }}>
                          {token.avatar}
                        </span>
                      ))}
                    </span>
                  )}
                  <span className="absolute left-0.5 top-0.5 text-[5px] font-black opacity-50 sm:text-[8px]">
                    {tile.type === 'go' ? 'GO' : tile.id}
                  </span>
                </button>
              );
            })}
            <div className="col-start-2 col-end-11 row-start-2 row-end-11 flex min-h-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-800/80 to-slate-900/80 p-2 text-center shadow-inner sm:rounded-[2rem] sm:p-6">
              <motion.div
                animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-4xl sm:text-7xl"
              >
                🏰
              </motion.div>
              <h2 className="mt-1 font-display text-[10px] leading-tight text-amber-100 sm:mt-3 sm:text-3xl">KERAJAAN PETUALANG</h2>
              <p className="mt-1 hidden max-w-xs text-xs text-white/60 sm:block">Jawab kuis dengan benar untuk melempar dadu, lalu bangun wilayah dan capai FINISH!</p>
              <div className="mt-2 flex flex-wrap justify-center gap-1 sm:mt-4 sm:gap-2">
                {game.teams.map(team => (
                  <span key={team.id} className={`rounded-full border px-2 py-1 text-[7px] font-bold sm:text-xs ${team.id === currentTeamId ? 'border-amber-200 bg-amber-400/20 text-amber-100' : 'border-white/10 bg-white/5 text-white/70'}`}>
                    {team.avatar} {team.name}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-[8px] text-white/50 sm:mt-4 sm:text-sm">
                {game.duration.type === 'rounds'
                  ? `Putaran ${Math.min(game.completedRounds + 1, game.duration.value)} / ${game.duration.value}`
                  : `Waktu ${formatDuration(game.timeRemaining)}`}
              </div>
            </div>
          </div>
        </section>

        <aside className="flex min-h-[420px] flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-xl backdrop-blur sm:p-5">
          {currentTeam && (
            <>
              <div className="rounded-2xl border border-amber-300/25 bg-gradient-to-r from-amber-400/15 to-orange-400/10 p-4">
                <div className="text-xs font-black uppercase tracking-[.18em] text-amber-200/70">Giliran Kelompok</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-3xl">{currentTeam.avatar}</span>
                  <span className="min-w-0 flex-1 truncate text-lg font-black">{currentTeam.name}</span>
                  <span className="rounded-full bg-black/20 px-3 py-1 font-black text-yellow-200">{currentTeam.coins} 🪙</span>
                </div>
                {currentTeam.jailed && <p className="mt-2 text-xs font-bold text-rose-200">🔒 Dipenjara — bebaskan diri untuk bergerak.</p>}
                <p className="mt-1 text-xs text-white/60">Wilayah dimiliki: {currentTeam.properties.length} · Kekayaan: {wealth(currentTeam, game)} 🪙</p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                {[game.diceResult, game.bonusDiceResult].map((die, index) => (
                  <motion.div
                    key={`${index}-${die}-${game.hasRolled}`}
                    animate={rolling ? { rotate: [0, 100, 220, 360], scale: [1, 1.15, 1] } : { rotate: 0 }}
                    transition={{ duration: 0.55 }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl font-black text-slate-900 shadow-lg sm:h-14 sm:w-14 sm:text-3xl"
                  >
                    {die ?? '🎲'}
                  </motion.div>
                ))}
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{game.stage === 'moving' ? 'Pion sedang berjalan...' : game.diceTotal ? `Total dadu: ${game.diceTotal}` : 'Dua dadu siap dilempar'}</div>
                  <div className="text-xs text-white/50">{game.stage === 'moving' ? `${game.movementRemaining} langkah tersisa` : game.extraTurn ? 'Angka kembar — dapat giliran tambahan.' : 'Jawab kuis dengan benar untuk membuka lemparan.'}</div>
                </div>
              </div>

              {game.stage === 'ready' && currentTeam.jailed && (
                <div className="grid grid-cols-2 gap-2">
                  <button disabled={!itemCount('jail_card')} onClick={useJailCard} className="rounded-xl bg-indigo-500/80 px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40">🗝️ Pakai Kartu ({itemCount('jail_card')})</button>
                  <button disabled={currentTeam.coins < game.rules.bailCost} onClick={payBail} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40">💰 Bayar {game.rules.bailCost} koin</button>
                  <button onClick={rollDice} className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-black transition hover:bg-sky-500">🎲 Cari angka kembar</button>
                  <button onClick={startJailQuestion} className="rounded-xl bg-fuchsia-600 px-3 py-2 text-xs font-black transition hover:bg-fuchsia-500">❓ Jawab kuis</button>
                </div>
              )}
              {game.stage === 'ready' && !currentTeam.jailed && (
                <button onClick={rollDice} className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-display text-base text-slate-950 shadow-lg transition hover:brightness-110">
                  🎲 LEMPAR DUA DADU{game.consecutiveDoubles > 0 ? ` · KEMBAR ${game.consecutiveDoubles}/3` : ''}
                </button>
              )}

              {game.activeQuestion && (
                <section className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-fuchsia-400/20 px-2 py-1 text-[10px] font-black uppercase text-fuchsia-100">
                      {game.pendingTileId !== null ? `Kotak ${game.pendingTileId} · ${game.board[game.pendingTileId].name}` : game.activeQuestion.category}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-white/50">{game.activeQuestion.difficulty === 'easy' ? 'Mudah' : game.activeQuestion.difficulty === 'medium' ? 'Sedang' : 'Sulit'}</span>
                  </div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-fuchsia-100/60">
                    {game.questionPurpose === 'turn'
                      ? 'Jawab benar untuk mendapat lemparan dadu'
                      : game.questionPurpose === 'jail'
                        ? 'Jawab benar untuk bebas dan melempar dadu'
                        : game.questionPurpose === 'rent'
                          ? 'Jawab soal sulit untuk diskon sewa 50%'
                          : `${game.activeQuestion.category} · soal petak`}
                  </p>
                  <p className="mb-3 text-sm font-bold leading-snug">{game.activeQuestion.question}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {game.activeQuestion.options.map(option => (
                      <button key={option} onClick={() => answerQuestion(option)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-semibold transition hover:border-fuchsia-300/50 hover:bg-fuchsia-400/15">
                        {option}
                      </button>
                    ))}
                  </div>
                  {game.questionPurpose === 'rent' && (
                    <button onClick={() => answerQuestion('')} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-[11px] font-semibold text-white/60 transition hover:bg-white/10">
                      Lewati kuis — bayar sewa penuh {game.pendingRent} koin
                    </button>
                  )}
                  {game.questionPurpose === 'turn' && (
                    <button
                      disabled={!itemCount('bonus_coin')}
                      onClick={useBonusCoin}
                      className="mt-2 w-full rounded-xl border border-yellow-300/20 bg-yellow-500/15 px-2 py-2 text-[11px] font-bold disabled:opacity-40"
                    >
                      🪙 Bonus Koin ({itemCount('bonus_coin')})
                    </button>
                  )}
                </section>
              )}

              {game.lastAnswer && (
                <div className={`rounded-xl p-3 text-sm font-bold ${game.lastAnswer.correct ? 'bg-emerald-400/15 text-emerald-200' : 'bg-rose-400/15 text-rose-200'}`}>
                  {game.lastAnswer.correct ? '✅ ' : '💡 '}{game.lastAnswer.message}
                </div>
              )}

              {game.pendingBuy && pendingTile && (
                <section className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4">
                  <h3 className="font-black text-amber-100">Beli {pendingTile.name}?</h3>
                  <p className="mt-1 text-xs text-white/65">Harga {buyCost} koin · sewa awal {pendingTile.rent} koin</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button disabled={currentTeam.coins < buyCost} onClick={buyProperty} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black disabled:opacity-40">Beli wilayah</button>
                    <button onClick={declinePurchase} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Lewati</button>
                  </div>
                </section>
              )}

              {game.questionPurpose === 'rent' && (
                <section className="grid grid-cols-2 gap-2">
                  <button disabled={!itemCount('rent_shield')} onClick={useRentShield} className="rounded-xl bg-sky-600/80 px-2 py-2 text-[10px] font-black disabled:opacity-40">🛡️ Batalkan sewa ({itemCount('rent_shield')})</button>
                  <button disabled={!itemCount('takeover_card')} onClick={useTakeoverCard} className="rounded-xl bg-rose-600/80 px-2 py-2 text-[10px] font-black disabled:opacity-40">⚔️ Tantang ambil alih ({itemCount('takeover_card')})</button>
                </section>
              )}

              {game.stage === 'action' && !game.activeQuestion && game.pendingTakeoverOwner && property && pendingTile && property.ownerId !== currentTeam.id && (
                property.buildingLevel >= 5 ? (
                  <p className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-xs font-bold text-amber-100">
                    🏰 {pendingTile.name} sudah menjadi Landmark dan tidak dapat diambil alih.
                  </p>
                ) : (
                  <section className="rounded-2xl border border-rose-300/25 bg-rose-400/10 p-3">
                    <h3 className="text-sm font-black text-rose-100">Ambil alih {pendingTile.name}?</h3>
                    <p className="mt-1 text-xs text-white/65">Bayar 2x harga properti ({takeoverCost} koin) kepada pemilik saat ini.</p>
                    <button disabled={currentTeam.coins < takeoverCost} onClick={takeoverProperty} className="mt-3 w-full rounded-xl bg-rose-500 px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40">
                      ⚔️ Takeover · {takeoverCost} koin
                    </button>
                  </section>
                )
              )}

              {canDevelop && property && game.stage === 'action' && property.buildingLevel < 5 && (
                <button disabled={currentTeam.coins < upgradeCost} onClick={upgradeProperty} className="rounded-xl border border-amber-200/20 bg-amber-400/15 px-3 py-2 text-xs font-black text-amber-100 disabled:opacity-40">
                  🏗️ Bangun {monopolyBuildingName(property.buildingLevel + 1)} · {upgradeCost} koin
                </button>
              )}
              {game.stage === 'action' && !game.activeQuestion && !game.pendingBuy && !game.pendingCard && (
                <button onClick={completeAction} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/15">
                  Selesaikan aksi kotak
                </button>
              )}

              {game.stage === 'done' && (
                <button onClick={finishTurn} className="rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 py-3 font-display text-base shadow-lg transition hover:scale-[1.02]">
                  LANJUTKAN GILIRAN →
                </button>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            {game.teams.map(team => (
              <div key={team.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                  <span className="truncate text-[10px] font-bold">{team.avatar} {team.name}</span>
                </div>
                <div className="mt-1 text-[10px] text-white/60">{team.coins} 🪙 · {team.properties.length} properti · {team.quizCorrect}✅/{team.quizIncorrect}❌ · posisi {team.position}{team.jailed ? ' · 🔒' : ''}</div>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/70">Inventaris Monopoli</h3>
              <span className="text-[10px] text-white/40">Mode terpisah</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {Object.entries(ITEM_DETAILS).map(([id, item]) => (
                <div key={id} className="flex items-center gap-1.5 text-[10px] text-white/70">
                  <span>{item.emoji}</span><span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <b className="text-amber-200">{currentTeam?.inventory[id as MonopolyItemId] ?? 0}</b>
                </div>
              ))}
            </div>
          </section>

          {selectedTile && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedTile.icon}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-black">{selectedTile.name}</h3>
                  <p className="text-[10px] text-white/50">
                    {selectedTile.type === 'go' ? 'GO' : `Kotak ${selectedTile.id}`} · {selectedTile.country ? `${selectedTile.country} · ` : ''}{selectedTile.type}
                  </p>
                </div>
                <button onClick={() => setSelectedTileId(null)} className="text-white/40 hover:text-white" aria-label="Tutup detail">✕</button>
              </div>
              {selectedTile.price !== undefined && (
                <div className="mt-2 text-xs text-white/70">
                  {selectedTile.price} 🪙 · sewa {selectedTile.rentSchedule?.[0] ?? selectedTile.rent ?? 'sesuai aturan'} 🪙
                  {selectedTile.groupId && <span> · kelompok {selectedTile.groupId}</span>}
                  {game.properties[selectedTile.id] && <span> · pemilik {game.teams.find(team => team.id === game.properties[selectedTile.id].ownerId)?.name}, {monopolyBuildingName(game.properties[selectedTile.id].buildingLevel)}{game.properties[selectedTile.id].buildingLevel === 5 ? ' (Landmark)' : ''}</span>}
                </div>
              )}
            </section>
          )}

          <section className="min-h-24 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3">
            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-white/70">Riwayat permainan</h3>
            <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
              {game.log.length === 0 && <p className="text-[11px] text-white/40">Riwayat aksi akan tampil di sini.</p>}
              {game.log.map(entry => (
                <p key={entry.id} className="text-[10px] leading-relaxed text-white/60">
                  <span className="font-bold text-white/85">{game.teams.find(team => team.id === entry.teamId)?.name}:</span> {entry.message}
                </p>
              ))}
            </div>
          </section>
        </aside>
      </div>
      {game.pendingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <motion.section
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-3xl border border-amber-200/30 bg-slate-900 p-6 text-center shadow-2xl"
          >
            <div className="text-5xl">{game.pendingCard.type === 'chance' ? '❔' : '🏦'}</div>
            <h2 className="mt-3 font-display text-2xl text-amber-100">
              {game.pendingCard.type === 'chance' ? 'Kartu Kesempatan' : 'Dana Umum'}
            </h2>
            <p className="mt-2 text-sm text-white/75">{game.pendingCard.message}</p>
            <button onClick={dismissCard} className="mt-5 w-full rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 transition hover:bg-amber-300">
              Lanjutkan
            </button>
          </motion.section>
        </div>
      )}
      {isAdminOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
          <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-amber-200/20 bg-slate-950 p-4 shadow-2xl sm:p-6">
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-amber-100 sm:text-2xl">⚙️ Panel Admin Monopoli</h2>
                <p className="mt-1 text-xs text-white/60">Perubahan disimpan untuk permainan berikutnya; pertandingan yang sedang berjalan tidak diubah.</p>
              </div>
              <button onClick={() => setIsAdminOpen(false)} className="rounded-lg px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Tutup panel admin">✕</button>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <h3 className="mb-2 text-sm font-black text-white">Atur letak petak</h3>
                <p className="mb-3 text-[11px] text-white/50">Tukar posisi fitur, misalnya memindahkan Penjara ke kotak lain. GO tetap di kotak 0.</p>
                <label className="mb-2 block text-xs font-bold text-white/70">
                  Fitur yang dipindahkan
                  <select value={adminSourceTileId} onChange={event => setAdminSourceId(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-white">
                    {adminBoard.filter(tile => tile.id > 0).map(tile => <option key={tile.id} value={tile.id}>{tile.id}. {tile.name}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-bold text-white/70">
                  Tukar dengan kotak
                  <select value={adminTargetId} onChange={event => setAdminTargetId(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-white">
                    {adminBoard.filter(tile => tile.id > 0).map(tile => <option key={tile.id} value={tile.id}>{tile.id}. {tile.name}</option>)}
                  </select>
                </label>
                <div className="mt-3 flex gap-2">
                  <button disabled={adminSourceTileId === adminTargetId} onClick={() => {
                    swapBoardTiles(adminSourceTileId, adminTargetId);
                    setAdminSourceId(adminTargetId);
                  }} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black disabled:opacity-40">Tukar posisi</button>
                  <button onClick={() => {
                    resetBoard();
                    setAdminSourceId(null);
                    setAdminTargetId(1);
                  }} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold">Reset papan</button>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <h3 className="mb-2 text-sm font-black text-white">Atur ekonomi petak</h3>
                <label className="block text-xs font-bold text-white/70">
                  Properti / transportasi
                  <select value={selectedAdminEconomyTileId} onChange={event => {
                    setAdminEconomyTileId(Number(event.target.value));
                    setAdminPrice(null);
                    setAdminRent(null);
                    setAdminDevelopmentCost(null);
                  }} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-white">
                    {configurableTiles.map(tile => <option key={tile.id} value={tile.id}>{tile.id}. {tile.name}</option>)}
                  </select>
                </label>
                {selectedAdminEconomyTile && (
                  <>
                    <label className="mt-2 block text-xs font-bold text-white/70">
                      Harga beli
                      <input type="number" min="0" value={adminPrice ?? String(selectedAdminEconomyTile.price ?? 0)} onChange={event => setAdminPrice(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-white" />
                    </label>
                    {selectedAdminEconomyTile.type !== 'utility' && (
                      <label className="mt-2 block text-xs font-bold text-white/70">
                        Sewa awal
                        <input type="number" min="0" value={adminRent ?? String(selectedAdminEconomyTile.rentSchedule?.[0] ?? selectedAdminEconomyTile.rent ?? 0)} onChange={event => setAdminRent(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-white" />
                      </label>
                    )}
                    {selectedAdminEconomyTile.type === 'property' && (
                      <label className="mt-2 block text-xs font-bold text-white/70">
                        Biaya pengembangan
                        <input type="number" min="0" value={adminDevelopmentCost ?? String(selectedAdminEconomyTile.developmentCost ?? 0)} onChange={event => setAdminDevelopmentCost(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-white" />
                      </label>
                    )}
                    <button onClick={() => {
                      updateTileEconomy(selectedAdminEconomyTileId, {
                        price: Number(adminPrice ?? selectedAdminEconomyTile.price ?? 0),
                        ...(selectedAdminEconomyTile.type === 'utility' ? {} : {
                          rent: Number(adminRent ?? selectedAdminEconomyTile.rentSchedule?.[0] ?? selectedAdminEconomyTile.rent ?? 0),
                        }),
                        ...(selectedAdminEconomyTile.type === 'property' ? {
                          developmentCost: Number(adminDevelopmentCost ?? selectedAdminEconomyTile.developmentCost ?? 0),
                        } : {}),
                      });
                      setAdminPrice(null);
                      setAdminRent(null);
                      setAdminDevelopmentCost(null);
                    }} className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black">Simpan ekonomi petak</button>
                  </>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:col-span-2">
                <h3 className="mb-2 text-sm font-black text-white">Atur aturan pertandingan</h3>
                <p className="mb-2 text-[10px] text-white/55">Bobot dadu adalah peluang relatif: bobot lebih kecil membuat angka lebih sulit muncul. Bobot tidak perlu berjumlah 100.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ADMIN_RULE_FIELDS.map(field => (
                    <label key={field.key} className="space-y-1 text-[10px] font-bold text-white/70">
                      {field.label}
                      <input type="number" min={field.key.startsWith('diceWeight') ? 1 : 0} max={field.key.startsWith('diceWeight') ? 1000 : undefined} value={adminRules[field.key]} onChange={event => updateRules({ [field.key]: Number(event.target.value) })} className="w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-1.5 text-white" />
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
