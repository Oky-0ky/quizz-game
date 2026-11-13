'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import PrisonIllustration from '@/components/board/PrisonIllustration';
import {
  MonopolyItemId,
  MonopolyRules,
  MonopolyTeam,
  monopolyBuildingName,
  useMonopolyStore,
} from '@/store/monopolyStore';
import { getMonopolyGridPosition, MONOPOLY_BOARD, MonopolyTile } from '@/data/monopolyBoard';

const ITEM_DETAILS: Record<MonopolyItemId, { name: string; emoji: string }> = {
  jail_card: { name: 'Kunci Bebas Penjara', emoji: '🗝️' },
  rent_shield: { name: 'Perisai Sewa', emoji: '🛡️' },
  takeover_card: { name: 'Kartu Pengambilalihan', emoji: '⚔️' },
  bonus_coin: { name: 'Koin Bonus', emoji: '🪙' },
};

const FEATURE_TILE_TEMPLATES = MONOPOLY_BOARD
  .filter(tile => ['jail', 'goToJail', 'chance', 'community', 'tax', 'freeParking'].includes(tile.type))
  .filter((tile, index, tiles) => tiles.findIndex(candidate => (
    candidate.type === tile.type && candidate.name === tile.name
  )) === index);

const ADMIN_RULE_FIELDS: Array<{ key: keyof MonopolyRules; label: string }> = [
  { key: 'startingCash', label: 'Modal awal' },
  { key: 'goSalary', label: 'Gaji GO' },
  { key: 'bailCost', label: 'Harga Kunci Bebas Penjara' },
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

function adminTileName(tile: MonopolyTile) {
  if (tile.type === 'jail') return 'Penjara / Berkunjung';
  if (tile.type === 'goToJail') return 'Masuk Penjara';
  return tile.name;
}

function teamColorTint(color: string, opacity: number) {
  const match = /^#([\da-f]{6})$/i.exec(color);
  if (!match) return undefined;
  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function wealth(team: MonopolyTeam, game: NonNullable<ReturnType<typeof useMonopolyStore.getState>['game']>) {
  return team.coins + team.properties.reduce((total, tileId) => {
    const tile = game.board[tileId];
    const property = game.properties[tileId];
    const buildingValue = (tile.developmentCost ?? 0) * (property?.buildingLevel ?? 0);
    return total + (tile.price ?? 0) + buildingValue;
  }, 0) - team.loanDebt;
}

export default function MonopolyPage() {
  const game = useMonopolyStore(state => state.game);
  const rollDice = useMonopolyStore(state => state.rollDice);
  const buyJailKey = useMonopolyStore(state => state.buyJailKey);
  const advanceMovement = useMonopolyStore(state => state.advanceMovement);
  const answerQuestion = useMonopolyStore(state => state.answerQuestion);
  const takeRescueLoan = useMonopolyStore(state => state.takeRescueLoan);
  const requestRescueHelp = useMonopolyStore(state => state.requestRescueHelp);
  const respondToRescueHelp = useMonopolyStore(state => state.respondToRescueHelp);
  const declareBankruptcy = useMonopolyStore(state => state.declareBankruptcy);
  const buyProperty = useMonopolyStore(state => state.buyProperty);
  const declinePurchase = useMonopolyStore(state => state.declinePurchase);
  const completeAction = useMonopolyStore(state => state.completeAction);
  const dismissCard = useMonopolyStore(state => state.dismissCard);
  const upgradeProperty = useMonopolyStore(state => state.upgradeProperty);
  const useJailKey = useMonopolyStore(state => state.useJailKey);
  const useRentShield = useMonopolyStore(state => state.useRentShield);
  const useBonusCoin = useMonopolyStore(state => state.useBonusCoin);
  const useTakeoverCard = useMonopolyStore(state => state.useTakeoverCard);
  const takeoverProperty = useMonopolyStore(state => state.takeoverProperty);
  const finishTurn = useMonopolyStore(state => state.finishTurn);
  const downgradeProperty = useMonopolyStore(state => state.downgradeProperty);
  const setBoardTileFromTemplate = useMonopolyStore(state => state.setBoardTileFromTemplate);
  const tickTime = useMonopolyStore(state => state.tickTime);
  const clearGame = useMonopolyStore(state => state.clearGame);
  const adminBoard = useMonopolyStore(state => state.board);
  const adminRules = useMonopolyStore(state => state.rules);
  const resetBoard = useMonopolyStore(state => state.resetBoard);
  const updateRules = useMonopolyStore(state => state.updateRules);
  const updateTileEconomy = useMonopolyStore(state => state.updateTileEconomy);
  const setPhase = useGameStore(state => state.setPhase);
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminEditorTileId, setAdminEditorTileId] = useState(10);
  const [adminTemplateTileId, setAdminTemplateTileId] = useState(-1);
  const [adminTileError, setAdminTileError] = useState('');
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
  const pendingRescue = game?.pendingRescue;
  const rescueHelpers = game && pendingRescue
    ? game.teams.filter(team => !team.bankrupt && team.id !== pendingRescue.debtorId && team.coins >= pendingRescue.shortfall)
    : [];
  const rescueHelper = game && pendingRescue?.helperId
    ? game.teams.find(team => team.id === pendingRescue.helperId)
    : null;
  const rolling = game?.stage === 'moving';
  const sortedTeams = useMemo(() => game ? [...game.teams].sort((a, b) => {
    if (game.winnerId === a.id) return -1;
    if (game.winnerId === b.id) return 1;
    return wealth(b, game) - wealth(a, game) || b.quizCorrect - a.quizCorrect;
  }) : [], [game]);
  const selectedTile = selectedTileId === null ? null : game?.board[selectedTileId] ?? null;
  const adminEditorTile = adminBoard.find(tile => tile.id === adminEditorTileId);
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
  const pendingOwner = game.pendingTakeoverOwner
    ? game.teams.find(team => team.id === game.pendingTakeoverOwner)
    : undefined;
  const buyCost = pendingTile?.price ?? 0;
  const takeoverCost = buyCost * 2;
  const upgradeCost = pendingTile?.developmentCost ?? 0;
  const developmentGroup = pendingTile?.groupId
    ? game.board.filter(tile => tile.type === 'property' && tile.groupId === pendingTile.groupId)
    : [];
  const developmentLevels = developmentGroup.map(tile => game.properties[tile.id]?.buildingLevel ?? 0);
  const ownsDevelopmentGroup = developmentGroup.length > 0 &&
    developmentGroup.every(tile => game.properties[tile.id]?.ownerId === currentTeam?.id);
  const propertyTaxAtLevel = (level: number) => {
    if (!pendingTile) return 0;
    const tax = pendingTile.rentSchedule?.[level] ?? pendingTile.rent ?? 0;
    return level === 0 && ownsDevelopmentGroup ? tax * 2 : tax;
  };
  const currentPropertyTax = propertyTaxAtLevel(property?.buildingLevel ?? 0);
  const canDevelop = Boolean(
    property &&
    !game.activeQuestion &&
    !game.pendingBuy &&
    !game.pendingCard &&
    pendingTile?.type === 'property' &&
    developmentGroup.length > 0 &&
    ownsDevelopmentGroup &&
    property.buildingLevel === Math.min(...developmentLevels),
  );
  const canDowngrade = Boolean(
    property &&
    !game.activeQuestion &&
    !game.pendingBuy &&
    !game.pendingCard &&
    pendingTile?.type === 'property' &&
    developmentGroup.length > 0 &&
    ownsDevelopmentGroup &&
    property.buildingLevel > 0 &&
    property.buildingLevel === Math.max(...developmentLevels),
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
                    backgroundColor: owner ? teamColorTint(owner.color, 0.28) : undefined,
                    boxShadow: owner ? `inset 0 0 0 2px ${owner.color}` : undefined,
                  }}
                  className={`relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-lg border p-0.5 text-center transition-all hover:z-10 hover:scale-[1.04] sm:rounded-xl sm:p-1 ${
                    isSelected ? 'z-10 ring-2 ring-yellow-300 ring-offset-1 ring-offset-emerald-950' : ''
                  } ${corner ? 'bg-amber-100 text-slate-900' : 'bg-slate-50 text-slate-800'}`}
                  aria-label={`${tile.name}, ${squareLabel}`}
                >
                  {tile.groupColor && <span className="absolute inset-x-0 top-0 h-1 sm:h-2" style={{ backgroundColor: owner?.color ?? tile.groupColor }} />}
                  {tile.type === 'jail'
                    ? <PrisonIllustration className="h-7 w-7 shrink-0 sm:h-12 sm:w-12" />
                    : <span className={`leading-none ${corner ? 'text-sm sm:text-2xl' : 'text-xs sm:text-lg'}`}>{tile.icon}</span>}
                  <span className={`mt-0.5 line-clamp-2 w-full break-words font-extrabold leading-tight ${corner ? 'text-[6px] sm:text-[10px]' : 'text-[5px] sm:text-[9px]'}`}>
                    {tile.name}
                  </span>
                  {tile.price !== undefined && <span className="hidden text-[8px] font-bold text-emerald-800 sm:block">{tile.price} 🪙</span>}
                  {owned && (
                    <span className="flex items-center gap-0.5 text-[5px] font-black sm:text-[8px]">
                      <span>{owner?.avatar}</span>
                      <span className="truncate">{monopolyBuildingName(owned.buildingLevel)}</span>
                    </span>
                  )}
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
              {game.teams.some(team => team.jailed) ? (
                <PrisonIllustration className="h-12 w-12 sm:h-24 sm:w-24" />
              ) : (
                <motion.div
                  animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-4xl sm:text-7xl"
                >
                  🏰
                </motion.div>
              )}
              <h2 className="mt-1 font-display text-[10px] leading-tight text-amber-100 sm:mt-3 sm:text-3xl">
                {game.teams.some(team => team.jailed) ? 'PENJARA' : 'KERAJAAN PETUALANG'}
              </h2>
              <p className="mt-1 hidden max-w-xs text-xs text-white/60 sm:block">
                {game.teams.some(team => team.jailed)
                  ? `${game.teams.filter(team => team.jailed).map(team => team.name).join(', ')} harus membeli Kunci Bebas Penjara di toko untuk keluar.`
                  : 'Jawab kuis dengan benar untuk melempar dadu, lalu bangun wilayah dan capai FINISH!'}
              </p>
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
                {currentTeam.jailed && <p className="mt-2 text-xs font-bold text-rose-200">🔒 Dipenjara — beli kunci di Toko Penjara untuk keluar.</p>}
                <p className="mt-1 text-xs text-white/60">Wilayah dimiliki: {currentTeam.properties.length} · Kekayaan: {wealth(currentTeam, game)} 🪙</p>
                {currentTeam.loanDebt > 0 && <p className="mt-1 text-xs font-bold text-amber-200">Pinjaman tersisa: {currentTeam.loanDebt} 🪙</p>}
              </div>

              {game.stage === 'rescue' && pendingRescue && (
                <section className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4">
                  <h3 className="font-black text-rose-100">Dana tidak cukup</h3>
                  <p className="mt-1 text-xs text-white/70">
                    Kurang {pendingRescue.shortfall} 🪙 untuk membayar {pendingRescue.reason}.
                  </p>
                  {pendingRescue.phase === 'choose' ? (
                    <div className="mt-3 space-y-2">
                      <button onClick={takeRescueLoan} className="w-full rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-slate-950">
                        Ajukan pinjaman {pendingRescue.shortfall} 🪙
                      </button>
                      <p className="text-[10px] text-white/50">Pinjaman tanpa bunga; pemasukan berikutnya otomatis dipakai untuk mencicil.</p>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-white/65">Atau minta bantuan pemain lain:</p>
                        {rescueHelpers.length > 0 ? rescueHelpers.map(helper => (
                          <button key={helper.id} onClick={() => requestRescueHelp(helper.id)} className="w-full rounded-xl bg-sky-600/80 px-3 py-2 text-left text-xs font-bold">
                            Minta {helper.name} membantu {pendingRescue.shortfall} 🪙
                          </button>
                        )) : <p className="text-[10px] text-white/45">Belum ada pemain lain dengan saldo yang cukup.</p>}
                      </div>
                      <button onClick={declareBankruptcy} className="w-full rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/70">
                        Tolak bantuan dan nyatakan bangkrut
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-white/75">
                        {rescueHelper?.name ?? 'Pemain'} diminta membantu {pendingRescue.shortfall} 🪙.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => respondToRescueHelp(true)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black">Setujui bantuan</button>
                        <button onClick={() => respondToRescueHelp(false)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Tolak</button>
                      </div>
                    </div>
                  )}
                </section>
              )}

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
                <section className="rounded-2xl border border-rose-300/30 bg-gradient-to-br from-rose-950/70 to-slate-900 p-4">
                  <div className="flex items-center gap-3">
                    <PrisonIllustration className="h-14 w-14 shrink-0" />
                    <div>
                      <h3 className="font-black text-rose-100">🏪 Toko Penjara</h3>
                      <p className="mt-1 text-[11px] text-white/65">Kunci Bebas Penjara · {game.rules.bailCost} 🪙</p>
                    </div>
                  </div>
                  {itemCount('jail_card') > 0 ? (
                    <button onClick={useJailKey} className="mt-3 w-full rounded-xl bg-indigo-500 px-3 py-2.5 text-xs font-black transition hover:bg-indigo-400">
                      🗝️ Gunakan Kunci ({itemCount('jail_card')}) · Bebaskan diri
                    </button>
                  ) : (
                    <button
                      disabled={currentTeam.coins < game.rules.bailCost}
                      onClick={buyJailKey}
                      className="mt-3 w-full rounded-xl bg-amber-400 px-3 py-2.5 text-xs font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      🛒 Beli Kunci · {game.rules.bailCost} koin
                    </button>
                  )}
                  {currentTeam.coins < game.rules.bailCost && itemCount('jail_card') === 0 && (
                    <p className="mt-2 text-center text-[10px] text-rose-200">Saldo belum cukup untuk membeli kunci.</p>
                  )}
                </section>
              )}
              {game.stage === 'ready' && !currentTeam.jailed && (
                <button onClick={rollDice} className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-display text-base text-slate-950 shadow-lg transition hover:brightness-110">
                  🎲 LEMPAR DUA DADU{game.consecutiveDoubles > 0 ? ` · KEMBAR ${game.consecutiveDoubles}/3` : ''}
                </button>
              )}

              {game.activeQuestion && game.stage !== 'rescue' && (
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
                      : game.questionPurpose === 'rent'
                      ? 'Jawab soal sulit untuk diskon pajak 50%'
                          : `${game.activeQuestion.category} · soal petak`}
                  </p>
                  {game.questionPurpose === 'rent' && pendingTile && pendingOwner && property && (
                    <div
                      className="mb-3 rounded-xl border p-3"
                      style={{
                        borderColor: teamColorTint(pendingOwner.color, 0.55),
                        backgroundColor: teamColorTint(pendingOwner.color, 0.16),
                      }}
                    >
                      <h3 className="text-xs font-black text-amber-100">🏠 Pajak Properti</h3>
                      <p className="mt-1 text-[11px] text-white/75">
                        {currentTeam.name} mendarat di {pendingTile.name}, milik {pendingOwner.avatar} {pendingOwner.name}.
                      </p>
                      <p className="mt-1 text-xs font-bold text-white">
                        {monopolyBuildingName(property.buildingLevel)} · Pajak saat ini {game.pendingRent} 🪙
                      </p>
                      <p className="mt-1 text-[10px] text-white/55">Jawaban benar membayar setengah pajak; jawaban salah membayar penuh.</p>
                    </div>
                  )}
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
                      Lewati kuis — bayar pajak penuh {game.pendingRent} koin
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
                  <p className="mt-1 text-xs text-white/65">Harga {buyCost} koin · pajak dasar {pendingTile.rent} koin</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button disabled={currentTeam.coins < buyCost} onClick={buyProperty} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black disabled:opacity-40">Beli wilayah</button>
                    <button onClick={declinePurchase} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Lewati</button>
                  </div>
                </section>
              )}

              {game.questionPurpose === 'rent' && (
                <section className="grid grid-cols-2 gap-2">
                  <button disabled={!itemCount('rent_shield')} onClick={useRentShield} className="rounded-xl bg-sky-600/80 px-2 py-2 text-[10px] font-black disabled:opacity-40">🛡️ Batalkan pajak ({itemCount('rent_shield')})</button>
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
                  🏗️ Bangun {monopolyBuildingName(property.buildingLevel + 1)} · {upgradeCost} koin · pajak {currentPropertyTax} → {propertyTaxAtLevel(property.buildingLevel + 1)} koin
                </button>
              )}
              {canDowngrade && property && game.stage === 'action' && (
                <button onClick={downgradeProperty} className="rounded-xl border border-sky-200/20 bg-sky-400/10 px-3 py-2 text-xs font-black text-sky-100 transition hover:bg-sky-400/20">
                  🏚️ Turunkan ke {monopolyBuildingName(property.buildingLevel - 1)} · refund {Math.floor(upgradeCost / 2)} · pajak {currentPropertyTax} → {propertyTaxAtLevel(property.buildingLevel - 1)} koin
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
                <div className="mt-1 text-[10px] text-white/60">{team.coins} 🪙 · utang {team.loanDebt} 🪙 · {team.properties.length} properti · {team.quizCorrect}✅/{team.quizIncorrect}❌ · posisi {team.position}{team.jailed ? ' · 🔒' : ''}</div>
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
                  {selectedTile.price} 🪙 · pajak dasar {selectedTile.rentSchedule?.[0] ?? selectedTile.rent ?? 'sesuai aturan'} 🪙
                  {selectedTile.groupId && <span> · kelompok {selectedTile.groupId}</span>}
                  {game.properties[selectedTile.id] && (
                    <span className="mt-1 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: game.teams.find(team => team.id === game.properties[selectedTile.id].ownerId)?.color }} />
                      Pemilik {game.teams.find(team => team.id === game.properties[selectedTile.id].ownerId)?.name} · {monopolyBuildingName(game.properties[selectedTile.id].buildingLevel)}
                    </span>
                  )}
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
      {game.pendingCard && game.stage === 'action' && (
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
                <h3 className="mb-2 text-sm font-black text-white">🧩 Editor Kotak</h3>
                <p className="mb-3 text-[11px] text-white/50">Pilih nomor kotak, tentukan jenis petaknya, lalu simpan. Petak khusus bisa ditambahkan di beberapa kotak sekaligus.</p>
                <div className="mb-3 grid max-h-52 grid-cols-5 gap-1.5 overflow-y-auto p-1 sm:grid-cols-10">
                  {adminBoard.map(tile => {
                    const isSelected = tile.id === adminEditorTileId;
                    const isSpecial = FEATURE_TILE_TEMPLATES.some(template => (
                      template.type === tile.type && template.name === tile.name
                    ));
                    return (
                      <button
                        key={tile.id}
                        type="button"
                        disabled={tile.type === 'go'}
                        onClick={() => {
                          setAdminEditorTileId(tile.id);
                          setAdminTileError('');
                          const existingTemplate = FEATURE_TILE_TEMPLATES.find(template => (
                            template.type === tile.type && template.name === tile.name
                          ));
                          setAdminTemplateTileId(existingTemplate?.id ?? -1);
                        }}
                        aria-label={`Pilih kotak ${tile.id}, ${adminTileName(tile)}`}
                        aria-pressed={isSelected}
                        className={`min-h-11 rounded-lg border px-1 text-center transition-colors disabled:cursor-not-allowed ${
                          isSelected
                            ? 'border-yellow-300 bg-yellow-500/25 text-white ring-1 ring-yellow-300'
                            : isSpecial
                              ? 'border-purple-400/50 bg-purple-500/15 text-white'
                              : 'border-white/10 bg-black/20 text-white/45 hover:border-white/30'
                        }`}
                      >
                        <span className="block text-xs font-bold">#{tile.id}</span>
                        <span className="block text-sm leading-4">{tile.icon}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
                  <label className="space-y-1 text-[10px] font-bold text-white/60">
                    Nomor kotak
                    <input
                      type="number"
                      min="1"
                      max={adminBoard.length - 1}
                      value={adminEditorTileId}
                      onChange={event => {
                        setAdminEditorTileId(Number(event.target.value));
                        setAdminTileError('');
                      }}
                      className="w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="space-y-1 text-[10px] font-bold text-white/60">
                    Jenis petak
                    <select
                      value={adminTemplateTileId}
                      onChange={event => setAdminTemplateTileId(Number(event.target.value))}
                      className="w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-2 text-sm text-white"
                    >
                      <option value={-1}>↩️ Petak asli</option>
                      {FEATURE_TILE_TEMPLATES.map(tile => (
                        <option key={tile.id} value={tile.id}>{tile.icon} {adminTileName(tile)}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!Number.isInteger(adminEditorTileId) || adminEditorTileId < 1 || adminEditorTileId >= adminBoard.length) {
                        setAdminTileError(`Pilih nomor kotak antara 1 dan ${adminBoard.length - 1}.`);
                        return;
                      }
                      if (adminEditorTile?.type === 'go') {
                        setAdminTileError('Kotak GO tidak dapat diubah.');
                        return;
                      }
                      setBoardTileFromTemplate(adminEditorTileId, adminTemplateTileId < 0 ? adminEditorTileId : adminTemplateTileId);
                      setAdminTileError('');
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black hover:bg-emerald-500"
                  >
                    Simpan
                  </button>
                </div>
                {adminTileError && <p role="alert" className="mt-2 text-[10px] text-rose-300">{adminTileError}</p>}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-white/45">
                    Kotak #{adminEditorTileId}: {adminEditorTile?.icon} {adminEditorTile ? adminTileName(adminEditorTile) : '—'}
                  </p>
                  <button onClick={resetBoard} className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-[10px] font-bold text-white/70 hover:bg-white/15">
                    Pulihkan semua petak
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <h3 className="mb-2 text-sm font-black text-white">Atur ekonomi petak</h3>
                <p className="mb-2 text-[10px] text-white/55">Harga beli, pajak dasar properti/transportasi, dan biaya pengembangan minimal 2.000 koin. Pajak akan meningkat sesuai tingkat bangunan.</p>
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
                      <input type="number" min="2000" value={adminPrice ?? String(selectedAdminEconomyTile.price ?? 2000)} onChange={event => setAdminPrice(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-white" />
                    </label>
                    {selectedAdminEconomyTile.type !== 'utility' && (
                      <label className="mt-2 block text-xs font-bold text-white/70">
                        Pajak dasar
                        <input type="number" min="2000" value={adminRent ?? String(selectedAdminEconomyTile.rentSchedule?.[0] ?? selectedAdminEconomyTile.rent ?? 2000)} onChange={event => setAdminRent(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-white" />
                      </label>
                    )}
                    {selectedAdminEconomyTile.type === 'property' && (
                      <label className="mt-2 block text-xs font-bold text-white/70">
                        Biaya pengembangan
                        <input type="number" min="2000" value={adminDevelopmentCost ?? String(selectedAdminEconomyTile.developmentCost ?? 2000)} onChange={event => setAdminDevelopmentCost(event.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 p-2 text-white" />
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
                      <input type="number" min={field.key.startsWith('diceWeight') ? 1 : field.key === 'startingCash' ? 2000 : 0} max={field.key.startsWith('diceWeight') ? 1000 : undefined} value={adminRules[field.key]} onChange={event => updateRules({ [field.key]: Number(event.target.value) })} className="w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-1.5 text-white" />
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
