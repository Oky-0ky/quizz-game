import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MONOPOLY_BOARD, MonopolyTile } from '@/data/monopolyBoard';
import { getMonopolyQuestions, MonopolyQuestion } from '@/data/monopolyQuestions';
import { DEFAULT_SUBJECTS, SubjectId } from '@/types/game';

export type MonopolyItemId = 'jail_card' | 'rent_shield' | 'takeover_card' | 'bonus_coin';
export type MonopolyDuration = { type: 'rounds'; value: 10 | 15 | 20 } | { type: 'time'; value: number };
export type MonopolyTurnStage = 'ready' | 'moving' | 'action' | 'rescue' | 'done';

export interface MonopolyRescue {
  debtorId: string;
  amount: number;
  shortfall: number;
  creditorId: string | null;
  reason: string;
  payments: Array<{ amount: number; creditorId: string | null; reason: string }>;
  phase: 'choose' | 'approval';
  helperId: string | null;
  resumeStage: 'action' | 'done';
}

export interface MonopolyProperty {
  tileId: number;
  ownerId: string;
  buildingLevel: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface MonopolyTeam {
  id: string;
  name: string;
  color: string;
  avatar: string;
  position: number;
  coins: number;
  loanDebt: number;
  properties: number[];
  inventory: Record<MonopolyItemId, number>;
  jailed: boolean;
  bankrupt: boolean;
  jailTurns: number;
  quizCorrect: number;
  quizIncorrect: number;
  history: MonopolyLogEntry[];
}

export interface MonopolyRules {
  startingCash: number;
  goSalary: number;
  bailCost: number;
  correctAnswerReward: number;
  wrongAnswerPenalty: number;
  incomeTax: number;
  superTax: number;
  chanceReward: number;
  chanceFine: number;
  communityReward: number;
  communityFine: number;
  diceWeight1: number;
  diceWeight2: number;
  diceWeight3: number;
  diceWeight4: number;
  diceWeight5: number;
  diceWeight6: number;
}

export interface MonopolyLogEntry {
  id: string;
  turn: number;
  teamId: string;
  message: string;
  timestamp: number;
}

export interface MonopolyCardEvent {
  type: 'chance' | 'community';
  message: string;
  landingTileId?: number;
}

export interface MonopolyGame {
  status: 'playing' | 'finished';
  board: MonopolyTile[];
  rules: MonopolyRules;
  subjects: SubjectId[];
  teams: MonopolyTeam[];
  order: string[];
  currentIndex: number;
  completedRounds: number;
  duration: MonopolyDuration;
  startedAt: number;
  timeRemaining: number | null;
  stage: MonopolyTurnStage;
  hasRolled: boolean;
  diceResult: number | null;
  bonusDiceResult: number | null;
  diceTotal: number | null;
  extraTurn: boolean;
  consecutiveDoubles: number;
  movementStartPosition: number | null;
  movementRemaining: number;
  properties: Record<number, MonopolyProperty>;
  usedQuestionIds: string[];
  activeQuestion: MonopolyQuestion | null;
  questionPurpose: 'turn' | 'quiz' | 'tile' | 'property' | 'rent' | 'jail' | 'takeover' | null;
  pendingTileId: number | null;
  pendingRent: number;
  pendingBuy: boolean;
  pendingTakeoverOwner: string | null;
  pendingCard: MonopolyCardEvent | null;
  pendingRescue: MonopolyRescue | null;
  log: MonopolyLogEntry[];
  winnerId: string | null;
  lastAnswer: { correct: boolean; message: string } | null;
}

interface MonopolyStore {
  board: MonopolyTile[];
  rules: MonopolyRules;
  game: MonopolyGame | null;
  swapBoardTiles: (firstTileId: number, secondTileId: number) => void;
  setBoardTileFromTemplate: (tileId: number, templateTileId: number) => void;
  resetBoard: () => void;
  updateTileEconomy: (tileId: number, values: Partial<Pick<MonopolyTile, 'price' | 'rent' | 'developmentCost'>>) => void;
  updateRules: (rules: Partial<MonopolyRules>) => void;
  startGame: (
    teams: Array<{ name: string; color: string; avatar: string }>,
    duration: MonopolyDuration,
    subjects: SubjectId[],
  ) => void;
  clearGame: () => void;
  startTurnQuiz: () => void;
  rollDice: () => void;
  buyJailKey: () => void;
  advanceMovement: () => void;
  answerQuestion: (answer: string) => void;
  takeRescueLoan: () => void;
  requestRescueHelp: (helperId: string) => void;
  respondToRescueHelp: (approved: boolean) => void;
  declareBankruptcy: () => void;
  buyProperty: () => void;
  declinePurchase: () => void;
  completeAction: () => void;
  upgradeProperty: () => void;
  downgradeProperty: () => void;
  useJailKey: () => void;
  useRentShield: () => void;
  useBonusCoin: () => void;
  useTakeoverCard: () => void;
  takeoverProperty: () => void;
  finishTurn: () => void;
  tickTime: () => void;
  dismissCard: () => void;
}

const ITEM_IDS: MonopolyItemId[] = ['jail_card', 'rent_shield', 'takeover_card', 'bonus_coin'];
const REWARD_ITEM_IDS: MonopolyItemId[] = ['rent_shield', 'takeover_card', 'bonus_coin'];
const BUILDING_NAMES = ['Tanpa bangunan', 'Rumah', 'Rumah II', 'Rumah III', 'Rumah IV', 'Hotel / Landmark'];
const TRANSPORT_TYPES = ['rail', 'air', 'cruise', 'space'];
const MINIMUM_PROPERTY_ECONOMY = 2000;
const DEFAULT_RULES: MonopolyRules = {
  startingCash: MINIMUM_PROPERTY_ECONOMY,
  goSalary: 200,
  bailCost: 50,
  correctAnswerReward: 20,
  wrongAnswerPenalty: 0,
  incomeTax: 200,
  superTax: 100,
  chanceReward: 50,
  chanceFine: 50,
  communityReward: 100,
  communityFine: 50,
  diceWeight1: 100,
  diceWeight2: 100,
  diceWeight3: 100,
  diceWeight4: 100,
  diceWeight5: 100,
  diceWeight6: 100,
};
let logCounter = 0;

function rollDie(rules: MonopolyRules): number {
  const weights = [
    rules.diceWeight1,
    rules.diceWeight2,
    rules.diceWeight3,
    rules.diceWeight4,
    rules.diceWeight5,
    rules.diceWeight6,
  ].map(weight => Math.max(1, Math.min(1000, Math.floor(weight))));
  const target = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  let cumulativeWeight = 0;
  for (let index = 0; index < weights.length; index++) {
    cumulativeWeight += weights[index];
    if (target < cumulativeWeight) return index + 1;
  }
  return weights.length;
}

function randomQuestion(
  usedQuestionIds: string[],
  subjects: SubjectId[],
  difficulty?: MonopolyQuestion['difficulty'],
): MonopolyQuestion {
  const subjectQuestions = getMonopolyQuestions(subjects);
  const matchingDifficulty = difficulty
    ? subjectQuestions.filter(question => question.difficulty === difficulty)
    : subjectQuestions;
  const questions = matchingDifficulty.length ? matchingDifficulty : subjectQuestions;
  const available = questions.filter(question => !usedQuestionIds.includes(question.id));
  const pool = available.length ? available : questions;
  return pool[Math.floor(Math.random() * pool.length)];
}

function restoreSubjects(subjects: SubjectId[] | undefined): SubjectId[] {
  const validSubjects = Array.isArray(subjects)
    ? subjects.filter((subject): subject is SubjectId => DEFAULT_SUBJECTS.includes(subject))
    : [];
  return validSubjects.length ? validSubjects : ['b_indonesia'];
}

function addLog(game: MonopolyGame, teamId: string, message: string): MonopolyGame {
  const entry: MonopolyLogEntry = {
    id: `monopoly-log-${Date.now()}-${logCounter++}`,
    turn: game.completedRounds + 1,
    teamId,
    message,
    timestamp: Date.now(),
  };
  return {
    ...game,
    log: [entry, ...game.log].slice(0, 200),
    teams: game.teams.map(team => team.id === teamId
      ? { ...team, history: [entry, ...team.history].slice(0, 200) }
      : team),
  };
}

function currentTeam(game: MonopolyGame): MonopolyTeam {
  const id = game.order[game.currentIndex];
  return game.teams.find(team => team.id === id)!;
}

function nearestJailTileId(game: MonopolyGame, position: number): number {
  const jailTiles = game.board.filter(tile => tile.type === 'jail');
  if (!jailTiles.length) return Math.min(10, game.board.length - 1);
  return jailTiles.reduce((nearest, tile) => {
    const distance = (tile.id - position + game.board.length) % game.board.length;
    const nearestDistance = (nearest.id - position + game.board.length) % game.board.length;
    return distance < nearestDistance ? tile : nearest;
  }).id;
}

function receiveIncome(team: MonopolyTeam, amount: number): Pick<MonopolyTeam, 'coins' | 'loanDebt'> {
  const debtPayment = Math.min(team.loanDebt, amount);
  return {
    coins: team.coins + amount - debtPayment,
    loanDebt: team.loanDebt - debtPayment,
  };
}

function bankruptTeam(game: MonopolyGame, debtorId: string, creditorId: string | null, reason: string): MonopolyGame {
  const debtor = game.teams.find(team => team.id === debtorId);
  if (!debtor || debtor.bankrupt) return game;
  const assets = debtor.properties.filter(tileId => game.properties[tileId]);
  const properties = { ...game.properties };
  if (creditorId) {
    for (const tileId of assets) {
      properties[tileId] = { ...properties[tileId], ownerId: creditorId };
    }
  } else {
    for (const tileId of assets) delete properties[tileId];
  }
  const teams = game.teams.map(team => {
    if (team.id === debtorId) return { ...team, coins: 0, loanDebt: 0, properties: [], bankrupt: true };
    if (team.id === creditorId) {
      return {
        ...team,
        ...receiveIncome(team, debtor.coins),
        properties: [...team.properties, ...assets],
      };
    }
    return team;
  });
  const remainingTeams = teams.filter(team => !team.bankrupt);
  const next: MonopolyGame = {
    ...game,
    teams,
    properties,
    status: remainingTeams.length <= 1 ? 'finished' : game.status,
    winnerId: remainingTeams.length === 1 ? remainingTeams[0].id : game.winnerId,
    stage: 'done',
    activeQuestion: null,
    questionPurpose: null,
    pendingBuy: false,
    pendingRent: 0,
    pendingTakeoverOwner: null,
    pendingCard: null,
    pendingRescue: null,
  };
  return addLog(next, debtorId, `Bangkrut: ${reason}. Aset dialihkan sesuai aturan.`);
}

function beginRescue(game: MonopolyGame, debtorId: string, creditorId: string | null, amount: number, reason: string): MonopolyGame {
  const debtor = game.teams.find(team => team.id === debtorId);
  if (!debtor) return bankruptTeam(game, debtorId, creditorId, `tidak mampu membayar ${reason}`);

  const previousRescue = game.pendingRescue;
  const totalAmount = previousRescue?.debtorId === debtorId
    ? previousRescue.amount + amount
    : amount;
  const payments = previousRescue?.debtorId === debtorId
    ? [...previousRescue.payments, { amount, creditorId, reason }]
    : [{ amount, creditorId, reason }];
  const rescue: MonopolyRescue = {
    debtorId,
    amount: totalAmount,
    shortfall: Math.max(0, totalAmount - debtor.coins),
    creditorId: previousRescue?.creditorId ?? creditorId,
    reason: payments.map(payment => payment.reason).join(' dan '),
    payments,
    phase: previousRescue?.phase ?? 'choose',
    helperId: previousRescue?.helperId ?? null,
    resumeStage: previousRescue?.resumeStage ?? (game.stage === 'done' ? 'done' : 'action'),
  };
  return addLog({
    ...game,
    stage: 'rescue',
    pendingRescue: rescue,
  }, debtorId, `Saldo kurang ${rescue.shortfall} koin untuk ${reason}; pilih pinjaman atau minta bantuan.`);
}

function payRent(game: MonopolyGame, payerId: string, ownerId: string, amount: number): MonopolyGame {
  const payer = game.teams.find(team => team.id === payerId);
  if (!payer) return bankruptTeam(game, payerId, ownerId, `tidak mampu membayar pajak properti ${amount} koin`);
  if (payer.coins < amount) return beginRescue(game, payerId, ownerId, amount, `pajak properti ${amount} koin`);
  const teams = game.teams.map(team => {
    if (team.id === payerId) return { ...team, coins: team.coins - amount };
    if (team.id === ownerId) return { ...team, ...receiveIncome(team, amount) };
    return team;
  });
  return addLog({ ...game, teams }, payerId, `Membayar pajak properti ${amount} koin kepada pemilik.`);
}

function payBank(game: MonopolyGame, payerId: string, amount: number, reason: string): MonopolyGame {
  const payer = game.teams.find(team => team.id === payerId);
  if (!payer) return bankruptTeam(game, payerId, null, `tidak mampu membayar ${reason} sebesar ${amount} koin`);
  if (payer.coins < amount) return beginRescue(game, payerId, null, amount, reason);
  const teams = game.teams.map(team => team.id === payerId
    ? { ...team, coins: team.coins - amount }
    : team);
  return addLog({ ...game, teams }, payerId, `Membayar ${amount} koin untuk ${reason}.`);
}

function completeRescue(game: MonopolyGame, funding: 'loan' | 'help', helperId?: string): MonopolyGame {
  const rescue = game.pendingRescue;
  const debtor = rescue && game.teams.find(team => team.id === rescue.debtorId);
  if (!rescue || !debtor || debtor.bankrupt) return game;

  let teams = game.teams;
  if (funding === 'loan') {
    teams = teams.map(team => team.id === debtor.id
      ? { ...team, coins: team.coins + rescue.shortfall, loanDebt: team.loanDebt + rescue.shortfall }
      : team);
  } else {
    const helper = helperId && game.teams.find(team => team.id === helperId);
    if (!helper || helper.bankrupt || helper.id === debtor.id || helper.coins < rescue.shortfall) return game;
    teams = game.teams.map(team => {
      if (team.id === debtor.id) return { ...team, coins: team.coins + rescue.shortfall };
      if (team.id === helper.id) return { ...team, coins: team.coins - rescue.shortfall };
      return team;
    });
  }

  const fundedGame = { ...game, teams };
  const paidGame = rescue.payments.reduce((currentGame, payment) => payment.creditorId
    ? payRent(currentGame, rescue.debtorId, payment.creditorId, payment.amount)
    : payBank(currentGame, rescue.debtorId, payment.amount, payment.reason), fundedGame);
  const resumedGame = {
    ...paidGame,
    stage: rescue.resumeStage,
    pendingRescue: null,
    lastAnswer: game.lastAnswer
      ? {
        ...game.lastAnswer,
        message: funding === 'loan'
          ? `Tagihan terbayar dengan pinjaman ${rescue.shortfall} koin.`
          : 'Tagihan terbayar dengan bantuan pemain lain.',
      }
      : null,
  };
  return addLog(resumedGame, rescue.debtorId, funding === 'loan'
    ? `Menerima pinjaman ${rescue.shortfall} koin untuk menutup kekurangan; sisa pinjaman ${debtor.loanDebt + rescue.shortfall} koin.`
    : `Menerima bantuan ${rescue.shortfall} koin dari ${game.teams.find(team => team.id === helperId)?.name ?? 'pemain lain'}.`);
}

function finishAction(game: MonopolyGame): MonopolyGame {
  if (game.pendingRescue) {
    return {
      ...game,
      stage: 'rescue',
      activeQuestion: null,
      questionPurpose: null,
      pendingBuy: false,
      pendingRent: 0,
      pendingRescue: { ...game.pendingRescue, resumeStage: 'done' },
    };
  }
  return {
    ...game,
    stage: 'done',
    activeQuestion: null,
    questionPurpose: null,
    pendingBuy: false,
    pendingRent: 0,
    pendingCard: null,
  };
}

function startTurnQuestion(game: MonopolyGame): MonopolyGame {
  const question = randomQuestion(game.usedQuestionIds, game.subjects);
  return {
    ...game,
    stage: 'action',
    activeQuestion: question,
    questionPurpose: 'turn',
    usedQuestionIds: [...game.usedQuestionIds, question.id],
    lastAnswer: null,
  };
}

function startMovement(
  game: MonopolyGame,
  team: MonopolyTeam,
  firstDie: number,
  secondDie: number,
  extraTurn: boolean,
): MonopolyGame {
  const diceTotal = firstDie + secondDie;
  return addLog({
    ...game,
    stage: 'moving',
    hasRolled: true,
    diceResult: firstDie,
    bonusDiceResult: secondDie,
    diceTotal,
    extraTurn,
    movementStartPosition: team.position,
    movementRemaining: diceTotal,
    activeQuestion: null,
    questionPurpose: null,
  }, team.id, `Dadu menunjukkan ${firstDie} dan ${secondDie} (total ${diceTotal}).`);
}

function updateTeam(game: MonopolyGame, updated: MonopolyTeam): MonopolyTeam[] {
  return game.teams.map(team => team.id === updated.id
    ? {
      ...updated,
      ...receiveIncome(team, Math.max(0, updated.coins - team.coins)),
      history: team.history,
    }
    : team);
}

function isPurchasable(tile: MonopolyTile): boolean {
  return tile.type === 'property' || tile.type === 'utility' || TRANSPORT_TYPES.includes(tile.type);
}

function enforceMinimumEconomy(tile: MonopolyTile): MonopolyTile {
  if (!isPurchasable(tile)) return tile;

  const baseRent = tile.rentSchedule?.[0] ?? tile.rent;
  const rentSchedule = tile.rentSchedule?.map(rent => {
    const minimumRent = Math.max(MINIMUM_PROPERTY_ECONOMY, baseRent ?? 0);
    const scaledRent = baseRent ? Math.round(rent * minimumRent / baseRent) : rent;
    return Math.max(MINIMUM_PROPERTY_ECONOMY, scaledRent);
  });

  return {
    ...tile,
    price: Math.max(MINIMUM_PROPERTY_ECONOMY, tile.price ?? 0),
    ...(baseRent === undefined ? {} : { rent: Math.max(MINIMUM_PROPERTY_ECONOMY, baseRent) }),
    ...(rentSchedule ? { rentSchedule } : {}),
    ...(tile.type === 'property'
      ? { developmentCost: Math.max(MINIMUM_PROPERTY_ECONOMY, tile.developmentCost ?? 0) }
      : {}),
  };
}

function enforceBoardEconomyMinimum(board: MonopolyTile[]): MonopolyTile[] {
  return board.map(enforceMinimumEconomy);
}

function getRent(game: MonopolyGame, tile: MonopolyTile, property: MonopolyProperty): number {
  if (TRANSPORT_TYPES.includes(tile.type)) {
    const ownedCount = Object.values(game.properties).filter(owned => (
      owned.ownerId === property.ownerId && TRANSPORT_TYPES.includes(game.board[owned.tileId].type)
    )).length;
    return tile.rentSchedule?.[ownedCount - 1] ?? tile.rent ?? 25;
  }
  if (tile.type === 'utility') {
    const ownedUtilities = Object.values(game.properties).filter(owned => (
      owned.ownerId === property.ownerId && game.board[owned.tileId].type === 'utility'
    )).length;
    return game.diceTotal ? game.diceTotal * (ownedUtilities > 1 ? 10 : 4) : 0;
  }
  const rent = tile.rentSchedule?.[property.buildingLevel] ?? tile.rent ?? 0;
  if (property.buildingLevel === 0 && tile.groupId) {
    const groupProperties = game.board.filter(boardTile => boardTile.type === 'property' && boardTile.groupId === tile.groupId);
    const ownsGroup = groupProperties.every(groupTile => game.properties[groupTile.id]?.ownerId === property.ownerId);
    return ownsGroup ? rent * 2 : rent;
  }
  return rent;
}

function processLanding(game: MonopolyGame, tileId: number): MonopolyGame {
  const tile = game.board[tileId];
  const team = currentTeam(game);
  let next: MonopolyGame = { ...game, stage: 'action', pendingTileId: tileId, lastAnswer: null };
  if (tile.type === 'go' || tile.type === 'freeParking' || tile.type === 'jail') return finishAction(next);
  const property = isPurchasable(tile) ? next.properties[tileId] : undefined;
  let questionPurpose: MonopolyGame['questionPurpose'] = tile.type === 'quiz' ? 'quiz' : 'tile';
  if (isPurchasable(tile)) {
    if (property && property.ownerId !== team.id) {
      questionPurpose = 'rent';
      const rent = getRent(next, tile, property);
      next.pendingRent = rent;
      next.pendingTakeoverOwner = property.ownerId;
      next = addLog(next, team.id, `Tagihan pajak properti ${rent} koin di ${tile.name}; pilih kuis sulit untuk diskon atau bayar penuh.`);
    } else if (!property) {
      return { ...next, pendingBuy: true };
    } else {
      questionPurpose = 'property';
    }
  }
  if (tile.type === 'chance' || tile.type === 'community') {
    const cardType = tile.type;
    const cardRoll = Math.floor(Math.random() * (cardType === 'chance' ? 6 : 5));
    if (cardType === 'chance' && cardRoll === 0) {
      next.teams = updateTeam(next, { ...team, coins: team.coins + game.rules.chanceReward });
      next.pendingCard = { type: cardType, message: `Hadiah kejutan: menerima ${game.rules.chanceReward} koin.` };
    } else if (cardType === 'chance' && cardRoll === 1) {
      next = payBank(next, team.id, game.rules.chanceFine, 'denda perjalanan');
      next.pendingCard = { type: cardType, message: `Denda perjalanan: membayar ${game.rules.chanceFine} koin.` };
    } else if (cardType === 'chance' && cardRoll === 2) {
      const target = (team.position + 3) % game.board.length;
      const salary = target < team.position ? game.rules.goSalary : 0;
      next.teams = updateTeam(next, { ...team, position: target, coins: team.coins + salary });
      next.pendingCard = { type: cardType, message: `Maju 3 petak ke ${game.board[target].name}${salary ? ` dan menerima gaji GO ${salary} koin` : ''}.`, landingTileId: target };
    } else if (cardType === 'chance' && cardRoll === 3) {
      const target = (team.position - 2 + game.board.length) % game.board.length;
      next.teams = updateTeam(next, { ...team, position: target });
      next.pendingCard = { type: cardType, message: `Mundur 2 petak ke ${game.board[target].name}.`, landingTileId: target };
    } else if (cardType === 'chance' && cardRoll === 4) {
      next.teams = updateTeam(next, { ...team, position: 0, coins: team.coins + game.rules.goSalary });
      next.pendingCard = { type: cardType, message: `Langsung menuju GO dan menerima gaji ${game.rules.goSalary} koin.` };
    } else if (cardType === 'chance') {
      next.teams = updateTeam(next, { ...team, position: nearestJailTileId(next, team.position), jailed: true, jailTurns: 0 });
      next.pendingCard = { type: cardType, message: 'Petugas mengantar ke penjara. Beli Kunci Bebas Penjara di Toko Penjara untuk keluar.' };
    } else if (cardRoll === 0) {
      next.teams = updateTeam(next, { ...team, coins: team.coins + game.rules.communityReward });
      next.pendingCard = { type: cardType, message: `Dana komunitas memberi bonus ${game.rules.communityReward} koin.` };
    } else if (cardRoll === 1) {
      next = payBank(next, team.id, game.rules.communityFine, 'iuran komunitas');
      next.pendingCard = { type: cardType, message: `Iuran komunitas: membayar ${game.rules.communityFine} koin.` };
    } else if (cardRoll === 2) {
      const repairCost = team.properties
        .reduce((total, id) => total + (game.properties[id]?.buildingLevel ?? 0) * 25, 0);
      next = payBank(next, team.id, repairCost, 'biaya perawatan kota');
      next.pendingCard = { type: cardType, message: `Biaya perawatan kota: membayar ${repairCost} koin.` };
    } else if (cardRoll === 3) {
      next.teams = updateTeam(next, { ...team, coins: team.coins + game.rules.communityReward });
      next.pendingCard = { type: cardType, message: `Bank komunitas memberi hibah ${game.rules.communityReward} koin.` };
    } else {
      next.teams = updateTeam(next, { ...team, position: 0, coins: team.coins + game.rules.goSalary });
      next.pendingCard = { type: cardType, message: `Kembali ke GO dan menerima gaji ${game.rules.goSalary} koin.` };
    }
    if (next.stage !== 'rescue') next.stage = 'action';
    return addLog(next, team.id, `${tile.name}: ${next.pendingCard.message}`);
  }
  const question = randomQuestion(
    next.usedQuestionIds,
    next.subjects,
    questionPurpose === 'rent' ? 'hard' : undefined,
  );
  return {
    ...next,
    activeQuestion: question,
    questionPurpose,
    usedQuestionIds: [...next.usedQuestionIds, question.id],
  };
}

function resolveAnsweredTile(game: MonopolyGame, tileId: number): MonopolyGame {
  const tile = game.board[tileId];
  const team = currentTeam(game);
  let next: MonopolyGame = { ...game, activeQuestion: null, questionPurpose: null };

  if (tile.type === 'reward') {
    const reward = Math.random() < 0.65 ? 'coins' : 'item';
    const itemId = REWARD_ITEM_IDS[Math.floor(Math.random() * REWARD_ITEM_IDS.length)];
    const updatedTeam = reward === 'coins'
      ? { ...team, coins: team.coins + 30 }
      : { ...team, inventory: { ...team.inventory, [itemId]: team.inventory[itemId] + 1 } };
    next = { ...next, teams: updateTeam(next, updatedTeam) };
    next = addLog(next, team.id, reward === 'coins' ? 'Mendapat hadiah 30 koin.' : `Mendapat item ${itemId.replaceAll('_', ' ')}.`);
  } else if (tile.type === 'tax') {
    const taxAmount = tile.name === 'Income Tax' ? game.rules.incomeTax : tile.name === 'Super Tax' ? game.rules.superTax : tile.price ?? 20;
    next = payBank(next, team.id, taxAmount, `pajak di ${tile.name}`);
  } else if (tile.type === 'goToJail') {
    const updatedTeam = { ...team, position: nearestJailTileId(next, team.position), jailed: true, jailTurns: 0 };
    next = { ...next, teams: updateTeam(next, updatedTeam) };
    next = addLog(next, team.id, 'Masuk penjara; pion dipindahkan ke kotak Jail.');
  } else if (tile.type === 'portal') {
    const target = tile.portalTarget ?? tileId;
    next = { ...next, teams: updateTeam(next, { ...team, position: target }) };
    next = addLog(next, team.id, `Menggunakan portal ke kotak ${target}.`);
    return processLanding(next, target);
  }

  return finishAction(next);
}

function settle(game: MonopolyGame): MonopolyGame {
  const limitReached = game.duration.type === 'rounds' && game.completedRounds >= game.duration.value;
  const timeReached = game.duration.type === 'time' && (game.timeRemaining ?? 1) <= 0;
  if (!limitReached && !timeReached) return game;
  const ranked = game.teams.filter(team => !team.bankrupt).sort((a, b) => {
    const wealth = (team: MonopolyTeam) => team.coins + team.properties.reduce((total, id) => {
      const property = game.properties[id];
      const tile = game.board[id];
      return total + (tile.price ?? 0) + (property?.buildingLevel ?? 0) * (tile.developmentCost ?? 0);
    }, 0) - team.loanDebt;
    return wealth(b) - wealth(a) || b.quizCorrect - a.quizCorrect;
  });
  return { ...game, status: 'finished', winnerId: ranked[0]?.id ?? null, stage: 'done' };
}

function makeInitialGame(
  teamsData: Array<{ name: string; color: string; avatar: string }>,
  duration: MonopolyDuration,
  board: MonopolyTile[],
  rules: MonopolyRules,
  subjects: SubjectId[],
): MonopolyGame {
  const teams = teamsData.map((team, index) => ({
    ...team,
    id: `monopoly-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    position: 0,
    coins: rules.startingCash,
    loanDebt: 0,
    properties: [],
    inventory: Object.fromEntries(ITEM_IDS.map(item => [item, 0])) as Record<MonopolyItemId, number>,
    jailed: false,
    bankrupt: false,
    jailTurns: 0,
    quizCorrect: 0,
    quizIncorrect: 0,
    history: [],
  }));
  const order = teams.map(team => team.id);
  for (let index = order.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  const game: MonopolyGame = {
    status: 'playing',
    board: [...board],
    rules,
    subjects,
    teams,
    order,
    currentIndex: 0,
    completedRounds: 0,
    duration,
    startedAt: Date.now(),
    timeRemaining: duration.type === 'time' ? duration.value * 60 : null,
    stage: 'ready',
    hasRolled: false,
    diceResult: null,
    bonusDiceResult: null,
    diceTotal: null,
    extraTurn: false,
    consecutiveDoubles: 0,
    movementStartPosition: null,
    movementRemaining: 0,
    properties: {},
    usedQuestionIds: [],
    activeQuestion: null,
    questionPurpose: null,
    pendingTileId: null,
    pendingRent: 0,
    pendingBuy: false,
    pendingTakeoverOwner: null,
    pendingCard: null,
    pendingRescue: null,
    log: [],
    winnerId: null,
    lastAnswer: null,
  };
  return startTurnQuestion(game);
}

function restoreGame(savedGame: MonopolyGame | null | undefined, board: MonopolyTile[], rules: MonopolyRules): MonopolyGame | null {
  if (!savedGame || !Array.isArray(savedGame.teams) || !Array.isArray(savedGame.order)) return null;
  const savedBoard = Array.isArray(savedGame.board) ? savedGame.board : [];
  const restoredRules = { ...DEFAULT_RULES, ...rules, ...savedGame.rules };
  restoredRules.startingCash = Math.max(MINIMUM_PROPERTY_ECONOMY, restoredRules.startingCash);
  const teams = savedGame.teams.map(team => ({
    ...team,
    inventory: { ...team.inventory, jail_card: 0 },
    bankrupt: team.bankrupt ?? false,
    loanDebt: team.loanDebt ?? 0,
    jailTurns: team.jailTurns ?? 0,
    quizCorrect: team.quizCorrect ?? 0,
    quizIncorrect: team.quizIncorrect ?? 0,
  }));
  const subjects = restoreSubjects(savedGame.subjects);
  if (savedBoard.length === board.length && savedBoard[0]?.type === 'go') {
    return {
      ...savedGame,
      ...(savedGame.questionPurpose === 'jail'
        ? { stage: 'ready' as const, activeQuestion: null, questionPurpose: null, lastAnswer: null }
        : {}),
      board: enforceBoardEconomyMinimum(savedBoard),
      rules: restoredRules,
      subjects,
      teams,
      diceTotal: savedGame.diceTotal ?? null,
      extraTurn: savedGame.extraTurn ?? false,
      consecutiveDoubles: savedGame.consecutiveDoubles ?? 0,
      pendingRescue: savedGame.pendingRescue ?? null,
    };
  }

  const propertyTiles = board.filter(isPurchasable);
  const migratedProperties: Record<number, MonopolyProperty> = {};
  Object.values(savedGame.properties ?? {})
    .sort((a, b) => a.tileId - b.tileId)
    .slice(0, propertyTiles.length)
    .forEach((property, index) => {
      const tileId = propertyTiles[index].id;
      migratedProperties[tileId] = {
        ...property,
        tileId,
        buildingLevel: Math.min(property.buildingLevel, 5) as MonopolyProperty['buildingLevel'],
      };
    });
  const migratedTeams = teams.map(team => ({
    ...team,
    position: Math.min(board.length - 1, Math.max(0, team.position)),
    properties: Object.values(migratedProperties)
      .filter(property => property.ownerId === team.id)
      .map(property => property.tileId),
  }));
  const restoredGame: MonopolyGame = {
    ...savedGame,
    board,
    rules: restoredRules,
    subjects,
    teams: migratedTeams,
    properties: migratedProperties,
    stage: savedGame.status === 'playing' ? 'ready' : 'done',
    diceTotal: null,
    extraTurn: false,
    consecutiveDoubles: 0,
    movementStartPosition: null,
    movementRemaining: 0,
    activeQuestion: null,
    questionPurpose: null,
    pendingTileId: null,
    pendingRent: 0,
    pendingBuy: false,
    pendingTakeoverOwner: null,
    pendingCard: null,
    pendingRescue: null,
    lastAnswer: null,
  };
  return savedGame.status === 'playing' && !currentTeam(restoredGame).jailed
    ? startTurnQuestion(restoredGame)
    : restoredGame;
}

export const useMonopolyStore = create<MonopolyStore>()(persist((set, get) => ({
  board: enforceBoardEconomyMinimum(MONOPOLY_BOARD),
  rules: DEFAULT_RULES,
  game: null,

  swapBoardTiles: (firstTileId, secondTileId) => {
    const board = get().board;
    if (
      firstTileId === secondTileId ||
      firstTileId <= 0 ||
      secondTileId <= 0 ||
      firstTileId >= board.length ||
      secondTileId >= board.length
    ) return;
    const firstTile = board[firstTileId];
    const secondTile = board[secondTileId];
    if (!firstTile || !secondTile) return;
    set({
      board: board.map(tile => {
        if (tile.id === firstTileId) return { ...secondTile, id: firstTileId };
        if (tile.id === secondTileId) return { ...firstTile, id: secondTileId };
        return tile;
      }),
    });
  },
  setBoardTileFromTemplate: (tileId, templateTileId) => {
    const board = get().board;
    const template = MONOPOLY_BOARD[templateTileId];
    if (
      !Number.isInteger(tileId) ||
      !Number.isInteger(templateTileId) ||
      tileId <= 0 ||
      tileId >= board.length ||
      templateTileId <= 0 ||
      !template ||
      template.type === 'go'
    ) return;
    set({
      board: board.map(tile => tile.id === tileId
        ? enforceMinimumEconomy({ ...template, id: tileId })
        : tile),
    });
  },
  resetBoard: () => set({ board: enforceBoardEconomyMinimum(MONOPOLY_BOARD) }),
  updateTileEconomy: (tileId, values) => {
    const board = get().board;
    const tile = board[tileId];
    if (!tile || !isPurchasable(tile)) return;
    const safeValues = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        Number.isFinite(value) ? Math.max(MINIMUM_PROPERTY_ECONOMY, Math.floor(value)) : MINIMUM_PROPERTY_ECONOMY,
      ]),
    );
    const oldRent = tile.rentSchedule?.[0] ?? tile.rent ?? 0;
    const newRent = values.rent === undefined
      ? undefined
      : Math.max(MINIMUM_PROPERTY_ECONOMY, Math.floor(values.rent));
    const rentSchedule = newRent === undefined || !tile.rentSchedule
      ? tile.rentSchedule
      : tile.rentSchedule.map(rent => Math.max(
        MINIMUM_PROPERTY_ECONOMY,
        oldRent ? Math.round(rent * newRent / oldRent) : rent,
      ));
    set({
      board: board.map(boardTile => boardTile.id === tileId
        ? { ...boardTile, ...safeValues, ...(rentSchedule ? { rentSchedule } : {}) }
        : boardTile),
    });
  },
  updateRules: rules => {
    const updatedRules = Object.fromEntries(
      Object.entries(rules).map(([key, value]) => [
        key,
        key.startsWith('diceWeight')
          ? Number.isFinite(value) ? Math.min(1000, Math.max(1, Math.floor(value))) : 1
          : Number.isFinite(value)
            ? Math.max(key === 'startingCash' ? MINIMUM_PROPERTY_ECONOMY : 0, Math.floor(value))
            : key === 'startingCash' ? MINIMUM_PROPERTY_ECONOMY : 0,
      ]),
    ) as Partial<MonopolyRules>;
    set({ rules: { ...get().rules, ...updatedRules } });
  },
  startGame: (teamsData, duration, subjects) => {
    const validSubjects = restoreSubjects(subjects);
    if (
      teamsData.length < 2 ||
      teamsData.length > 6 ||
      !subjects.length ||
      !getMonopolyQuestions(validSubjects).length
    ) return;
    set({ game: makeInitialGame(teamsData, duration, get().board, get().rules, validSubjects) });
  },
  clearGame: () => set({ game: null }),

  startTurnQuiz: () => {
    const game = get().game;
    if (!game || game.status !== 'playing' || game.stage !== 'ready') return;
    const team = currentTeam(game);
    if (team.jailed) return;
    set({ game: startTurnQuestion(game) });
  },
  rollDice: () => {
    const game = get().game;
    if (!game || game.status !== 'playing' || game.stage !== 'ready') return;
    const team = currentTeam(game);
    if (team.jailed) return;
    const firstDie = rollDie(game.rules);
    const secondDie = rollDie(game.rules);
    const isDouble = firstDie === secondDie;
    if (isDouble && game.consecutiveDoubles >= 2) {
      const jailedTeam = { ...team, position: nearestJailTileId(game, team.position), jailed: true, jailTurns: 0 };
      const next = {
        ...game,
        teams: updateTeam(game, jailedTeam),
        stage: 'done' as const,
        hasRolled: true,
        diceResult: firstDie,
        bonusDiceResult: secondDie,
        diceTotal: firstDie + secondDie,
        extraTurn: false,
        consecutiveDoubles: 0,
      };
      set({ game: addLog(next, team.id, 'Mendapat angka kembar tiga kali berturut-turut dan masuk penjara.') });
      return;
    }

    const next = { ...game, consecutiveDoubles: isDouble ? game.consecutiveDoubles + 1 : 0 };
    set({ game: startMovement(next, team, firstDie, secondDie, isDouble) });
  },
  buyJailKey: () => {
    const game = get().game;
    if (!game || game.stage !== 'ready' || game.status !== 'playing') return;
    const team = currentTeam(game);
    const price = game.rules.bailCost;
    if (!team.jailed || team.coins < price || team.inventory.jail_card > 0) return;
    const updatedTeam = {
      ...team,
      coins: team.coins - price,
      inventory: { ...team.inventory, jail_card: 1 },
    };
    const next = { ...game, teams: updateTeam(game, updatedTeam) };
    set({ game: addLog(next, team.id, `Membeli Kunci Bebas Penjara seharga ${price} koin.`) });
  },
  advanceMovement: () => {
    const game = get().game;
    if (!game || game.stage !== 'moving' || game.movementRemaining <= 0) return;
    const team = currentTeam(game);
    const nextPosition = (team.position + 1) % game.board.length;
    const passesGo = nextPosition === 0;
    const updatedTeam = {
      ...team,
      position: nextPosition,
      coins: team.coins + (passesGo ? game.rules.goSalary : 0),
    };
    let next: MonopolyGame = {
      ...game,
      teams: updateTeam(game, updatedTeam),
      movementRemaining: game.movementRemaining - 1,
    };
    const start = game.movementStartPosition ?? team.position;
    if (passesGo) next = addLog(next, team.id, `Melewati GO dan menerima gaji ${game.rules.goSalary} koin.`);
    if (next.movementRemaining === 0) {
      next = addLog(next, team.id, `Pion bergerak ${game.diceTotal} langkah: dari kotak ${start} ke ${nextPosition}.`);
      next = addLog(next, team.id, `Berhenti di kotak ${nextPosition}: ${game.board[nextPosition].name}.`);
      next = processLanding(next, nextPosition);
    }
    set({ game: next });
  },
  answerQuestion: answer => {
    const game = get().game;
    if (!game || game.status !== 'playing' || game.stage !== 'action' || !game.activeQuestion) return;
    const team = currentTeam(game);
    const question = game.activeQuestion;
    const correct = answer === question.answer;
    let next: MonopolyGame = {
      ...game,
      activeQuestion: null,
      questionPurpose: null,
      lastAnswer: { correct, message: correct ? 'Jawaban benar!' : `Belum tepat. Jawaban: ${question.answer}` },
    };
    next = addLog(next, team.id, `Soal ${question.category}: "${question.question}" — jawaban ${correct ? 'benar' : 'salah'} (${answer}).`);
    if (game.questionPurpose === 'turn') {
      if (correct) {
        next = {
          ...next,
          stage: 'ready',
          teams: updateTeam(next, { ...team, coins: team.coins + game.rules.correctAnswerReward }),
        };
        next = addLog(next, team.id, `Jawaban benar, mendapat ${game.rules.correctAnswerReward} koin. Lempar dua dadu untuk bergerak.`);
      } else {
        next = finishAction(next);
        next = addLog(next, team.id, 'Jawaban salah; tidak mendapat lemparan dadu.');
      }
    } else if (game.questionPurpose === 'quiz' || game.questionPurpose === 'property' || game.questionPurpose === 'tile') {
      if (correct) {
        const reward = game.rules.correctAnswerReward;
        const updatedTeam = { ...team, coins: team.coins + reward };
        next.teams = updateTeam(next, updatedTeam);
        next = addLog(next, team.id, `Jawaban benar, mendapat ${reward} koin.`);
      }
      if (game.questionPurpose === 'quiz') {
        next = finishAction(next);
      } else if (game.questionPurpose === 'property') {
        const tileId = game.pendingTileId;
        const property = tileId === null ? undefined : game.properties[tileId];
        if (!property) next.pendingBuy = true;
      } else if (game.pendingTileId !== null) {
        next = resolveAnsweredTile(next, game.pendingTileId);
      }
    } else if (game.questionPurpose === 'rent') {
      const ownerId = game.pendingTakeoverOwner;
      const rent = correct ? Math.ceil(game.pendingRent / 2) : game.pendingRent;
      if (ownerId) next = payRent(next, team.id, ownerId, rent);
      else next = bankruptTeam(next, team.id, null, 'pemilik properti tidak tersedia untuk pembayaran pajak');
      next = {
        ...next,
        lastAnswer: {
          correct,
          message: next.pendingRescue
            ? `Dana kurang ${next.pendingRescue.shortfall} koin untuk membayar pajak properti. Pilih pinjaman atau minta bantuan.`
            : correct
              ? `Jawaban benar! Pajak properti turun 50% menjadi ${rent} koin.`
              : `Belum tepat. Pajak properti penuh ${rent} koin telah dibayar. Jawaban: ${question.answer}`,
        },
      };
    } else if (game.questionPurpose === 'takeover') {
      const property = game.pendingTileId === null ? null : game.properties[game.pendingTileId];
      const tile = game.pendingTileId === null ? null : game.board[game.pendingTileId];
      const price = (tile?.price ?? 0) * 2;
      const ownerId = game.pendingTakeoverOwner;
      if (!ownerId) {
        next = bankruptTeam(next, team.id, null, 'pemilik properti tidak tersedia untuk pembayaran pajak');
      } else {
        next = payRent(next, team.id, ownerId, game.pendingRent);
        if (next.pendingRescue) {
          next = {
            ...next,
            lastAnswer: {
              correct,
              message: `Dana kurang ${next.pendingRescue.shortfall} koin untuk membayar pajak properti. Pilih pinjaman atau minta bantuan.`,
            },
          };
        } else {
          const buyer = currentTeam(next);
          if (correct && property && property.buildingLevel < 5 && tile && buyer.coins >= price) {
            const updatedTeam = { ...buyer, coins: buyer.coins - price, properties: [...buyer.properties, property.tileId] };
            next.teams = updateTeam(next, updatedTeam).map(other => other.id === ownerId
              ? { ...other, ...receiveIncome(other, price), properties: other.properties.filter(id => id !== property.tileId) }
              : other);
            next.properties = { ...next.properties, [property.tileId]: { ...property, ownerId: team.id } };
            next = addLog(next, team.id, `Mengambil alih ${tile.name} dengan membayar ${price} koin (2x harga properti).`);
            next = finishAction(next);
            next = addLog(next, team.id, `Kuis pengambilalihan benar; ${tile.name} berhasil diambil alih.`);
          } else {
            const message = correct
              ? `Pajak properti dibayar, tetapi diperlukan ${price} koin untuk takeover.`
              : `Jawaban takeover salah; pajak properti ${game.pendingRent} koin tetap dibayar.`;
            next = { ...next, stage: 'action', lastAnswer: { correct: false, message } };
            next = addLog(next, team.id, message);
          }
        }
      }
    }
    const answeredTeam = currentTeam(next);
    const quizUpdatedTeam = {
      ...answeredTeam,
      quizCorrect: answeredTeam.quizCorrect + (correct ? 1 : 0),
      quizIncorrect: answeredTeam.quizIncorrect + (correct ? 0 : 1),
    };
    next.teams = updateTeam(next, quizUpdatedTeam);
    if (!correct && game.rules.wrongAnswerPenalty > 0 && ['turn', 'quiz', 'property', 'tile'].includes(game.questionPurpose ?? '')) {
      next = payBank(next, team.id, game.rules.wrongAnswerPenalty, 'penalti jawaban salah');
    }
    set({ game: next });
  },
  takeRescueLoan: () => {
    const game = get().game;
    if (!game || game.status !== 'playing' || game.stage !== 'rescue' || game.pendingRescue?.phase !== 'choose') return;
    set({ game: completeRescue(game, 'loan') });
  },
  requestRescueHelp: helperId => {
    const game = get().game;
    const rescue = game?.pendingRescue;
    if (!game || game.status !== 'playing' || game.stage !== 'rescue' || rescue?.phase !== 'choose') return;
    const helper = game.teams.find(team => team.id === helperId);
    if (!helper || helper.bankrupt || helper.id === rescue.debtorId || helper.coins < rescue.shortfall) return;
    const next = {
      ...game,
      pendingRescue: { ...rescue, phase: 'approval' as const, helperId },
    };
    set({ game: addLog(next, rescue.debtorId, `Meminta bantuan ${helper.name} sebesar ${rescue.shortfall} koin.`) });
  },
  respondToRescueHelp: approved => {
    const game = get().game;
    const rescue = game?.pendingRescue;
    const helper = rescue?.helperId && game?.teams.find(team => team.id === rescue.helperId);
    if (!game || game.status !== 'playing' || game.stage !== 'rescue' || rescue?.phase !== 'approval' || !helper) return;
    if (approved) {
      set({ game: completeRescue(game, 'help', helper.id) });
      return;
    }
    const next = {
      ...game,
      pendingRescue: { ...rescue, phase: 'choose' as const, helperId: null },
    };
    set({ game: addLog(next, helper.id, `Menolak permintaan bantuan dari ${game.teams.find(team => team.id === rescue.debtorId)?.name ?? 'pemain'}.`) });
  },
  declareBankruptcy: () => {
    const game = get().game;
    const rescue = game?.pendingRescue;
    if (!game || game.status !== 'playing' || game.stage !== 'rescue' || !rescue) return;
    set({ game: bankruptTeam(game, rescue.debtorId, rescue.creditorId, `tidak dapat membayar ${rescue.amount} koin untuk ${rescue.reason}`) });
  },
  buyProperty: () => {
    const game = get().game;
    if (!game || game.status !== 'playing' || game.stage !== 'action' || !game.pendingBuy || game.pendingTileId === null) return;
    const team = currentTeam(game);
    const tile = game.board[game.pendingTileId];
    const price = tile.price ?? 0;
    if (!isPurchasable(tile) || game.properties[tile.id] || team.coins < price) return;
    const updatedTeam = { ...team, coins: team.coins - price, properties: [...team.properties, tile.id] };
    const next = {
      ...game,
      teams: updateTeam(game, updatedTeam),
      properties: { ...game.properties, [tile.id]: { tileId: tile.id, ownerId: team.id, buildingLevel: 0 as const } },
    };
    set({ game: finishAction(addLog(next, team.id, `Membeli ${tile.name} seharga ${price} koin.`)) });
  },
  completeAction: () => {
    const game = get().game;
    if (!game || game.stage !== 'action' || game.activeQuestion || game.pendingBuy || game.pendingCard) return;
    set({ game: finishAction(game) });
  },
  dismissCard: () => {
    const game = get().game;
    if (!game || game.stage !== 'action' || !game.pendingCard) return;
    const next = { ...game, pendingCard: null };
    set({
      game: game.pendingCard.landingTileId === undefined
        ? finishAction(next)
        : processLanding(next, game.pendingCard.landingTileId),
    });
  },
  declinePurchase: () => {
    const game = get().game;
    if (!game || !game.pendingBuy || game.pendingTileId === null) return;
    const next = addLog(game, currentTeam(game).id, `Melewati pembelian ${game.board[game.pendingTileId].name}.`);
    set({ game: finishAction(next) });
  },
  upgradeProperty: () => {
    const game = get().game;
    if (!game || game.status !== 'playing' || game.stage !== 'action' || game.activeQuestion || game.pendingBuy || game.pendingCard || game.pendingTileId === null) return;
    const team = currentTeam(game);
    const property = game.properties[game.pendingTileId];
    const tile = game.board[game.pendingTileId];
    if (!property || !tile || tile.type !== 'property' || !tile.groupId || property.ownerId !== team.id || property.buildingLevel >= 5) return;
    const groupProperties = game.board.filter(boardTile => boardTile.type === 'property' && boardTile.groupId === tile.groupId);
    if (!groupProperties.every(groupTile => game.properties[groupTile.id]?.ownerId === team.id)) return;
    const groupLevels = groupProperties.map(groupTile => game.properties[groupTile.id]?.buildingLevel ?? 0);
    if (property.buildingLevel > Math.min(...groupLevels)) return;
    const nextLevel = (property.buildingLevel + 1) as 1 | 2 | 3 | 4 | 5;
    const cost = tile.developmentCost ?? 0;
    if (team.coins < cost) return;
    const updatedTeam = { ...team, coins: team.coins - cost };
    const next = {
      ...game,
      teams: updateTeam(game, updatedTeam),
      properties: { ...game.properties, [property.tileId]: { ...property, buildingLevel: nextLevel } },
    };
    const newTax = getRent(game, tile, { ...property, buildingLevel: nextLevel });
    set({ game: finishAction(addLog(next, team.id, `Membangun ${BUILDING_NAMES[nextLevel]} di ${tile.name} seharga ${cost} koin. Pajak properti sekarang ${newTax} koin.`)) });
  },
  downgradeProperty: () => {
    const game = get().game;
    if (!game || game.status !== 'playing' || game.stage !== 'action' || game.activeQuestion || game.pendingBuy || game.pendingCard || game.pendingTileId === null) return;
    const team = currentTeam(game);
    const property = game.properties[game.pendingTileId];
    const tile = game.board[game.pendingTileId];
    if (!property || !tile || tile.type !== 'property' || !tile.groupId || property.ownerId !== team.id || property.buildingLevel <= 0) return;
    const groupProperties = game.board.filter(boardTile => boardTile.type === 'property' && boardTile.groupId === tile.groupId);
    if (!groupProperties.every(groupTile => game.properties[groupTile.id]?.ownerId === team.id)) return;
    const groupLevels = groupProperties.map(groupTile => game.properties[groupTile.id]?.buildingLevel ?? 0);
    if (property.buildingLevel !== Math.max(...groupLevels)) return;
    const nextLevel = (property.buildingLevel - 1) as 0 | 1 | 2 | 3 | 4;
    const refund = Math.floor((tile.developmentCost ?? 0) / 2);
    const updatedTeam = { ...team, coins: team.coins + refund };
    const next = {
      ...game,
      teams: updateTeam(game, updatedTeam),
      properties: { ...game.properties, [property.tileId]: { ...property, buildingLevel: nextLevel } },
    };
    const newTax = getRent(game, tile, { ...property, buildingLevel: nextLevel });
    set({ game: finishAction(addLog(next, team.id, `Menjual satu tingkat bangunan di ${tile.name}; menerima kembali ${refund} koin. Pajak properti sekarang ${newTax} koin.`)) });
  },
  useJailKey: () => {
    const game = get().game;
    if (!game || game.stage !== 'ready') return;
    const team = currentTeam(game);
    if (!team.jailed || team.inventory.jail_card < 1) return;
    const updatedTeam = { ...team, jailed: false, jailTurns: 0, inventory: { ...team.inventory, jail_card: team.inventory.jail_card - 1 } };
    const next = startTurnQuestion(addLog({ ...game, teams: updateTeam(game, updatedTeam) }, team.id, 'Menggunakan Kunci Bebas Penjara. Jawab kuis untuk melempar dadu.'));
    set({ game: next });
  },
  useRentShield: () => {
    const game = get().game;
    if (!game || game.stage !== 'action' || game.questionPurpose !== 'rent') return;
    const team = currentTeam(game);
    if (team.inventory.rent_shield < 1) return;
    const updatedTeam = { ...team, inventory: { ...team.inventory, rent_shield: team.inventory.rent_shield - 1 } };
    const next = {
      ...game,
      teams: updateTeam(game, updatedTeam),
      lastAnswer: null,
    };
    set({ game: finishAction(addLog(next, team.id, `Menggunakan Perisai Sewa untuk membatalkan pajak properti ${game.pendingRent} koin.`)) });
  },
  useBonusCoin: () => {
    const game = get().game;
    if (!game || game.stage !== 'action' || game.questionPurpose !== 'turn' || game.status !== 'playing') return;
    const team = currentTeam(game);
    if (team.inventory.bonus_coin < 1) return;
    const updatedTeam = {
      ...team,
      coins: team.coins + 25,
      inventory: { ...team.inventory, bonus_coin: team.inventory.bonus_coin - 1 },
    };
    const next = { ...game, teams: updateTeam(game, updatedTeam) };
    set({ game: addLog(next, team.id, 'Menggunakan Koin Bonus dan mendapat 25 koin.') });
  },
  useTakeoverCard: () => {
    const game = get().game;
    if (!game || game.stage !== 'action' || game.pendingTileId === null || game.questionPurpose !== 'rent') return;
    const team = currentTeam(game);
    if (team.inventory.takeover_card < 1) return;
    const property = game.properties[game.pendingTileId];
    if (!property || property.buildingLevel >= 5) return;
    const question = randomQuestion(game.usedQuestionIds, game.subjects);
    const updatedTeam = { ...team, inventory: { ...team.inventory, takeover_card: team.inventory.takeover_card - 1 } };
    const next = {
      ...game,
      teams: updateTeam(game, updatedTeam),
      activeQuestion: question,
      questionPurpose: 'takeover' as const,
      usedQuestionIds: [...game.usedQuestionIds, question.id],
    };
    set({ game: addLog(next, team.id, `Menggunakan Kartu Pengambilalihan untuk menantang kuis di ${game.board[game.pendingTileId].name}.`) });
  },
  takeoverProperty: () => {
    const game = get().game;
    if (!game || game.status !== 'playing' || game.stage !== 'action' || game.activeQuestion || game.pendingBuy || game.pendingCard || game.pendingTileId === null || !game.pendingTakeoverOwner) return;
    const team = currentTeam(game);
    const property = game.properties[game.pendingTileId];
    const tile = game.board[game.pendingTileId];
    const price = (tile.price ?? 0) * 2;
    if (!property || property.ownerId !== game.pendingTakeoverOwner || property.ownerId === team.id || property.buildingLevel >= 5 || team.coins < price) return;

    const ownerId = property.ownerId;
    const updatedTeam = { ...team, coins: team.coins - price, properties: [...team.properties, property.tileId] };
    const next = {
      ...game,
      teams: updateTeam(game, updatedTeam).map(other => other.id === ownerId
        ? { ...other, ...receiveIncome(other, price), properties: other.properties.filter(id => id !== property.tileId) }
        : other),
      properties: { ...game.properties, [property.tileId]: { ...property, ownerId: team.id } },
    };
    set({ game: finishAction(addLog(next, team.id, `Mengambil alih ${tile.name} dengan membayar ${price} koin (2x harga properti).`)) });
  },
  finishTurn: () => {
    const game = get().game;
    if (!game || game.status !== 'playing' || game.stage !== 'done') return;
    const team = currentTeam(game);
    const activeTeams = game.teams.filter(candidate => !candidate.bankrupt);
    if (activeTeams.length <= 1) {
      set({ game: { ...game, status: 'finished', winnerId: activeTeams[0]?.id ?? null, stage: 'done' } });
      return;
    }
    const repeatTurn = game.extraTurn && !team.jailed && !team.bankrupt;
    let nextIndex = game.currentIndex;
    if (!repeatTurn) {
      for (let offset = 1; offset <= game.order.length; offset++) {
        const candidateIndex = (game.currentIndex + offset) % game.order.length;
        const candidate = game.teams.find(candidateTeam => candidateTeam.id === game.order[candidateIndex]);
        if (candidate && !candidate.bankrupt) {
          nextIndex = candidateIndex;
          break;
        }
      }
    }
    const completedRounds = game.completedRounds + (!repeatTurn && nextIndex <= game.currentIndex ? 1 : 0);
    const next = settle({
      ...game,
      currentIndex: nextIndex,
      completedRounds,
      stage: 'ready',
      hasRolled: false,
      diceResult: null,
      bonusDiceResult: null,
      diceTotal: null,
      extraTurn: false,
      consecutiveDoubles: repeatTurn ? game.consecutiveDoubles : 0,
      movementStartPosition: null,
      movementRemaining: 0,
      pendingTileId: null,
      pendingTakeoverOwner: null,
      pendingCard: null,
      lastAnswer: null,
    });
    set({ game: next.status === 'playing' && !currentTeam(next).jailed ? startTurnQuestion(next) : next });
  },
  tickTime: () => {
    const game = get().game;
    if (!game || game.status !== 'playing' || game.stage === 'rescue' || game.duration.type !== 'time' || game.timeRemaining === null) return;
    const remaining = Math.max(0, game.timeRemaining - 1);
    set({ game: settle({ ...game, timeRemaining: remaining }) });
  },
}), {
  name: 'monopoli-petualang',
  partialize: state => ({ board: state.board, rules: state.rules, game: state.game }),
  version: 8,
  migrate: persistedState => {
    const persisted = persistedState as Partial<MonopolyStore>;
    const savedBoard = persisted.board;
    const board = enforceBoardEconomyMinimum(
      Array.isArray(savedBoard) && savedBoard.length === MONOPOLY_BOARD.length && savedBoard[0]?.type === 'go'
        ? savedBoard
        : MONOPOLY_BOARD,
    );
    const rules = { ...DEFAULT_RULES, ...persisted.rules };
    rules.startingCash = Math.max(MINIMUM_PROPERTY_ECONOMY, rules.startingCash);
    return {
      board,
      rules,
      game: restoreGame(persisted.game, board, rules),
    } as MonopolyStore;
  },
}));

export const monopolyBuildingName = (level: number): string => BUILDING_NAMES[level] ?? BUILDING_NAMES[0];
