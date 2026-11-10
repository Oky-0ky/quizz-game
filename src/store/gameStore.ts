import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GameState, Team, TeamMember, Question, AdventurePathId,
  GameSettings, GamePhase, Notification, Duel,
  SurpriseCard, InventoryItem, DEFAULT_SETTINGS, Achievement, ActiveEffect, TurnHistory,
  MysteryBoxPrize, MysteryBoxPrizeWeights,
} from '@/types/game';
import { SHOP_ITEMS, QUESTION_BANK, RANDOM_EVENTS, MISSIONS_DATA, SURPRISE_CARDS, getQuestionsBySubjects } from '@/data/gameData';
import { generateBoard } from '@/utils/boardGenerator';
import { soundManager } from '@/utils/sound';
import { v4 as uuidv4 } from 'uuid';

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** Normalisasi jawaban isian: huruf kecil, tanpa spasi/tanda baca berlebih */
function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s.,;:!?'"()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function chooseMysteryBoxPrize(weights: MysteryBoxPrizeWeights): MysteryBoxPrize {
  const prizes = Object.keys(weights) as MysteryBoxPrize[];
  const safeWeights = prizes.map(prize => Math.max(0, Number.isFinite(weights[prize]) ? weights[prize] : 0));
  const totalWeight = safeWeights.reduce((total, weight) => total + weight, 0);
  if (totalWeight === 0) {
    return prizes[Math.floor(Math.random() * prizes.length)];
  }

  let roll = Math.random() * totalWeight;
  for (let index = 0; index < prizes.length; index++) {
    roll -= safeWeights[index];
    if (roll < 0) return prizes[index];
  }
  return prizes[prizes.length - 1];
}

/**
 * Cek jawaban. Soal pilihan ganda memakai perbandingan persis;
 * soal isian singkat (tanpa pilihan) memberi toleransi format & salah ketik kecil.
 */
export function isAnswerCorrect(answer: string, question: Question): boolean {
  const given = normalizeAnswer(answer);
  const expected = normalizeAnswer(question.correctAnswer);
  if (!given) return false;
  if (given === expected) return true;
  if (question.options && question.options.length > 0) return false;
  // Isian singkat: terima jawaban yang hanya beda spasi/tanda baca
  const compact = (s: string) => s.replace(/\s+/g, '');
  return compact(given) === compact(expected);
}

function createTileQuestionIds(totalTiles: number, questionBank: Question[] = QUESTION_BANK): Record<number, string> {
  const shuffledQuestions = [...(questionBank && questionBank.length > 0 ? questionBank : QUESTION_BANK)];
  for (let index = shuffledQuestions.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledQuestions[index], shuffledQuestions[swapIndex]] = [shuffledQuestions[swapIndex], shuffledQuestions[index]];
  }
  const shuffledIds = shuffledQuestions.map(question => question.id);

  return Object.fromEntries(
    Array.from({ length: totalTiles }, (_, index) => [
      index + 1,
      shuffledIds[index % shuffledIds.length],
    ])
  );
}

function normalizeBoardSettings(settings: GameSettings): GameSettings {
  const isAdventure = settings.boardMapId === 'adventure';
  const totalTiles = isAdventure
    ? 30
    : Math.min(100, Math.max(20, Math.floor(settings.totalTiles)));
  const specialTilePositions: Record<number, GameSettings['specialTilePositions'][number]> = {};

  for (const [position, type] of Object.entries(settings.specialTilePositions)) {
    const tilePosition = Number(position);
    if (
      Number.isInteger(tilePosition) &&
      tilePosition > 1 &&
      tilePosition < totalTiles &&
      type !== 'start' &&
      type !== 'finish'
    ) {
      specialTilePositions[tilePosition] = type;
    }
  }

  specialTilePositions[1] = 'start';
  specialTilePositions[totalTiles] = 'finish';

  return { ...settings, totalTiles, specialTilePositions };
}

type SavedBoardSettings = Pick<
  GameSettings,
  'totalTiles' | 'boardMapId' | 'adventurePathId' | 'specialTilePositions'
>;

function getSavedBoardSettings(settings: GameSettings): SavedBoardSettings {
  return {
    totalTiles: settings.totalTiles,
    boardMapId: settings.boardMapId,
    adventurePathId: settings.adventurePathId,
    specialTilePositions: { ...settings.specialTilePositions },
  };
}

function chooseQuestionForTile(
  tileQuestionIds: Record<number, string>,
  usedQuestionIds: string[],
  tilePosition: number,
  questionBank: Question[] = QUESTION_BANK
): { question: Question; tileQuestionIds: Record<number, string>; usedQuestionIds: string[] } {
  const bank = questionBank && questionBank.length > 0 ? questionBank : QUESTION_BANK;
  const unusedQuestions = bank.filter(question => !usedQuestionIds.includes(question.id));
  const questionPool = unusedQuestions.length > 0 ? unusedQuestions : bank;
  const assignedQuestion = questionPool.find(question => question.id === tileQuestionIds[tilePosition]);
  const question = assignedQuestion || questionPool[Math.floor(Math.random() * questionPool.length)];
  const nextUsedQuestionIds = unusedQuestions.length > 0
    ? [...usedQuestionIds, question.id]
    : [question.id];

  return {
    question,
    tileQuestionIds: { ...tileQuestionIds, [tilePosition]: question.id },
    usedQuestionIds: nextUsedQuestionIds,
  };
}

function addItemToInventory(team: Team, itemId: string): Team {
  const item = SHOP_ITEMS.find(shopItem => shopItem.id === itemId);
  if (!item) return team;

  const existingItem = team.inventory.find(inventoryItem => inventoryItem.itemId === itemId);
  const inventory: InventoryItem[] = existingItem
    ? team.inventory.map(inventoryItem =>
        inventoryItem.itemId === itemId
          ? { ...inventoryItem, quantity: inventoryItem.quantity + 1 }
          : inventoryItem
      )
    : [...team.inventory, { id: uuidv4(), itemId, item, quantity: 1, usedCount: 0 }];

  return { ...team, inventory };
}

function addTeamHistory(team: Team, game: GameState, entry: Partial<TurnHistory> & Pick<TurnHistory, 'events'>): Team {
  const historyEntry: TurnHistory = {
    turnNumber: game.currentTurn,
    teamId: team.id,
    teamName: team.name,
    coinsEarned: 0,
    coinsChange: 0,
    tilesMovedForward: 0,
    tilesMovedBackward: 0,
    itemsUsed: [],
    timestamp: Date.now(),
    ...entry,
  };
  return { ...team, history: [...team.history, historyEntry] };
}

function createInitialTeam(name: string, color: string, avatarEmoji: string, members: { name: string; avatarEmoji: string }[], pathId?: AdventurePathId): Team {
  return {
    id: uuidv4(),
    name,
    color,
    avatarEmoji,
    pathId,
    members: members.map((m, i) => ({
      id: uuidv4(),
      name: m.name,
      avatarEmoji: m.avatarEmoji,
      isCurrentSpeaker: i === 0,
    })),
    position: 1,
    claimedRewardTiles: [],
    coins: 30, // Start with some adventure coins to try the shop!
    score: 0,
    inventory: [],
    cards: [],
    history: [],
    correctAnswers: 0,
    duelWins: 0,
    isProtected: false,
    protectionTurns: 0,
    skipTurns: 0,
    missions: MISSIONS_DATA.map(m => ({ missionId: m.id, mission: m, progress: 0, isCompleted: false })),
    activeEffects: [],
    consecutiveCorrect: 0,
    currentSpeakerIndex: 0,
    hasFinished: false,
  };
}

interface GameStore {
  game: GameState | null;
  isAdmin: boolean;
  savedBoardSettings: SavedBoardSettings;

  // Shop & Modals UI state
  isShopOpen: boolean;
  activeShopTeamId?: string;
  openShop: (teamId?: string) => void;
  closeShop: () => void;
  isInventoryOpen: boolean;
  activeInventoryTeamId?: string;
  openInventory: (teamId?: string) => void;
  closeInventory: () => void;
  activeCardDrawn?: { card: SurpriseCard; team: Team } | null;
  closeCardModal: () => void;
  
  // Setup actions
  startNewGame: (name: string, teamsData: Array<{ name: string; color: string; avatar: string; pathId?: AdventurePathId; members: Array<{ name: string; avatarEmoji: string }> }>, customSettings?: Partial<GameSettings>) => void;
  createGame: (name: string) => void;
  addTeam: (name: string, color: string, avatarEmoji: string, members: { name: string; avatarEmoji: string }[], pathId?: AdventurePathId) => void;
  removeTeam: (teamId: string) => void;
  updateTeamName: (teamId: string, name: string) => void;
  addMember: (teamId: string, name: string, avatarEmoji: string) => void;
  removeMember: (teamId: string, memberId: string) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  
  // Game flow
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  setPhase: (phase: GamePhase) => void;
  
  // Turn actions
  startTurn: () => void;
  submitAnswer: (answer: string, timeLeft: number) => void;
  rollDice: () => void;
  movePion: (teamId: string, steps: number) => void;
  applyTileEffect: (teamId: string, tilePosition: number) => void;
  revealMysteryBoxPrize: () => void;
  claimMysteryBoxItem: (itemId: string) => boolean;
  stealMysteryBoxReward: (targetTeamId: string) => boolean;
  finishMysteryBox: () => void;
  claimTrapCoins: (targetTeamId?: string) => boolean;
  applyHokiMbgPenalty: (targetTeamId?: string) => boolean;
  claimFreeShopTileItem: (itemId: string) => boolean;
  endTurn: () => void;
  
  // Shop & Items
  buyItem: (teamId: string, itemId: string) => boolean;
  useItem: (teamId: string, itemId: string, targetTeamId?: string) => boolean;
  useCard: (teamId: string, cardId: string, targetTeamId?: string) => boolean;
  drawSurpriseCard: (teamId: string) => SurpriseCard | null;
  consumeCompass: (teamId: string) => boolean;
  useChanceCardRetry: (teamId: string) => boolean;
  useHintInQuestion: (teamId: string, question: Question) => string[];
  activateProtection: (teamId: string, charges: number) => void;
  consumeProtection: (teamId: string, fallbackItemId?: string) => 'protection' | 'item' | null;
  
  
  // Duel
  startDuel: (challengerTeamId: string, defendingTeamId: string, stakes: Duel['stakes']) => void;
  submitDuelAnswer: (teamId: string, answer: string, time: number) => void;
  resolveDuel: () => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  
  // Utility
  getCurrentTeam: () => Team | null;
  getTeamById: (teamId: string) => Team | null;
  getLeaderboard: () => Team[];
  checkMissions: (teamId: string) => void;
  triggerRandomEvent: () => void;
  computeAchievements: () => Achievement[];
  skipTurn: (teamId: string) => void;
  adjustTeamCoins: (teamId: string, amount: number) => void;
  adjustTeamPosition: (teamId: string, newPosition: number) => void;
  adjustTeamEffects: (teamId: string, effects: ActiveEffect[]) => void;
}

export const useGameStore = create<GameStore>()(persist((set, get) => ({
  game: null,
  isAdmin: true,
  savedBoardSettings: getSavedBoardSettings(DEFAULT_SETTINGS),

  isShopOpen: false,
  activeShopTeamId: undefined,
  openShop: (teamId?: string) => {
    const { game } = get();
    const activeId = teamId || (game?.teams[game.currentTeamIndex]?.id);
    set({ isShopOpen: true, activeShopTeamId: activeId });
  },
  closeShop: () => {
    const game = get().game;
    if (!game?.pendingShopTile) {
      set({ isShopOpen: false, activeShopTeamId: undefined });
      return;
    }

    set({
      isShopOpen: false,
      activeShopTeamId: undefined,
      game: { ...game, pendingShopTile: undefined },
    });
    get().endTurn();
  },

  isInventoryOpen: false,
  activeInventoryTeamId: undefined,
  openInventory: (teamId?: string) => {
    const { game } = get();
    const activeId = teamId || (game?.teams[game.currentTeamIndex]?.id);
    set({ isInventoryOpen: true, activeInventoryTeamId: activeId });
  },
  closeInventory: () => set({ isInventoryOpen: false }),

  activeCardDrawn: null,
  closeCardModal: () => set({ activeCardDrawn: null }),

  startNewGame: (name, teamsData, customSettings) => {
    const settings = normalizeBoardSettings({
      ...DEFAULT_SETTINGS,
      ...get().savedBoardSettings,
      ...customSettings,
    });
    const board = generateBoard(
      settings.totalTiles,
      settings.specialTilePositions,
      settings.boardMapId,
      settings.adventurePathId
    );
    const PATH_CYCLE: AdventurePathId[] = ['hutan', 'sungai', 'kota'];
    const teams = teamsData.map((t, i) =>
      createInitialTeam(
        t.name,
        t.color,
        t.avatar,
        t.members,
        t.pathId || PATH_CYCLE[i % PATH_CYCLE.length]
      )
    );
    // Restore shop stock so a new game after "Main Lagi" starts fully stocked.
    const newGame: GameState = {
      id: uuidv4(),
      roomCode: generateRoomCode(),
      name,
      phase: 'playing',
      settings,
      teams,
      currentTeamIndex: 0,
      currentTurn: 1,
      board,
      adminId: 'local-admin',
      turnTimeLeft: settings.questionTimeLimit,
      finalChallengeProgress: {},
      shopItems: SHOP_ITEMS.map(item => ({ ...item, currentStock: item.maxStock })),
      questions: getQuestionsBySubjects(settings.subjects),
      tileQuestionIds: createTileQuestionIds(settings.totalTiles, getQuestionsBySubjects(settings.subjects)),
      activeQuestionIsBonus: false,
      randomEvents: RANDOM_EVENTS,
      missions: MISSIONS_DATA,
      usedQuestionIds: [],
      notifications: [{
        id: uuidv4(),
        type: 'success',
        title: '🎮 Permainan Dimulai!',
        message: `Giliran pertama: ${teams[0]?.name || 'Kelompok 1'}`,
        emoji: '🚀',
        duration: 4000,
        timestamp: Date.now(),
      }],
      startedAt: Date.now(),
    };
    set({ game: newGame, isAdmin: true, savedBoardSettings: getSavedBoardSettings(settings) });
  },

  createGame: (name: string) => {
    const board = generateBoard(
      DEFAULT_SETTINGS.totalTiles,
      DEFAULT_SETTINGS.specialTilePositions,
      DEFAULT_SETTINGS.boardMapId,
      DEFAULT_SETTINGS.adventurePathId
    );
    const newGame: GameState = {
      id: uuidv4(),
      roomCode: generateRoomCode(),
      name,
      phase: 'lobby',
      settings: { ...DEFAULT_SETTINGS },
      teams: [],
      currentTeamIndex: 0,
      currentTurn: 0,
      board,
      adminId: 'local-admin',
      turnTimeLeft: DEFAULT_SETTINGS.questionTimeLimit,
      finalChallengeProgress: {},
      shopItems: SHOP_ITEMS.map(item => ({ ...item, currentStock: item.maxStock })),
      questions: getQuestionsBySubjects(DEFAULT_SETTINGS.subjects),
      tileQuestionIds: createTileQuestionIds(DEFAULT_SETTINGS.totalTiles),
      activeQuestionIsBonus: false,
      randomEvents: RANDOM_EVENTS,
      missions: MISSIONS_DATA,
      usedQuestionIds: [],
      notifications: [],
    };
    set({ game: newGame, isAdmin: true });
  },

  addTeam: (name, color, avatarEmoji, members, pathId) => {
    const { game } = get();
    if (!game || game.teams.length >= game.settings.maxTeams) return;
    const PATH_CYCLE: AdventurePathId[] = ['hutan', 'sungai', 'kota'];
    const assignedPath = pathId || PATH_CYCLE[game.teams.length % PATH_CYCLE.length];
    const newTeam = createInitialTeam(name, color, avatarEmoji, members, assignedPath);
    set({ game: { ...game, teams: [...game.teams, newTeam] } });
  },

  removeTeam: (teamId) => {
    const { game } = get();
    if (!game) return;
    set({ game: { ...game, teams: game.teams.filter(t => t.id !== teamId) } });
  },

  updateTeamName: (teamId, name) => {
    const { game } = get();
    if (!game) return;
    set({
      game: {
        ...game,
        teams: game.teams.map(t => t.id === teamId ? { ...t, name } : t),
      },
    });
  },

  addMember: (teamId, name, avatarEmoji) => {
    const { game } = get();
    if (!game) return;
    const newMember: TeamMember = { id: uuidv4(), name, avatarEmoji, isCurrentSpeaker: false };
    set({
      game: {
        ...game,
        teams: game.teams.map(t =>
          t.id === teamId && t.members.length < game.settings.membersPerTeam
            ? { ...t, members: [...t.members, newMember] }
            : t
        ),
      },
    });
  },

  removeMember: (teamId, memberId) => {
    const { game } = get();
    if (!game) return;
    set({
      game: {
        ...game,
        teams: game.teams.map(t =>
          t.id === teamId
            ? { ...t, members: t.members.filter(m => m.id !== memberId) }
            : t
        ),
      },
    });
  },

  updateSettings: (settings) => {
    const { game } = get();
    if (!game) return;
    const newSettings = normalizeBoardSettings({
      ...game.settings,
      ...settings,
    });
    const board = generateBoard(
      newSettings.totalTiles,
      newSettings.specialTilePositions,
      newSettings.boardMapId,
      newSettings.adventurePathId
    );
    const questions = getQuestionsBySubjects(newSettings.subjects);
    const subjectsChanged = newSettings.subjects.join(',') !== game.settings.subjects.join(',');
    const tileQuestionIds = subjectsChanged
      ? createTileQuestionIds(newSettings.totalTiles, questions)
      : Object.fromEntries(
          Object.entries(game.tileQuestionIds).filter(([position]) => Number(position) <= newSettings.totalTiles)
        );
    for (let position = 1; position <= newSettings.totalTiles; position++) {
      if (!tileQuestionIds[position]) {
        tileQuestionIds[position] = questions[(position - 1) % questions.length].id;
      }
    }
    const teams = game.teams.map(team => ({
      ...team,
      position: Math.min(team.position, newSettings.totalTiles),
      ...(settings.adventurePathId !== undefined && newSettings.boardMapId === 'adventure'
        ? { pathId: newSettings.adventurePathId }
        : {}),
    }));
    set({
      game: { ...game, settings: newSettings, board, questions, tileQuestionIds, teams },
      savedBoardSettings: getSavedBoardSettings(newSettings),
    });
  },

  startGame: () => {
    const { game } = get();
    if (!game || game.teams.length === 0) return;
    // Reset all teams to starting position
    const teams = game.teams.map(t => ({
      ...t,
      position: 1,
      claimedRewardTiles: [],
      coins: 0,
      score: 0,
      inventory: [],
      cards: [],
      history: [],
      correctAnswers: 0,
      duelWins: 0,
      isProtected: false,
      protectionTurns: 0,
      skipTurns: 0,
      consecutiveCorrect: 0,
      hasFinished: false,
      activeEffects: [],
    }));
    set({
      game: {
        ...game,
        phase: 'playing',
        teams,
        currentTeamIndex: 0,
        currentTurn: 1,
        startedAt: Date.now(),
        usedQuestionIds: [],
        tileQuestionIds: createTileQuestionIds(game.settings.totalTiles, game.questions),
        activeQuestionIsBonus: false,
      },
    });
    get().addNotification({ type: 'success', title: '🎮 Permainan Dimulai!', message: `Giliran pertama: ${teams[0].name}`, emoji: '🚀' });
  },

  pauseGame: () => {
    const { game } = get();
    if (!game) return;
    set({ game: { ...game, phase: 'paused' } });
  },

  resumeGame: () => {
    const { game } = get();
    if (!game) return;
    set({ game: { ...game, phase: 'playing' } });
  },

  endGame: () => {
    const { game } = get();
    if (!game) return;
    set({ game: { ...game, phase: 'finished', endedAt: Date.now() } });
  },

  setPhase: (phase) => {
    const { game } = get();
    if (!game) return;
    set({ game: { ...game, phase } });
  },

  startTurn: () => {
    const { game } = get();
    if (!game || game.phase !== 'playing' || game.questionAnswerSubmitted || game.activeQuestion) return;
    const currentTeam = game.teams[game.currentTeamIndex];
    
    // Skip if team has skipTurns
    if (currentTeam.skipTurns > 0) {
      const teams = game.teams.map(t =>
        t.id === currentTeam.id ? { ...t, skipTurns: t.skipTurns - 1 } : t
      );
      get().addNotification({ type: 'warning', title: `⏭️ ${currentTeam.name} Melewati Giliran`, message: `Sisa giliran dilewati: ${currentTeam.skipTurns - 1}` });
      set({ game: { ...game, teams } });
      get().endTurn();
      return;
    }
    
    // Check for random event
    if (game.settings.enableRandomEvents && Math.random() < game.settings.randomEventChance) {
      get().triggerRandomEvent();
    }

    const latestGame = get().game;
    if (!latestGame) return;
    const latestTeam = latestGame.teams[latestGame.currentTeamIndex];
    if (!latestTeam) return;
    const selected = chooseQuestionForTile(
      latestGame.tileQuestionIds,
      latestGame.usedQuestionIds,
      latestTeam.position,
      latestGame.questions
    );
    const isBonusQuestion = latestTeam.activeEffects.some(
      effect => effect.type === 'extra_questions_before_move' && (effect.value || 0) > 0
    );
    
    set({
      game: {
        ...latestGame,
        phase: 'question',
        activeQuestion: selected.question,
        activeQuestionIsBonus: isBonusQuestion,
        questionAnswerSubmitted: false,
        eliminatedOptions: [],
        turnTimeLeft: selected.question.timeLimit,
        questionAnsweredCorrectly: undefined,
        tileQuestionIds: selected.tileQuestionIds,
        usedQuestionIds: selected.usedQuestionIds,
      },
    });
  },

  submitAnswer: (answer: string, timeLeft: number) => {
    const { game } = get();
    if (!game || !game.activeQuestion || game.phase !== 'question' || game.questionAnswerSubmitted) return;
    
    const question = game.activeQuestion;
    const isCorrect = isAnswerCorrect(answer, question);
    const currentTeam = game.teams[game.currentTeamIndex];
    if (!currentTeam) return;
    const wasUnanswered = !answer.trim() || timeLeft <= 0;

    if (game.activeQuestionIsBonus) {
      const currentEffect = currentTeam.activeEffects.find(
        effect => effect.type === 'extra_questions_before_move' && (effect.value || 0) > 0
      );
      const remainingQuestions = Math.max(0, (currentEffect?.value || 1) - 1);
      const fixedCoinsEffect = currentTeam.activeEffects.find(effect => effect.type === 'fixed_coins_next');
      const coinsEarned = isCorrect ? (fixedCoinsEffect?.value || 0) : 0;
      // Penalti gagal soal tambahan (dari item Soal Kejutan / Ujian Berat):
      // jika jawaban salah pada soal terakhir dari efek tersebut, poin & koin target dipotong.
      const isLastBonusQuestion = remainingQuestions === 0 && !isCorrect;
      const penaltyPoints = isLastBonusQuestion ? Math.max(0, currentEffect?.points || 0) : 0;
      const penaltyCoins = isLastBonusQuestion ? Math.max(0, currentEffect?.coins || 0) : 0;
      const updatedTeams = game.teams.map(team => team.id !== currentTeam.id ? team : {
        ...team,
        coins: Math.max(0, team.coins + coinsEarned - penaltyCoins),
        score: Math.max(0, team.score - penaltyPoints),
        activeEffects: team.activeEffects
          .map(effect => effect.id === currentEffect?.id
            ? { ...effect, value: remainingQuestions }
            : effect)
          .filter(effect =>
            (effect.id !== currentEffect?.id || remainingQuestions > 0)
            && (effect.id !== fixedCoinsEffect?.id || !isCorrect)
          ),
        history: [...team.history, {
          turnNumber: game.currentTurn,
          teamId: team.id,
          teamName: team.name,
          questionId: question.id,
          questionText: question.text,
          tilePosition: team.position,
          isCorrect,
          coinsEarned,
          coinsChange: coinsEarned,
          tilesMovedForward: 0,
          tilesMovedBackward: 0,
          itemsUsed: [],
          events: [
            `Soal tambahan dijawab ${isCorrect ? 'benar' : 'salah'}.`,
            ...(isLastBonusQuestion && (penaltyPoints > 0 || penaltyCoins > 0)
              ? [`Gagal soal tambahan terakhir: -${penaltyPoints} poin dan -${penaltyCoins} koin.`]
              : []),
          ],
          timestamp: Date.now(),
        }],
      });
      const selected = chooseQuestionForTile(
        game.tileQuestionIds,
        game.usedQuestionIds,
        currentTeam.position,
        game.questions
      );
      set({
        game: {
          ...game,
          teams: updatedTeams,
          phase: 'question',
          activeQuestion: selected.question,
          activeQuestionIsBonus: remainingQuestions > 0,
          questionAnswerSubmitted: false,
          questionAnsweredCorrectly: undefined,
          eliminatedOptions: [],
          turnTimeLeft: selected.question.timeLimit,
          tileQuestionIds: selected.tileQuestionIds,
          usedQuestionIds: selected.usedQuestionIds,
        },
      });
      get().addNotification({
        type: isCorrect ? 'success' : 'warning',
        title: isCorrect ? '✅ Soal Tambahan Benar!' : '📝 Soal Tambahan Salah',
        message: remainingQuestions > 0
          ? `Tersisa ${remainingQuestions} soal tambahan untuk ${currentTeam.name}.${coinsEarned ? ` +${coinsEarned} koin.` : ''}`
          : `Soal tambahan selesai. Giliran ${currentTeam.name} berlanjut.${coinsEarned ? ` +${coinsEarned} koin.` : ''}${isLastBonusQuestion && (penaltyPoints > 0 || penaltyCoins > 0) ? ` Penalti gagal: -${penaltyPoints} poin, -${penaltyCoins} koin.` : ''}`,
        emoji: isCorrect ? '✅' : '📝',
      });
      return;
    }

    const startingPosition = currentTeam.position;
    const antiBackShield = currentTeam.inventory.find(
      inventoryItem => inventoryItem.itemId === 'anti_back_shield' && inventoryItem.quantity > 0
    );
    const activeAntiBackShield = currentTeam.activeEffects.find(
      effect => effect.type === 'anti_back_shield' && (effect.value || 0) > 0
    );
    const existingProtection = currentTeam.isProtected && currentTeam.protectionTurns > 0;
    const shieldUsed = !isCorrect && Boolean(antiBackShield || activeAntiBackShield || existingProtection);
    // Jebakan Langkah hanya memengaruhi tim yang ditandai sebagai target.
    const stepShieldOwner = isCorrect
      ? game.teams.find(team =>
          team.id !== currentTeam.id
          && team.activeEffects.some(effect =>
            effect.type === 'protect_steps'
            && (effect.value || 0) > 0
            && effect.sourceTeamId === currentTeam.id
          )
        )
      : undefined;
    const activeStepShield = stepShieldOwner?.activeEffects.find(
      effect => effect.type === 'protect_steps' && (effect.value || 0) > 0
    );
    const stepShieldUsed = Boolean(activeStepShield);
    const stepsToMove = isCorrect ? (stepShieldUsed ? 0 : 1) : shieldUsed ? 0 : -1;
    // Saat perisai aktif, poin & koin yang seharusnya didapat hangus (tidak diberikan).
    const forfeitRewards = stepShieldUsed;

    let coinsEarned = 0;
    let rewardCoins = 0;
    let rewardLabel: string | undefined;
    let rewardItemId: string | undefined;
    const shouldClaimReward = isCorrect
      && startingPosition % 3 === 0
      && startingPosition < game.settings.totalTiles
      && !currentTeam.claimedRewardTiles.includes(startingPosition);

    if (isCorrect && !forfeitRewards) {
      coinsEarned = question.coinsReward;
      if (timeLeft > question.timeLimit * 0.6) {
        coinsEarned += game.settings.coinRewards.correctFast;
      }
      const fixedCoinsEffect = currentTeam.activeEffects.find(effect => effect.type === 'fixed_coins_next');
      if (fixedCoinsEffect) {
        coinsEarned = fixedCoinsEffect.value || 100;
      } else if (currentTeam.activeEffects.some(effect =>
        effect.type === 'double_coins_next' || effect.type === 'double_score_next'
      )) {
        coinsEarned *= 2;
      }

      if (shouldClaimReward) {
        const rewardRoll = Math.floor(Math.random() * 5);
        const rewardType = rewardRoll === 4 ? Math.floor(Math.random() * 4) : rewardRoll;
        if (rewardType === 0) {
          rewardCoins = 10;
          rewardLabel = rewardRoll === 4 ? 'Kotak Misteri: 10 koin' : '10 koin';
        } else if (rewardType === 1) {
          rewardItemId = 'speed_boots';
          rewardLabel = `${rewardRoll === 4 ? 'Kotak Misteri: ' : ''}Sepatu Kilat`;
        } else if (rewardType === 2) {
          rewardItemId = 'adventurer_rocket';
          rewardLabel = `${rewardRoll === 4 ? 'Kotak Misteri: ' : ''}Roket Petualang`;
        } else {
          rewardItemId = 'anti_back_shield';
          rewardLabel = `${rewardRoll === 4 ? 'Kotak Misteri: ' : ''}Tameng Anti Mundur`;
        }
      }
    }

    const actualPosition = Math.min(
      Math.max(1, startingPosition + stepsToMove),
      game.settings.totalTiles
    );
    const answerEvents = [
      isCorrect ? 'Jawaban benar.' : wasUnanswered ? 'Waktu habis tanpa jawaban.' : 'Jawaban salah.',
      ...(shieldUsed ? ['Tameng Anti Mundur digunakan; posisi tetap.'] : []),
      ...(stepShieldUsed ? ['Jebakan Langkah: tidak maju, poin & koin jawaban benar hangus.'] : []),
      ...(rewardLabel ? [`Hadiah kotak ${startingPosition}: ${rewardLabel}.`] : []),
    ];
    const updatedTeams = game.teams.map(team => {
      if (team.id !== currentTeam.id) {
        if (stepShieldUsed && team.id === stepShieldOwner?.id) {
          return {
            ...team,
            activeEffects: team.activeEffects
              .map(effect => effect.id === activeStepShield?.id
                ? { ...effect, value: (effect.value || 1) - 1 }
                : effect)
              .filter(effect => effect.id !== activeStepShield?.id || (effect.value || 0) > 0),
          };
        }
        return team;
      }
      const doubleScore = team.activeEffects.some(effect => effect.type === 'double_score_next');
      const answerScoreGain = isCorrect && !forfeitRewards ? question.coinsReward * (doubleScore ? 2 : 1) : 0;
      const answerCorrectCount = isCorrect && !forfeitRewards ? 1 : 0;
      const updatedEffects = team.activeEffects
        .map(effect => {
          if (shieldUsed && effect.id === activeAntiBackShield?.id) {
            return { ...effect, value: (effect.value || 1) - 1 };
          }
          if (
            effect.type === 'double_coins_next'
            || effect.type === 'double_score_next'
            || effect.type === 'fixed_coins_next'
            || effect.type === 'bonus_steps'
          ) {
            return isCorrect ? { ...effect, remainingTurns: 0 } : effect;
          }
          if (effect.type === 'retry_answer' && isCorrect) return { ...effect, remainingTurns: 0 };
          return effect;
        })
        .filter(effect =>
          effect.remainingTurns > 0
          && (effect.type !== 'anti_back_shield' || (effect.value || 0) > 0)
          && (effect.type !== 'protect_steps' || (effect.value || 0) > 0)
        );
      let updatedTeam: Team = {
        ...team,
        coins: team.coins + coinsEarned + rewardCoins,
        score: team.score + answerScoreGain,
        correctAnswers: team.correctAnswers + answerCorrectCount,
        consecutiveCorrect: answerCorrectCount > 0 ? team.consecutiveCorrect + 1 : 0,
        activeEffects: updatedEffects,
        claimedRewardTiles: shouldClaimReward
          ? [...team.claimedRewardTiles, startingPosition]
          : team.claimedRewardTiles,
      };
      if (shieldUsed && antiBackShield) {
        updatedTeam = {
          ...updatedTeam,
          inventory: updatedTeam.inventory
            .map(inventoryItem => inventoryItem.itemId === 'anti_back_shield'
              ? { ...inventoryItem, quantity: inventoryItem.quantity - 1, usedCount: inventoryItem.usedCount + 1 }
              : inventoryItem)
            .filter(inventoryItem => inventoryItem.quantity > 0),
        };
      } else if (shieldUsed && existingProtection) {
        const protectionTurns = Math.max(0, team.protectionTurns - 1);
        updatedTeam = { ...updatedTeam, isProtected: protectionTurns > 0, protectionTurns };
      }
      if (rewardItemId) updatedTeam = addItemToInventory(updatedTeam, rewardItemId);
      return {
        ...updatedTeam,
        history: [...team.history, {
          turnNumber: game.currentTurn,
          teamId: team.id,
          teamName: team.name,
          tilePosition: startingPosition,
          questionId: question.id,
          questionText: question.text,
          isCorrect,
          coinsEarned,
          coinsChange: coinsEarned + rewardCoins,
          tilesMovedForward: Math.max(0, actualPosition - startingPosition),
          tilesMovedBackward: Math.max(0, startingPosition - actualPosition),
          itemsUsed: shieldUsed && antiBackShield
            ? [antiBackShield.item.name]
            : shieldUsed && activeAntiBackShield
              ? ['Tameng Anti Mundur']
              : stepShieldUsed
                ? ['Jebakan Langkah']
                : [],
          events: answerEvents,
          reward: rewardLabel,
          timestamp: Date.now(),
        }],
      };
    });

    set({
      game: {
        ...game,
        teams: updatedTeams,
        phase: isCorrect && (game.settings.enableDice || game.settings.movementMode === 'dice')
          ? 'playing'
          : 'moving',
        questionAnswerSubmitted: true,
        questionAnsweredCorrectly: isCorrect,
      },
    });

    if (isCorrect) {
      get().addNotification({
        type: 'success',
        title: '✅ Jawaban Benar!',
        message: stepShieldUsed
          ? `Jebakan Langkah ${stepShieldOwner?.name}: jawaban benar, tapi tidak maju & poin/koin hangus.${rewardLabel ? ` Hadiah: ${rewardLabel}.` : ''}`
          : `+${coinsEarned} koin · maju 1 kotak.${rewardLabel ? ` Hadiah: ${rewardLabel}.` : ''}`,
        emoji: '🎉',
      });
      if (rewardItemId) {
        get().addNotification({
          type: 'success',
          title: '🎁 Hadiah Masuk Inventaris!',
          message: `${currentTeam.name} mendapatkan ${SHOP_ITEMS.find(item => item.id === rewardItemId)?.name}.`,
          emoji: '🎒',
        });
      }
      if (game.settings.enableDice || game.settings.movementMode === 'dice') {
        get().setPhase('playing');
      } else {
        setTimeout(() => get().movePion(currentTeam.id, 1), 500);
      }
    } else {
      get().addNotification({
        type: shieldUsed ? 'success' : 'error',
        title: shieldUsed
          ? '🛡️ Tameng Anti Mundur!'
          : wasUnanswered
            ? '⏰ Waktu Habis'
            : '❌ Jawaban Salah',
        message: shieldUsed
          ? `${currentTeam.name} tetap di kotak #${startingPosition}; tameng telah digunakan.`
          : `${wasUnanswered ? 'Tidak ada jawaban.' : question.explanation || `Jawaban benar: ${question.correctAnswer}`} Mundur 1 kotak.`,
        emoji: shieldUsed ? '🛡️' : wasUnanswered ? '⏰' : '😔',
      });
      if (stepsToMove < 0) {
        setTimeout(() => get().movePion(currentTeam.id, -1), 500);
      } else {
        setTimeout(() => get().endTurn(), 1200);
      }
    }

    get().checkMissions(currentTeam.id);
  },

  rollDice: () => {
    const { game } = get();
    if (
      !game ||
      game.phase !== 'playing' ||
      !game.questionAnsweredCorrectly ||
      game.questionAnswerSubmitted !== true ||
      game.diceResult !== undefined
    ) return;
    const diceResult = 1;
    set({ game: { ...game, diceResult, phase: 'moving' } });
    setTimeout(() => {
      const currentTeam = get().game?.teams[get().game?.currentTeamIndex || 0];
      if (currentTeam) get().movePion(currentTeam.id, 1);
    }, 1000);
  },

  movePion: (teamId: string, steps: number) => {
    const { game } = get();
    if (!game) return;
    
    const team = game.teams.find(t => t.id === teamId);
    if (!team) return;
    
    const newPosition = Math.min(
      Math.max(1, team.position + steps),
      Math.min(100, game.settings.totalTiles)
    );
    
    const updatedTeams = game.teams.map(t =>
      t.id === teamId ? { ...t, position: newPosition } : t
    );
    
    set({ game: { ...game, teams: updatedTeams, phase: 'tile_effect' } });

    if (steps < 0) {
      setTimeout(() => get().endTurn(), 800);
      return;
    }
    
    // Check if reached finish
    if (newPosition >= game.settings.totalTiles) {
      if (game.settings.enableFinalChallenge) {
        get().setPhase('final_challenge');
      } else {
        const finalTeams = get().game!.teams.map(t =>
          t.id === teamId ? { ...t, hasFinished: true, finishTime: Date.now() } : t
        );
        set({ game: { ...get().game!, teams: finalTeams, winner: teamId, phase: 'finished' } });
        get().addNotification({ type: 'success', title: '🏆 FINISH!', message: `${team.name} telah mencapai garis finish!`, emoji: '🎊' });
      }
      return;
    }
    
    // Apply tile effect
    setTimeout(() => get().applyTileEffect(teamId, newPosition), 800);
  },

  applyTileEffect: (teamId: string, tilePosition: number) => {
    const { game } = get();
    if (!game) return;
    
    const tile = game.board.find(t => t.position === tilePosition);
    const team = game.teams.find(t => t.id === teamId);
    if (!tile || !team) {
      setTimeout(() => get().endTurn(), 500);
      return;
    }
    
    // Helm Keberuntungan: traps only, and it is passive (no manual activation needed)
    const hasHelmet = team.activeEffects.some(e => e.type === 'protect_from_trap' && (e.value || 0) > 0);

    // Check if team is protected (Perisai / Kartu Kebal / Kotak Istirahat)
    if (tile.type === 'trap' || tile.type === 'tax') {
      const blockedBy = hasHelmet && tile.type === 'trap'
        ? 'helmet'
        : get().consumeProtection(teamId, tile.type === 'trap' ? 'rescue_card' : undefined);

      if (blockedBy) {
        soundManager.playCorrect();
        if (blockedBy === 'helmet') {
          const { game: g } = get();
          if (g) {
            const updatedTeams = g.teams.map(t => t.id !== teamId ? t : {
              ...t,
              activeEffects: t.activeEffects.map(e => {
                if (e.type !== 'protect_from_trap') return e;
                const value = (e.value || 0) - 1;
                return { ...e, value, remainingTurns: value > 0 ? e.remainingTurns : 0 };
              }).filter(e => e.remainingTurns > 0),
            });
            set({ game: { ...g, teams: updatedTeams } });
          }
          get().addNotification({ type: 'success', title: '⛑️ Helm Keberuntungan!', message: 'Jebakan berhasil dihindari berkat Helm Keberuntungan!', emoji: '⛑️' });
        } else if (blockedBy === 'item') {
          get().addNotification({ type: 'success', title: '💌 Kartu Penyelamat!', message: 'Efek negatif jebakan dibatalkan oleh Kartu Penyelamat!', emoji: '💌' });
        } else {
          get().addNotification({ type: 'info', title: '🛡️ Perlindungan Aktif!', message: 'Efek negatif dibatalkan oleh perlindungan!', emoji: '✨' });
        }
        setTimeout(() => get().endTurn(), 800);
        return;
      }
    }

    switch (tile.type) {
      case 'reward': {
        const latestGame = get().game;
        const latestTeam = latestGame?.teams.find(t => t.id === teamId);
        if (!latestGame || !latestTeam) {
          setTimeout(() => get().endTurn(), 500);
          break;
        }
        const rewardCoins = 100;
        const updatedTeamsReward = latestGame.teams.map(t => t.id !== teamId ? t : {
          ...t,
          coins: t.coins + rewardCoins,
          claimedRewardTiles: t.claimedRewardTiles.includes(tilePosition)
            ? t.claimedRewardTiles
            : [...t.claimedRewardTiles, tilePosition],
          history: [...t.history, {
            turnNumber: latestGame.currentTurn,
            teamId,
            teamName: t.name,
            tilePosition,
            coinsEarned: rewardCoins,
            coinsChange: rewardCoins,
            tilesMovedForward: 0,
            tilesMovedBackward: 0,
            itemsUsed: [],
            events: ['Kotak Hadiah: mendapatkan +100 koin.'],
            reward: '+100 koin',
            timestamp: Date.now(),
          }],
        });
        set({ game: { ...latestGame, teams: updatedTeamsReward } });
        soundManager.playVictory();
        get().addNotification({ type: 'success', title: '🎁 Kotak Hadiah!', message: `+${rewardCoins} Koin`, emoji: '🎁' });
        setTimeout(() => get().endTurn(), 1200);
        break;
      }

      case 'trap': {
        soundManager.playWrong();
        const latestGame = get().game;
        if (!latestGame || latestGame.pendingTrapTheft) return;
        set({
          game: {
            ...latestGame,
            pendingTrapTheft: { teamId, tilePosition },
          },
        });
        get().addNotification({
          type: 'warning',
          title: '🕳️ Kotak Jebakan!',
          message: 'Pilih kelompok lawan untuk mengambil hingga 100 koin.',
          emoji: '🪙',
        });
        break;
      }

      case 'shop': {
        if (game.settings.enableShop) {
          soundManager.playCoin();
          const latestGame = get().game;
          if (!latestGame || latestGame.pendingShopTile) return;
          set({
            isShopOpen: true,
            activeShopTeamId: teamId,
            game: {
              ...latestGame,
              pendingShopTile: { teamId, tilePosition, freePurchaseAvailable: true },
            },
          });
          get().addNotification({
            type: 'info',
            title: '🏪 Kotak Toko!',
            message: 'Pilih satu item seharga tepat 100 koin secara gratis. Item lain tetap berharga normal.',
            emoji: '🛒',
          });
        } else {
          setTimeout(() => get().endTurn(), 500);
        }
        break;
      }

      case 'mystery':
      case 'surprise_box': {
        const latestGame = get().game;
        if (!latestGame || latestGame.pendingMysteryBox) return;

        const prize = chooseMysteryBoxPrize(latestGame.settings.mysteryBoxPrizeWeights);
        set({
          game: {
            ...latestGame,
            pendingMysteryBox: { teamId, tilePosition, prize, status: 'spinning' },
          },
        });
        break;
      }

      case 'duel': {
        if (game.settings.enableDuel && game.teams.length > 1) {
          soundManager.playDuel();
          get().addNotification({ type: 'info', title: '⚔️ Kotak Duel!', message: 'Tantangan duel dimulai!', emoji: '⚔️' });
          const opponent = game.teams.find(t => t.id !== teamId) || game.teams[0];
          get().startDuel(teamId, opponent.id, {
            winnerCoins: 15,
            loserPenalty: 'move_back',
            loserPenaltyValue: 2,
            swapPositions: false,
          });
        } else {
          setTimeout(() => get().endTurn(), 500);
        }
        break;
      }

      case 'challenge': {
        soundManager.playItem();
        const latestGame = get().game;
        if (!latestGame || latestGame.pendingHokiMbg) return;
        set({
          game: {
            ...latestGame,
            pendingHokiMbg: { teamId, tilePosition },
          },
        });
        get().addNotification({
          type: 'info',
          title: '⚡ Kotak Hoki MBG!',
          message: 'Pilih kelompok lawan untuk mengurangi hingga 100 poin.',
          emoji: '🎯',
        });
        break;
      }

      case 'rest': {
        get().activateProtection(teamId, 1);
        soundManager.playCorrect();
        get().addNotification({ type: 'success', title: '😴 Kotak Istirahat!', message: 'Perlindungan aktif untuk satu efek negatif berikutnya!', emoji: '🛡️' });
        setTimeout(() => get().endTurn(), 1000);
        break;
      }

      case 'tax': {
        const taxAmount = 10;
        const latestGame = get().game;
        if (!latestGame) return;
        const updatedTeamsTax = latestGame.teams.map(t => {
          if (t.id !== teamId) return t;
          const coinsChange = Math.max(0, t.coins - taxAmount) - t.coins;
          return addTeamHistory(
            { ...t, coins: t.coins + coinsChange },
            latestGame,
            { tilePosition, coinsChange, events: [`Membayar pajak ${Math.abs(coinsChange)} koin.`] }
          );
        });
        set({ game: { ...latestGame, teams: updatedTeamsTax } });
        soundManager.playWrong();
        get().addNotification({ type: 'warning', title: '💸 Kotak Pajak!', message: `-${taxAmount} koin dibayarkan!`, emoji: '💸' });
        setTimeout(() => get().endTurn(), 1000);
        break;
      }

      case 'shortcut': {
        const shortcutTarget = Math.min(
          tile.effect?.targetTile || tilePosition + 8,
          game.settings.totalTiles,
          100
        );
        soundManager.playVictory();
        get().addNotification({ type: 'success', title: '🛤️ Jalan Pintas!', message: `Melompat ke kotak #${shortcutTarget}!`, emoji: '⚡' });
        const latestGame = get().game;
        if (!latestGame) return;
        const shortcutTeams = latestGame.teams.map(t => t.id !== teamId ? t : addTeamHistory(
          { ...t, position: shortcutTarget },
          latestGame,
          {
            tilePosition,
            tilesMovedForward: shortcutTarget - t.position,
            events: [`Jalan pintas menuju kotak #${shortcutTarget}.`],
          }
        ));
        set({ game: { ...latestGame, teams: shortcutTeams } });
        setTimeout(() => get().endTurn(), 1000);
        break;
      }

      case 'big_reward': {
        // Big reward: 100 coins
        soundManager.playCoin();
        get().addNotification({ type: 'success', title: '🎁 Hadiah Besar!', message: '+100 koin!', emoji: '💰' });
        
        const latestGame = get().game;
        if (!latestGame) return;
        
        const updatedTeams = latestGame.teams.map(t => addTeamHistory(
          { ...t, coins: t.coins + 100 },
          latestGame,
          {
            tilePosition,
            coinsChange: 100,
            events: ['Hadiah kotak spesial: +100 koin.'],
            reward: '+100 koin',
          }
        ));
        
        set({ game: { ...latestGame, teams: updatedTeams } });
        setTimeout(() => get().endTurn(), 1000);
        break;
      }

      case 'free_shop': {
        // Free shop item (price 100 coins for free)
        soundManager.playCoin();
        get().addNotification({ type: 'success', title: '🛒 Toko Gratis!', message: 'Item gratis (harga 100 koin)!', emoji: '🛒' });
        
        const latestGame = get().game;
        if (!latestGame) return;
        
        const freeItems = ['speed_boots', 'adventurer_rocket', 'double_step', 'super_step'];
        const selectedItem = freeItems[Math.floor(Math.random() * freeItems.length)];
        
        const updatedTeams = latestGame.teams.map(t => {
          const item = SHOP_ITEMS.find(i => i.id === selectedItem);
          if (!item) return t;
          
          return addTeamHistory(
            { ...t, inventory: [...t.inventory, { id: uuidv4(), itemId: item.id, item, quantity: 1, usedCount: 0 }] },
            latestGame,
            {
              tilePosition,
              itemsUsed: [item.name],
              events: [`Item gratis dari toko: ${item.name}!`],
              reward: item.name,
            }
          );
        });
        
        set({ game: { ...latestGame, teams: updatedTeams } });
        setTimeout(() => get().endTurn(), 1000);
        break;
      }

      case 'trap_with_penalty': {
        const penaltySteps = tile.effect?.value || 2;
        const penaltyAmount = tile.effect?.penalty || 50;
        soundManager.playWrong();
        get().addNotification({ type: 'error', title: '🕳️ Jebakan dengan Hukuman!', message: `Mundur ${penaltySteps} kotak! ${penaltyAmount} poin/koin hilang!`, emoji: '😱' });
        setTimeout(() => {
          const { game: g } = get();
          if (!g) return;
          const newPos = Math.max(1, team.position - penaltySteps);
          const updatedTeams = g.teams.map(t => t.id !== teamId ? t : {
            ...t,
            position: newPos,
            score: Math.max(0, t.score - penaltyAmount),
            coins: Math.max(0, t.coins - penaltyAmount)
          });
          set({ game: { ...g, teams: updatedTeams } });
          setTimeout(() => get().endTurn(), 800);
        }, 500);
        break;
      }

      default:
        setTimeout(() => get().endTurn(), 300);
    }
  },

  claimTrapCoins: (targetTeamId) => {
    const game = get().game;
    const pending = game?.pendingTrapTheft;
    if (!game || !pending) return false;

    const team = game.teams.find(candidate => candidate.id === pending.teamId);
    if (!team) return false;

    const target = targetTeamId
      ? game.teams.find(candidate => candidate.id === targetTeamId && candidate.id !== team.id)
      : undefined;
    if (targetTeamId && (!target || target.coins <= 0)) return false;
    if (!targetTeamId && game.teams.some(candidate => candidate.id !== team.id && candidate.coins > 0)) {
      return false;
    }

    const amount = target ? Math.min(100, target.coins) : 0;
    const tile = game.board.find(candidate => candidate.position === pending.tilePosition);
    const shouldMoveBack = !target || target.coins < 100;
    const penaltySteps = shouldMoveBack ? (tile?.effect?.value || 2) : 0;
    const newPosition = Math.max(1, team.position - penaltySteps);
    const events = [
      ...(target
        ? [`Kotak Jebakan: mengambil ${amount} koin dari ${target.name}.`]
        : ['Kotak Jebakan: tidak ada koin yang dapat dicuri dari kelompok lawan.']),
      ...(shouldMoveBack
        ? [`Jebakan memundurkan kelompok ${team.name} ${team.position - newPosition} kotak.`]
        : ['Berhasil mengambil 100 koin, jadi pion tidak mundur.']),
    ];

    const teams = game.teams.map(candidate => {
      if (candidate.id === team.id) {
        return addTeamHistory(
          { ...candidate, coins: candidate.coins + amount, position: newPosition },
          game,
          {
            tilePosition: pending.tilePosition,
            coinsChange: amount,
            tilesMovedBackward: team.position - newPosition,
            events,
            reward: amount > 0 ? `+${amount} koin dari ${target?.name}` : undefined,
          }
        );
      }
      if (target && candidate.id === target.id) {
        return addTeamHistory(
          { ...candidate, coins: candidate.coins - amount },
          game,
          {
            tilePosition: pending.tilePosition,
            coinsChange: -amount,
            events: [`${amount} koin diambil oleh ${team.name} dari kotak Jebakan.`],
          }
        );
      }
      return candidate;
    });

    set({ game: { ...game, teams, pendingTrapTheft: undefined } });
    if (amount > 0 && target) {
      soundManager.playCoin();
      get().addNotification({
        type: 'success',
        title: '🪙 Koin Berhasil Dicuri!',
        message: shouldMoveBack
          ? `${team.name} mengambil ${amount} koin dari ${target.name}. Pion mundur ${team.position - newPosition} kotak.`
          : `${team.name} mengambil 100 koin dari ${target.name}. Pion tidak mundur.`,
        emoji: '🕳️',
      });
    } else {
      get().addNotification({
        type: 'info',
        title: '🕳️ Efek Jebakan Selesai',
        message: shouldMoveBack
          ? `Tidak ada koin lawan yang tersedia. Pion mundur ${team.position - newPosition} kotak.`
          : 'Efek Jebakan selesai.',
        emoji: '😮',
      });
    }
    setTimeout(() => get().endTurn(), 800);
    return true;
  },

  applyHokiMbgPenalty: (targetTeamId) => {
    const game = get().game;
    const pending = game?.pendingHokiMbg;
    if (!game || !pending) return false;

    const team = game.teams.find(candidate => candidate.id === pending.teamId);
    if (!team) return false;

    const target = targetTeamId
      ? game.teams.find(candidate => candidate.id === targetTeamId && candidate.id !== team.id)
      : undefined;
    if (targetTeamId && (!target || target.score <= 0)) return false;
    if (!targetTeamId && game.teams.some(candidate => candidate.id !== team.id && candidate.score > 0)) {
      return false;
    }

    const amount = target ? Math.min(100, target.score) : 0;
    const teams = game.teams.map(candidate => {
      if (candidate.id === team.id) {
        return addTeamHistory(candidate, game, {
          tilePosition: pending.tilePosition,
          events: target
            ? [`Kotak Hoki MBG: mengurangi ${amount} poin ${target.name}.`]
            : ['Kotak Hoki MBG: tidak ada poin lawan yang dapat dikurangi.'],
          reward: amount > 0 ? `-${amount} poin dari ${target?.name}` : undefined,
        });
      }
      if (target && candidate.id === target.id) {
        return addTeamHistory(
          { ...candidate, score: candidate.score - amount },
          game,
          {
            tilePosition: pending.tilePosition,
            events: [`Kehilangan ${amount} poin karena Kotak Hoki MBG dari ${team.name}.`],
          }
        );
      }
      return candidate;
    });

    set({ game: { ...game, teams, pendingHokiMbg: undefined } });
    if (target && amount > 0) {
      soundManager.playWrong();
      get().addNotification({
        type: 'success',
        title: '⚡ Hoki MBG!',
        message: `${team.name} mengurangi ${amount} poin ${target.name}.`,
        emoji: '🎯',
      });
    } else {
      get().addNotification({
        type: 'info',
        title: '⚡ Hoki MBG Selesai',
        message: 'Tidak ada poin lawan yang tersedia untuk dikurangi.',
        emoji: '🎯',
      });
    }
    setTimeout(() => get().endTurn(), 800);
    return true;
  },

  revealMysteryBoxPrize: () => {
    const game = get().game;
    const pending = game?.pendingMysteryBox;
    if (!game || !pending || pending.status !== 'spinning') return;

    soundManager.playCorrect();

    if (pending.prize === 'free_item') {
      const hasAvailableItem = game.shopItems.some(item =>
        item.price === 100 && item.isEnabled && item.currentStock > 0
      );
      if (!hasAvailableItem) {
        set({
          game: {
            ...game,
            pendingMysteryBox: {
              ...pending,
              status: 'complete',
              resultMessage: 'Tidak ada item seharga 100 koin yang tersedia di toko saat ini.',
            },
          },
        });
        return;
      }
      set({ game: { ...game, pendingMysteryBox: { ...pending, status: 'choosing_item' } } });
      return;
    }

    if (pending.prize === 'steal') {
      if (game.teams.length < 2) {
        set({
          game: {
            ...game,
            pendingMysteryBox: {
              ...pending,
              status: 'complete',
              resultMessage: 'Tidak ada kelompok lawan untuk dipilih.',
            },
          },
        });
        return;
      }
      set({ game: { ...game, pendingMysteryBox: { ...pending, status: 'choosing_target' } } });
      return;
    }

    const reward = pending.prize === 'coins_100' ? 100 : 200;
    const team = game.teams.find(candidate => candidate.id === pending.teamId);
    if (!team) {
      set({ game: { ...game, pendingMysteryBox: { ...pending, status: 'complete', resultMessage: 'Tim penerima hadiah tidak ditemukan.' } } });
      return;
    }

    const updatedTeams = game.teams.map(candidate => candidate.id !== team.id ? candidate : addTeamHistory(
      { ...candidate, coins: candidate.coins + reward },
      game,
      {
        tilePosition: pending.tilePosition,
        coinsChange: reward,
        events: [`Kotak kejutan: mendapatkan ${reward} koin.`],
        reward: `+${reward} koin`,
      }
    ));
    set({
      game: {
        ...game,
        teams: updatedTeams,
        pendingMysteryBox: {
          ...pending,
          status: 'complete',
          resultMessage: `🎉 ${team.name} mendapatkan ${reward} koin!`,
        },
      },
    });
    soundManager.playVictory();
  },

  claimMysteryBoxItem: (itemId) => {
    const game = get().game;
    const pending = game?.pendingMysteryBox;
    if (!game || !pending || pending.status !== 'choosing_item') return false;

    const item = game.shopItems.find(candidate =>
      candidate.id === itemId
      && candidate.price === 100
      && candidate.isEnabled
      && candidate.currentStock > 0
    );
    const team = game.teams.find(candidate => candidate.id === pending.teamId);
    if (!item || !team) return false;

    const updatedInventory = team.inventory.some(inventoryItem => inventoryItem.itemId === item.id)
      ? team.inventory.map(inventoryItem => inventoryItem.itemId === item.id
        ? { ...inventoryItem, quantity: inventoryItem.quantity + 1 }
        : inventoryItem)
      : [...team.inventory, { id: uuidv4(), itemId: item.id, item, quantity: 1, usedCount: 0 }];
    const updatedTeams = game.teams.map(candidate => candidate.id !== team.id ? candidate : addTeamHistory(
      { ...candidate, inventory: updatedInventory },
      game,
      {
        tilePosition: pending.tilePosition,
        events: [`Kotak kejutan: mendapatkan ${item.name} gratis.`],
        reward: `${item.name} gratis`,
      }
    ));

    set({
      game: {
        ...game,
        teams: updatedTeams,
        shopItems: game.shopItems.map(candidate => candidate.id === item.id
          ? { ...candidate, currentStock: candidate.currentStock - 1 }
          : candidate),
        pendingMysteryBox: {
          ...pending,
          status: 'complete',
          resultMessage: `🎁 ${team.name} mendapatkan ${item.name} gratis!`,
        },
      },
    });
    soundManager.playCoin();
    return true;
  },

  stealMysteryBoxReward: (targetTeamId) => {
    const game = get().game;
    const pending = game?.pendingMysteryBox;
    if (!game || !pending || pending.status !== 'choosing_target' || targetTeamId === pending.teamId) return false;

    const receiver = game.teams.find(candidate => candidate.id === pending.teamId);
    const target = game.teams.find(candidate => candidate.id === targetTeamId);
    if (!receiver || !target) return false;

    const stolenCoins = Math.min(100, target.coins);
    const stolenPoints = Math.min(100, target.score);
    const updatedTeams = game.teams.map(candidate => {
      if (candidate.id === receiver.id) {
        return addTeamHistory(
          { ...candidate, coins: candidate.coins + stolenCoins, score: candidate.score + stolenPoints },
          game,
          {
            tilePosition: pending.tilePosition,
            coinsChange: stolenCoins,
            events: [`Kotak kejutan: mencuri ${stolenCoins} koin dan ${stolenPoints} poin dari ${target.name}.`],
            reward: `+${stolenCoins} koin, +${stolenPoints} poin`,
          }
        );
      }
      if (candidate.id === target.id) {
        return addTeamHistory(
          { ...candidate, coins: candidate.coins - stolenCoins, score: candidate.score - stolenPoints },
          game,
          {
            tilePosition: pending.tilePosition,
            coinsChange: -stolenCoins,
            events: [`Kotak kejutan: kehilangan ${stolenCoins} koin dan ${stolenPoints} poin kepada ${receiver.name}.`],
          }
        );
      }
      return candidate;
    });

    set({
      game: {
        ...game,
        teams: updatedTeams,
        pendingMysteryBox: {
          ...pending,
          status: 'complete',
          resultMessage: `🏆 ${receiver.name} mencuri ${stolenCoins} koin dan ${stolenPoints} poin dari ${target.name}!`,
        },
      },
    });
    soundManager.playVictory();
    return true;
  },

  claimFreeShopTileItem: (itemId) => {
    const game = get().game;
    const pending = game?.pendingShopTile;
    if (!game || !pending || !pending.freePurchaseAvailable) return false;

    const item = game.shopItems.find(candidate =>
      candidate.id === itemId
      && candidate.price === 100
      && candidate.isEnabled
      && candidate.currentStock > 0
    );
    const team = game.teams.find(candidate => candidate.id === pending.teamId);
    if (!item || !team) return false;

    const updatedInventory = team.inventory.some(inventoryItem => inventoryItem.itemId === item.id)
      ? team.inventory.map(inventoryItem => inventoryItem.itemId === item.id
        ? { ...inventoryItem, quantity: inventoryItem.quantity + 1 }
        : inventoryItem)
      : [...team.inventory, { id: uuidv4(), itemId: item.id, item, quantity: 1, usedCount: 0 }];
    const updatedTeams = game.teams.map(candidate => candidate.id !== team.id ? candidate : addTeamHistory(
      { ...candidate, inventory: updatedInventory },
      game,
      {
        tilePosition: pending.tilePosition,
        events: [`Kotak Toko: mendapatkan ${item.name} gratis.`],
        reward: `${item.name} gratis`,
      }
    ));

    set({
      game: {
        ...game,
        teams: updatedTeams,
        shopItems: game.shopItems.map(candidate => candidate.id === item.id
          ? { ...candidate, currentStock: candidate.currentStock - 1 }
          : candidate),
        pendingShopTile: { ...pending, freePurchaseAvailable: false },
      },
    });
    soundManager.playCoin();
    get().addNotification({
      type: 'success',
      title: '🎁 Item Gratis!',
      message: `${team.name} mendapatkan ${item.name} tanpa membayar koin.`,
      emoji: item.emoji,
    });
    return true;
  },

  finishMysteryBox: () => {
    const game = get().game;
    if (!game?.pendingMysteryBox || game.pendingMysteryBox.status !== 'complete') return;
    set({ game: { ...game, pendingMysteryBox: undefined } });
    get().endTurn();
  },

  endTurn: () => {
    const { game } = get();
    if (!game) return;
    
    // Rotate speaker for the current team
    const currentTeam = game.teams[game.currentTeamIndex];
    const rotatedSpeakerIndex = currentTeam && currentTeam.members.length > 0
      ? (currentTeam.currentSpeakerIndex + 1) % currentTeam.members.length
      : 0;

    const nextTeamIndex = (game.currentTeamIndex + 1) % game.teams.length;
    const nextTeam = game.teams[nextTeamIndex];
    const nextTurn = nextTeamIndex === 0 ? game.currentTurn + 1 : game.currentTurn;
    
    const updatedTeams = game.teams.map((t, idx) => {
      // Age per-turn effects: protection lasts a limited number of turns
      const protectionTurns = t.isProtected ? Math.max(0, t.protectionTurns - 1) : 0;
      const agedEffects = t.activeEffects
        .map(e => ({ ...e, remainingTurns: e.remainingTurns - 1 }))
        .filter(e => e.remainingTurns > 0);

      const base = {
        ...t,
        isProtected: protectionTurns > 0,
        protectionTurns,
        activeEffects: agedEffects,
      };

      if (idx === game.currentTeamIndex) {
        return {
          ...base,
          currentSpeakerIndex: rotatedSpeakerIndex,
          members: t.members.map((m, mIdx) => ({
            ...m,
            isCurrentSpeaker: mIdx === rotatedSpeakerIndex,
          })),
        };
      }
      return base;
    });

    set({
      game: {
        ...game,
        phase: 'playing',
        teams: updatedTeams,
        currentTeamIndex: nextTeamIndex,
        currentTurn: nextTurn,
        activeQuestion: undefined,
        activeDuel: undefined,
        questionAnswerSubmitted: false,
        questionAnsweredCorrectly: undefined,
        diceResult: undefined,
      },
    });
    
    const speakerName = nextTeam.members[nextTeam.currentSpeakerIndex]?.name || nextTeam.name;
    get().addNotification({
      type: 'info',
      title: `🔄 Giliran ${nextTeam.name}`,
      message: `Juru bicara: ${speakerName}`,
      emoji: '🎲'
    });
  },

  buyItem: (teamId, itemId) => {
    const { game } = get();
    if (!game) return false;
    
    const team = game.teams.find(t => t.id === teamId);
    const shopItem = game.shopItems.find(i => i.id === itemId);
    
    if (!team || !shopItem || !shopItem.isEnabled) return false;
    if (team.coins < shopItem.price) return false;
    if (shopItem.currentStock <= 0) return false;
    // Serangan Gabungan hanya bisa dibeli oleh tim dengan skor minimal 1000 poin.
    if (shopItem.id === 'combined_attack' && team.score < 1000) return false;
    
    soundManager.playCoin();

    const existingInv = team.inventory.find(i => i.itemId === itemId);
    
    const updatedInventory: InventoryItem[] = existingInv
      ? team.inventory.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i)
      : [...team.inventory, { id: uuidv4(), itemId, item: shopItem, quantity: 1, usedCount: 0 }];
    
    const updatedTeams = game.teams.map(t => t.id !== teamId ? t : {
      ...t,
      coins: t.coins - shopItem.price,
      inventory: updatedInventory,
      history: [...t.history, {
        turnNumber: game.currentTurn,
        teamId,
        teamName: t.name,
        tilePosition: t.position,
        coinsEarned: 0,
        coinsChange: -shopItem.price,
        tilesMovedForward: 0,
        tilesMovedBackward: 0,
        itemsUsed: [],
        events: [`Membeli ${shopItem.name}.`],
        timestamp: Date.now(),
      }],
    });
    
    const updatedShopItems = game.shopItems.map(i =>
      i.id === itemId ? { ...i, currentStock: i.currentStock - 1 } : i
    );
    
    set({ game: { ...game, teams: updatedTeams, shopItems: updatedShopItems } });
    get().addNotification({ type: 'success', title: `🛒 Item Dibeli!`, message: `${shopItem.name} masuk ke inventaris ${team.name}!`, emoji: shopItem.emoji });
    return true;
  },

  useItem: (teamId, itemId, targetTeamId) => {
    const { game } = get();
    if (!game) return false;
    
    const team = game.teams.find(t => t.id === teamId);
    if (!team) return false;
    
    const invItem = team.inventory.find(i => i.itemId === itemId);
    if (!invItem || invItem.quantity <= 0) return false;
    
    const item = invItem.item;
    const targetTeam = targetTeamId ? game.teams.find(t => t.id === targetTeamId) : null;

    if (item.requiresTarget && (!targetTeam || targetTeamId === teamId)) {
      get().addNotification({ type: 'error', title: 'Target Belum Dipilih', message: 'Pilih kelompok lawan sebagai target item ini.' });
      return false;
    }

    soundManager.playItem();

    const consumeActiveEffect = (targetId: string, effectType: string) => {
      const latestGame = get().game;
      const target = latestGame?.teams.find(t => t.id === targetId);
      const effect = target?.activeEffects.find(e => e.type === effectType && (e.value || 0) > 0);
      if (!latestGame || !target || !effect) return false;

      const remainingValue = (effect.value || 1) - 1;
      const updatedTeams = latestGame.teams.map(t => t.id !== targetId ? t : {
        ...t,
        activeEffects: t.activeEffects
          .map(e => e.id === effect.id ? { ...e, value: remainingValue } : e)
          .filter(e => e.id !== effect.id || remainingValue > 0),
      });
      set({ game: { ...latestGame, teams: updatedTeams } });
      return true;
    };

    const countered = Boolean(
      item.requiresTarget && targetTeam && consumeActiveEffect(targetTeam.id, 'cancel_next_item_effect')
    );

    if (countered && targetTeam) {
      get().addNotification({
        type: 'info',
        title: '🚫 Serangan Dibatalkan!',
        message: `${targetTeam.name} membatalkan efek ${item.name}.`,
        emoji: '🚫',
      });
    } else {
      switch (item.id) {
        case 'coin_thief': {
          if (!targetTeam) return false;
          const latestGame = get().game;
          const latestTeam = latestGame?.teams.find(t => t.id === teamId);
          const latestTarget = latestGame?.teams.find(t => t.id === targetTeam.id);
          if (!latestGame || !latestTeam || !latestTarget) return false;
          const stolenCoins = Math.min(latestTarget.coins, Math.max(0, item.effect.value || 0));
          const updatedTeams = latestGame.teams.map(t => {
            if (t.id === teamId) return { ...t, coins: t.coins + stolenCoins };
            if (t.id === targetTeam.id) return { ...t, coins: t.coins - stolenCoins };
            return t;
          });
          set({ game: { ...latestGame, teams: updatedTeams } });
          get().addNotification({
            type: stolenCoins > 0 ? 'warning' : 'info',
            title: stolenCoins > 0 ? '🪙 Koin Dicuri!' : '🪙 Koin Target Habis',
            message: stolenCoins > 0
              ? `${team.name} mengambil ${stolenCoins} koin dari ${targetTeam.name}. Saldo target: ${latestTarget.coins} → ${latestTarget.coins - stolenCoins}.`
              : `${targetTeam.name} tidak memiliki koin untuk dicuri.`,
            emoji: '🪙',
          });
          break;
        }

        case 'big_robber': {
          if (!targetTeam) return false;
          if (consumeActiveEffect(targetTeam.id, 'protect_points')) {
            get().addNotification({ type: 'success', title: '🛡️ Perisai Poin!', message: `Serangan pada poin ${targetTeam.name} berhasil ditangkis.`, emoji: '🛡️' });
            break;
          }
          const latestGame = get().game;
          const latestTarget = latestGame?.teams.find(t => t.id === targetTeam.id);
          if (!latestGame || !latestTarget) return false;
          const stolenPoints = Math.min(latestTarget.score, item.effect.value || 0);
          const updatedTeams = latestGame.teams.map(t => {
            if (t.id === teamId) return { ...t, score: t.score + stolenPoints };
            if (t.id === targetTeam.id) return { ...t, score: t.score - stolenPoints };
            return t;
          });
          set({ game: { ...latestGame, teams: updatedTeams } });
          get().addNotification({
            type: 'warning',
            title: '🪙 Poin Dicuri!',
            message: `${team.name} mengambil ${stolenPoints} poin dari ${targetTeam.name}. Skor: ${latestTarget.score} → ${latestTarget.score - stolenPoints}.`,
            emoji: '🪙',
          });
          break;
        }

        case 'point_curse':
        case 'score_eraser': {
          if (!targetTeam) return false;
          const pointsBlocked = consumeActiveEffect(targetTeam.id, 'protect_points');
          const latestGame = get().game;
          const latestTarget = latestGame?.teams.find(t => t.id === targetTeam.id);
          if (!latestGame || !latestTarget) return false;
          const pointsBefore = latestTarget.score;
          const coinsBefore = latestTarget.coins;
          const pointsAfter = pointsBlocked
            ? pointsBefore
            : Math.max(0, pointsBefore - Math.max(0, item.effect.value || 0));
          const coinsAfter = Math.max(0, coinsBefore - Math.max(0, item.effect.coins || 0));
          const updatedTeams = latestGame.teams.map(t => t.id === targetTeam.id
            ? { ...t, score: pointsAfter, coins: coinsAfter }
            : t
          );
          set({ game: { ...latestGame, teams: updatedTeams } });
          get().addNotification({
            type: pointsAfter < pointsBefore || coinsAfter < coinsBefore ? 'warning' : 'info',
            title: pointsBlocked ? '🛡️ Poin Terlindungi!' : '🌀 Efek Pengurangan Poin',
            message: `${targetTeam.name}: poin ${pointsBefore} → ${pointsAfter} (−${pointsBefore - pointsAfter}), koin ${coinsBefore} → ${coinsAfter} (−${coinsBefore - coinsAfter}).`,
            emoji: '🌀',
          });
          break;
        }

        case 'mud_trap':
        case 'blocking_storm': {
          if (!targetTeam) return false;
          const pointsBlocked = consumeActiveEffect(targetTeam.id, 'protect_points');
          const latestGame = get().game;
          const latestTarget = latestGame?.teams.find(t => t.id === targetTeam.id);
          if (!latestGame || !latestTarget) return false;
          const stepsBack = Math.max(0, item.effect.value || 0);
          const pointsBefore = latestTarget.score;
          const coinsBefore = latestTarget.coins;
          const newPosition = Math.max(1, latestTarget.position - stepsBack);
          const newScore = pointsBlocked
            ? pointsBefore
            : Math.max(0, pointsBefore - Math.max(0, item.effect.points || 0));
          const newCoins = Math.max(0, coinsBefore - Math.max(0, item.effect.coins || 0));
          const updatedTeams = latestGame.teams.map(t => t.id === targetTeam.id
            ? { ...t, position: newPosition, score: newScore, coins: newCoins }
            : t
          );
          set({ game: { ...latestGame, teams: updatedTeams } });
          get().addNotification({
            type: 'warning',
            title: item.name,
            message: `${targetTeam.name}: mundur ke kotak #${newPosition}, poin ${pointsBlocked ? 'terlindungi' : `${pointsBefore} → ${newScore}`}, koin ${coinsBefore} → ${newCoins}.`,
            emoji: item.emoji,
          });
          break;
        }

        case 'speed_boots':
        case 'adventurer_rocket': {
          const stepsForward = item.effect.value || 0;
          get().addNotification({ type: 'success', title: `${item.emoji} Efek Item Aktif!`, message: `${team.name} maju ${stepsForward} langkah.`, emoji: item.emoji });
          get().movePion(teamId, stepsForward);
          break;
        }

        case 'double_step':
        case 'super_step': {
          if (!targetTeam) return false;
          const latestGame = get().game;
          const latestTarget = latestGame?.teams.find(t => t.id === targetTeam.id);
          if (!latestGame || !latestTarget) return false;
          const stepsBackward = item.effect.value || 0;
          const newPosition = Math.max(1, latestTarget.position - stepsBackward);
          const updatedTeams = latestGame.teams.map(t => t.id === targetTeam.id
            ? { ...t, position: newPosition }
            : t
          );
          set({ game: { ...latestGame, teams: updatedTeams } });
          get().addNotification({
            type: 'warning',
            title: `${item.emoji} Efek Item Aktif!`,
            message: `${targetTeam.name} mundur ${stepsBackward} langkah ke kotak #${newPosition}.`,
            emoji: item.emoji,
          });
          break;
        }

        case 'anti_back_shield': {
          const latestTeam = get().game?.teams.find(t => t.id === teamId);
          if (!latestTeam) return false;
          get().adjustTeamEffects(teamId, [
            ...latestTeam.activeEffects,
            { id: uuidv4(), type: 'anti_back_shield', value: 1, remainingTurns: 1000 },
          ]);
          get().addNotification({ type: 'success', title: '🛡️ Tameng Siap!', message: 'Hukuman mundur berikutnya akan dibatalkan.', emoji: '🛡️' });
          break;
        }

        case 'surprise_question':
        case 'hard_test': {
          if (!targetTeam) return false;
          const latestGame = get().game;
          const latestTarget = latestGame?.teams.find(t => t.id === targetTeam.id);
          if (!latestGame || !latestTarget) return false;
          const effectDuration = Math.max(2, latestGame.teams.length + 1);
          get().adjustTeamEffects(targetTeam.id, [
            ...latestTarget.activeEffects,
            {
              id: uuidv4(),
              type: 'extra_questions_before_move',
              value: item.effect.value || 1,
              points: item.effect.points || 0,
              coins: item.effect.coins || 0,
              remainingTurns: effectDuration,
              sourceTeamId: teamId,
              sourceItemId: item.id,
            },
          ]);
          get().addNotification({
            type: 'warning',
            title: `${item.emoji} Soal Tambahan!`,
            message: `${targetTeam.name} harus menjawab ${item.effect.value} soal tambahan sebelum giliran berlanjut. Gagal: -${item.effect.points || 0} poin & -${item.effect.coins || 0} koin.`,
            emoji: item.emoji,
          });
          break;
        }

        case 'point_shield':
        case 'step_shield': {
          const effectType = item.id === 'point_shield' ? 'protect_points' : 'protect_steps';
          const latestGame = get().game;
          const latestTeam = latestGame?.teams.find(t => t.id === teamId);
          if (!latestGame || !latestTeam) return false;

          // Jebakan Langkah dipasangkan ke kelompok target pilihan pemakai.
          if (item.id === 'step_shield') {
            if (!targetTeam) return false;
            const existingTargetEffect = targetTeam.activeEffects.find(
              e => e.type === 'protect_steps' && e.sourceTeamId === teamId
            );
            const targetEffects = existingTargetEffect
              ? targetTeam.activeEffects.map(e => e.id === existingTargetEffect.id
                ? {
                    ...e,
                    value: (e.value || 0) + 1,
                    remainingTurns: Math.max(e.remainingTurns, latestGame.settings.totalTiles * latestGame.teams.length),
                  }
                : e)
              : [...targetTeam.activeEffects, {
                  id: uuidv4(),
                  type: 'protect_steps',
                  value: 1,
                  remainingTurns: Math.max(2, latestGame.settings.totalTiles * latestGame.teams.length),
                  sourceTeamId: teamId,
                  sourceItemId: 'step_shield',
                }];
            get().adjustTeamEffects(targetTeam.id, targetEffects);
            get().addNotification({
              type: 'success',
              title: `${item.emoji} Jebakan Langkah Terpasang!`,
              message: `${targetTeam.name} menjadi target: saat menjawab benar, ${targetTeam.name} tidak maju dan poin & koin hangus.`,
              emoji: item.emoji,
            });
            break;
          }
          const existingEffect = latestTeam.activeEffects.find(e => e.type === effectType);
          const updatedEffects = existingEffect
            ? latestTeam.activeEffects.map(e => e.id === existingEffect.id
              ? {
                  ...e,
                  value: (e.value || 0) + 1,
                  remainingTurns: Math.max(e.remainingTurns, latestGame.settings.totalTiles * latestGame.teams.length),
                }
              : e)
            : [...latestTeam.activeEffects, {
                id: uuidv4(),
                type: effectType,
                value: 1,
                remainingTurns: Math.max(2, latestGame.settings.totalTiles * latestGame.teams.length),
              }];
          get().adjustTeamEffects(teamId, updatedEffects);
          get().addNotification({
            type: 'success',
            title: `${item.emoji} Perlindungan Aktif!`,
            message: 'Perisai Poin akan menangkis satu serangan pengurangan poin.',
            emoji: item.emoji,
          });
          break;
        }

        case 'double_coins': {
          const latestTeam = get().game?.teams.find(t => t.id === teamId);
          if (!latestTeam) return false;
          get().adjustTeamEffects(teamId, [
            ...latestTeam.activeEffects,
            { id: uuidv4(), type: 'fixed_coins_next', value: item.effect.value || 100, remainingTurns: 1000 },
          ]);
          get().addNotification({
            type: 'success',
            title: '💎 Koin Ganda Aktif!',
            message: `Jawaban benar berikutnya memberi ${item.effect.value || 100} koin.`,
            emoji: '💎',
          });
          break;
        }

        case 'combined_attack': {
          if (!targetTeam) return false;
          const pointsBlocked = consumeActiveEffect(targetTeam.id, 'protect_points');
          const latestGame = get().game;
          const latestTarget = latestGame?.teams.find(t => t.id === targetTeam.id);
          if (!latestGame || !latestTarget) return false;
          const pointsBefore = latestTarget.score;
          const coinsBefore = latestTarget.coins;
          const positionBefore = latestTarget.position;
          const pointsAfter = pointsBlocked
            ? pointsBefore
            : Math.max(0, pointsBefore - (item.effect.points || 0));
          const coinsAfter = Math.max(0, coinsBefore - (item.effect.coins || 0));
          const positionAfter = Math.max(1, positionBefore - (item.effect.value || 0));
          const updatedTeams = latestGame.teams.map(t => t.id !== targetTeam.id ? t : {
            ...t,
            score: pointsAfter,
            coins: coinsAfter,
            position: positionAfter,
          });
          set({ game: { ...latestGame, teams: updatedTeams } });
          get().addNotification({
            type: 'warning',
            title: '💥 Serangan Gabungan!',
            message: `${targetTeam.name}: mundur ke kotak #${positionAfter}, poin ${pointsBlocked ? 'terlindungi' : `${pointsBefore} → ${pointsAfter}`}, koin ${coinsBefore} → ${coinsAfter}.`,
            emoji: '💥',
          });
          break;
        }

        case 'cancel_card': {
          const latestGame = get().game;
          const latestTeam = latestGame?.teams.find(t => t.id === teamId);
          if (!latestGame || !latestTeam) return false;
          const pendingEffect = latestTeam.activeEffects.find(
            e => e.sourceTeamId && e.sourceTeamId !== teamId
          );
          if (pendingEffect) {
            get().adjustTeamEffects(
              teamId,
              latestTeam.activeEffects.filter(e => e.id !== pendingEffect.id)
            );
            get().addNotification({ type: 'success', title: '🚫 Efek Dibatalkan!', message: `Satu efek item lawan pada ${team.name} berhasil dibatalkan.`, emoji: '🚫' });
          } else {
            const effectDuration = Math.max(2, latestGame.settings.totalTiles * latestGame.teams.length);
            get().adjustTeamEffects(teamId, [
              ...latestTeam.activeEffects,
              { id: uuidv4(), type: 'cancel_next_item_effect', value: 1, remainingTurns: effectDuration },
            ]);
            get().addNotification({ type: 'success', title: '🚫 Kartu Pembatal Siap!', message: 'Item lawan berikutnya yang menargetkan timmu akan dibatalkan.', emoji: '🚫' });
          }
          break;
        }

        default:
          get().addNotification({ type: 'error', title: 'Item Tidak Dikenali', message: `${item.name} tidak memiliki efek yang terdaftar.`, emoji: '❓' });
          return false;
      }
    }

    // Update inventory from the LATEST game state, so effects applied above are not overwritten
    const latestGame = get().game;
    if (latestGame) {
      const teamsAfterTargetHistory = targetTeam && item.requiresTarget
        ? latestGame.teams.map(t => {
            if (t.id !== targetTeam.id) return t;
            const positionChange = t.position - targetTeam.position;
            const pointChange = t.score - targetTeam.score;
            const coinChange = t.coins - targetTeam.coins;
            return addTeamHistory(t, latestGame, {
              tilePosition: targetTeam.position,
              coinsChange: coinChange,
              tilesMovedForward: Math.max(0, positionChange),
              tilesMovedBackward: Math.max(0, -positionChange),
              events: [
                `${team.name} menggunakan ${item.name} pada ${t.name}.`,
                ...(coinChange || pointChange || positionChange
                  ? [`Perubahan efek: ${coinChange >= 0 ? '+' : ''}${coinChange} koin, ${pointChange >= 0 ? '+' : ''}${pointChange} poin, ${positionChange >= 0 ? '+' : ''}${positionChange} kotak.`]
                  : ['Efek item tidak mengubah saldo koin, poin, atau posisi.']),
              ],
            });
          })
        : latestGame.teams;
      const updatedTeams = teamsAfterTargetHistory.map(t => {
        if (t.id !== teamId) return t;
        const updatedInventory = t.inventory.map(i =>
          i.itemId === itemId ? { ...i, quantity: i.quantity - 1, usedCount: i.usedCount + 1 } : i
        ).filter(i => i.quantity > 0);
        return {
          ...t,
          inventory: updatedInventory,
          history: [...t.history, {
            turnNumber: latestGame.currentTurn,
            teamId,
            teamName: t.name,
            tilePosition: t.position,
            coinsEarned: 0,
            coinsChange: t.coins - team.coins,
            tilesMovedForward: Math.max(0, t.position - team.position),
            tilesMovedBackward: Math.max(0, team.position - t.position),
            itemsUsed: [item.name],
            events: [
              `Menggunakan ${item.name}.`,
              ...(t.coins !== team.coins ? [`Saldo koin berubah ${t.coins - team.coins >= 0 ? '+' : ''}${t.coins - team.coins} koin.`] : []),
              ...(t.score !== team.score ? [`Skor berubah ${t.score - team.score >= 0 ? '+' : ''}${t.score - team.score} poin.`] : []),
            ],
            timestamp: Date.now(),
          }],
        };
      });
      set({ game: { ...latestGame, teams: updatedTeams } });
    }
    
    
    get().addNotification({ type: 'success', title: `✨ Item Digunakan!`, message: `${item.name} berhasil digunakan!`, emoji: item.emoji });
    return true;
  },

  useCard: (teamId, cardId, targetTeamId) => {
    const { game } = get();
    if (!game) return false;

    const team = game.teams.find(t => t.id === teamId);
    if (!team) return false;

    const card = team.cards.find(c => c.id === cardId && !c.isUsed);
    if (!card) return false;

    soundManager.playItem();

    switch (card.effect.type) {
      case 'gain_coins':
        get().adjustTeamCoins(teamId, card.effect.value || 20);
        get().addNotification({ type: 'success', title: '⭐ Kartu Bonus!', message: `+${card.effect.value || 20} koin diperoleh!`, emoji: '⭐' });
        break;

      case 'protect': {
        const updatedTeams = game.teams.map(t =>
          t.id === teamId ? { ...t, isProtected: true, protectionTurns: 1 } : t
        );
        set({ game: { ...game, teams: updatedTeams } });
        get().addNotification({ type: 'success', title: '🛡️ Perlindungan Kartu!', message: 'Terlindung dari 1 efek negatif!', emoji: '🛡️' });
        break;
      }

      case 'move_forward': {
        const bonusSteps = card.effect.value || 4;
        get().addNotification({ type: 'success', title: '⚡ Jalan Pintas!', message: `Maju ${bonusSteps} kotak ke depan!`, emoji: '⚡' });
        get().movePion(teamId, bonusSteps);
        break;
      }

      case 'retry_answer':
        get().adjustTeamEffects(teamId, [...team.activeEffects, { id: uuidv4(), type: 'retry_answer', value: 1, remainingTurns: 1 }]);
        get().addNotification({ type: 'info', title: '🔁 Kesempatan Jawab Ulang!', message: 'Kamu bisa mencoba lagi jika salah menjawab.', emoji: '🔁' });
        break;

      case 'steal_coins':
        if (targetTeamId) {
          const target = game.teams.find(t => t.id === targetTeamId);
          if (target) {
            const stolen = Math.min(card.effect.value || 10, target.coins);
            const updatedTeams = game.teams.map(t => {
              if (t.id === teamId) return addTeamHistory(
                { ...t, coins: t.coins + stolen },
                game,
                { tilePosition: t.position, coinsChange: stolen, events: [`Mencuri ${stolen} koin dari ${target.name}.`] }
              );
              if (t.id === targetTeamId) return addTeamHistory(
                { ...t, coins: t.coins - stolen },
                game,
                { tilePosition: t.position, coinsChange: -stolen, events: [`Kehilangan ${stolen} koin akibat pencurian.`] }
              );
              return t;
            });
            set({ game: { ...game, teams: updatedTeams } });
            get().addNotification({ type: 'info', title: '👛 Koin Dicuri!', message: `Mengambil ${stolen} koin dari ${target.name}!`, emoji: '👛' });
          }
        }
        break;

      case 'full_protection': {
        const updatedTeams = game.teams.map(t =>
          t.id === teamId ? { ...t, isProtected: true, protectionTurns: 2 } : t
        );
        set({ game: { ...game, teams: updatedTeams } });
        get().addNotification({ type: 'success', title: '💫 Kartu Kebal Legendaris!', message: 'Kebal total dari semua efek negatif!', emoji: '💫' });
        break;
      }

      case 'easier_next_question':
        get().addNotification({ type: 'info', title: '🔄 Soal Mudah!', message: 'Soal berikutnya akan lebih bersahabat!', emoji: '🔄' });
        break;

      default:
        get().addNotification({ type: 'info', title: '✨ Kartu Diaktifkan', message: card.description, emoji: card.emoji });
        break;
    }

    // Mark card as used
    const updatedCards = team.cards.map(c => c.id === cardId ? { ...c, isUsed: true } : c);
    const { game: latestGame } = get();
    if (latestGame) {
      const updatedTeams = latestGame.teams.map(t => t.id === teamId ? { ...t, cards: updatedCards } : t);
      set({ game: { ...latestGame, teams: updatedTeams } });
    }

    return true;
  },

  drawSurpriseCard: (teamId) => {
    const { game } = get();
    if (!game) return null;

    const team = game.teams.find(t => t.id === teamId);
    if (!team) return null;

    const template = SURPRISE_CARDS[Math.floor(Math.random() * SURPRISE_CARDS.length)];
    const newCard: SurpriseCard = {
      id: uuidv4(),
      name: template.name,
      type: template.type,
      description: template.description,
      emoji: template.emoji,
      rarity: template.rarity,
      effect: template.effect,
      isUsed: false,
    };

    soundManager.playItem();

    const updatedTeams = game.teams.map(t => t.id !== teamId ? t : {
      ...t,
      cards: [...t.cards, newCard],
      history: [...t.history, {
        turnNumber: game.currentTurn,
        teamId,
        teamName: t.name,
        tilePosition: t.position,
        coinsEarned: 0,
        coinsChange: 0,
        tilesMovedForward: 0,
        tilesMovedBackward: 0,
        itemsUsed: [],
        events: [`Mendapatkan Kartu Kejutan: ${newCard.name}.`],
        reward: newCard.name,
        timestamp: Date.now(),
      }],
    });

    set({
      game: { ...game, teams: updatedTeams },
      activeCardDrawn: { card: newCard, team },
    });

    return newCard;
  },

  consumeCompass: (teamId: string) => {
    const { game } = get();
    if (!game) return false;

    const team = game.teams.find(t => t.id === teamId);
    if (!team) return false;

    // Guard for the auto-hint path; consumption happens in useHintInQuestion
    const compass = team.inventory.find(i => i.itemId === 'compass' && i.quantity > 0);
    const hasActiveEffect = team.activeEffects.some(e => e.type === 'hint_next_question');

    if (!compass && !hasActiveEffect) return false;

    soundManager.playItem();

    get().addNotification({
      type: 'info',
      title: '🧭 Kompas Digunakan!',
      message: 'Dua opsi salah telah dieliminasi dari pertanyaan!',
      emoji: '🧭',
    });

    return true;
  },

  useHintInQuestion: (teamId, question) => {
    const { game } = get();
    if (!game || question.type === 'short_answer' || question.type === 'math' || !question.options) return [];

    const team = game.teams.find(t => t.id === teamId);
    if (!team) return [];

    const hasCompass = team.inventory.some(i => i.itemId === 'compass' && i.quantity > 0);
    const hasHintEffect = team.activeEffects.some(e => e.type === 'hint_next_question');
    if (!hasCompass && !hasHintEffect) return [];

    // Eliminate (up to) two wrong options
    const wrongOptions = question.options.filter((o: string) =>
      o.trim().toLowerCase() !== question.correctAnswer.trim().toLowerCase()
    );
    const eliminated = wrongOptions.slice(0, 2);

    // Consume the item (or the pre-activated effect) — never both
    const latest = get().game!;
    const updatedTeams = latest.teams.map(t => {
      if (t.id !== teamId) return t;
      if (hasCompass) {
        return {
          ...t,
          inventory: t.inventory.map(i =>
            i.itemId === 'compass' ? { ...i, quantity: i.quantity - 1, usedCount: i.usedCount + 1 } : i
          ).filter(i => i.quantity > 0),
        };
      }
      return {
        ...t,
        activeEffects: t.activeEffects.filter(e => e.type !== 'hint_next_question'),
      };
    });
    set({ game: { ...latest, teams: updatedTeams, eliminatedOptions: eliminated } });

    get().addNotification({
      type: 'info',
      title: '🧭 Kompas Digunakan!',
      message: `${eliminated.length} opsi salah telah dieliminasi dari soal ini!`,
      emoji: '🧭',
    });

    return eliminated;
  },

  activateProtection: (teamId, charges) => {
    const { game } = get();
    if (!game) return;
    const updatedTeams = game.teams.map(t =>
      t.id === teamId
        ? { ...t, isProtected: true, protectionTurns: Math.max(t.protectionTurns, 0) + charges }
        : t
    );
    set({ game: { ...game, teams: updatedTeams } });
  },

  consumeProtection: (teamId, fallbackItemId) => {
    const { game } = get();
    if (!game) return null;
    const team = game.teams.find(t => t.id === teamId);
    if (!team) return null;

    // 1) Universal protection (Perisai / Kartu Kebal / Kotak Istirahat)
    if (team.isProtected && team.protectionTurns > 0) {
      const remaining = team.protectionTurns - 1;
      const updatedTeams = game.teams.map(t =>
        t.id === teamId
          ? { ...t, isProtected: remaining > 0, protectionTurns: remaining }
          : t
      );
      set({ game: { ...game, teams: updatedTeams } });
      return 'protection';
    }

    // 2) Item specific passive defense (Anti-Meteor / Kartu Penyelamat)
    if (fallbackItemId && team.inventory.some(i => i.itemId === fallbackItemId && i.quantity > 0)) {
      const updatedTeams = game.teams.map(t => t.id !== teamId ? t : {
        ...t,
        inventory: t.inventory.map(i =>
          i.itemId === fallbackItemId ? { ...i, quantity: i.quantity - 1, usedCount: i.usedCount + 1 } : i
        ).filter(i => i.quantity > 0),
      });
      set({ game: { ...game, teams: updatedTeams } });
      return 'item';
    }

    return null;
  },

  useChanceCardRetry: (teamId) => {
    const { game } = get();
    if (!game) return false;

    const team = game.teams.find(t => t.id === teamId);
    if (!team) return false;

    const chanceItem = team.inventory.find(i => i.itemId === 'chance_card' && i.quantity > 0);
    const retryCard = team.cards.find(c => c.effect.type === 'retry_answer' && !c.isUsed);
    const hasActiveEffect = team.activeEffects.some(e => e.type === 'retry_answer');

    if (!chanceItem && !retryCard && !hasActiveEffect) return false;

    soundManager.playItem();

    // Always rebuild from the latest state so the inventory and cards are never overwritten
    const latest = get().game;
    if (!latest) return false;
    if (chanceItem) {
      const updatedTeams = latest.teams.map(t => t.id !== teamId ? t : {
        ...t,
        inventory: t.inventory.map(i =>
          i.itemId === 'chance_card' ? { ...i, quantity: i.quantity - 1, usedCount: i.usedCount + 1 } : i
        ).filter(i => i.quantity > 0),
      });
      set({ game: { ...latest, teams: updatedTeams } });
    } else if (retryCard) {
      const updatedTeams = latest.teams.map(t => t.id !== teamId ? t : {
        ...t,
        cards: t.cards.map(c => c.id === retryCard.id ? { ...c, isUsed: true } : c),
      });
      set({ game: { ...latest, teams: updatedTeams } });
    }

    get().addNotification({
      type: 'info',
      title: '🃏 Kesempatan Mengulang!',
      message: 'Kamu mendapatkan 1 kesempatan menjawab lagi!',
      emoji: '🃏',
    });

    return true;
  },

  startDuel: (challengerTeamId, defendingTeamId, stakes) => {
    const { game } = get();
    if (!game) return;
    
    const bank = game.questions && game.questions.length > 0 ? game.questions : QUESTION_BANK;
    const availableQuestions = bank.filter(q => !game.usedQuestionIds.includes(q.id));
    const pool = availableQuestions.length > 0 ? availableQuestions : bank;
    const question = pool[Math.floor(Math.random() * pool.length)];
    
    const duel: Duel = {
      id: uuidv4(),
      challengerTeamId,
      defendingTeamId,
      question,
      stakes,
      phase: 'challenger_answering',
    };
    
    set({ game: { ...game, activeDuel: duel, phase: 'duel' } });
    get().addNotification({ type: 'info', title: '⚔️ DUEL DIMULAI!', message: `${game.teams.find(t=>t.id===challengerTeamId)?.name} vs ${game.teams.find(t=>t.id===defendingTeamId)?.name}`, emoji: '⚔️' });
  },

  submitDuelAnswer: (teamId, answer, time) => {
    const { game } = get();
    if (!game || !game.activeDuel) return;
    
    const duel = game.activeDuel;
    const isCorrect = duel.question ? isAnswerCorrect(answer, duel.question) : false;
    
    let updatedDuel: Duel;
    if (teamId === duel.challengerTeamId) {
      updatedDuel = { ...duel, challengerAnswer: answer, challengerCorrect: isCorrect, challengerTime: time, phase: 'defender_answering' };
    } else {
      updatedDuel = { ...duel, defenderAnswer: answer, defenderCorrect: isCorrect, defenderTime: time, phase: 'resolved' };
    }
    
    set({ game: { ...game, activeDuel: updatedDuel } });
    
    if (updatedDuel.phase === 'resolved') {
      get().resolveDuel();
    }
  },

  resolveDuel: () => {
    const { game } = get();
    if (!game || !game.activeDuel) return;
    
    const duel = game.activeDuel;
    let winnerId: string | undefined;
    
    if (duel.challengerCorrect && !duel.defenderCorrect) {
      winnerId = duel.challengerTeamId;
    } else if (!duel.challengerCorrect && duel.defenderCorrect) {
      winnerId = duel.defendingTeamId;
    } else if (duel.challengerCorrect && duel.defenderCorrect) {
      // Both correct - faster wins
      winnerId = (duel.challengerTime || 999) >= (duel.defenderTime || 999) ? duel.challengerTeamId : duel.defendingTeamId;
    }
    // Both wrong = no winner
    
    const loserId = winnerId ? (winnerId === duel.challengerTeamId ? duel.defendingTeamId : duel.challengerTeamId) : undefined;
    
    let updatedTeams = game.teams.map(t => {
      if (t.id === winnerId) {
        return addTeamHistory(
          { ...t, coins: t.coins + duel.stakes.winnerCoins, duelWins: t.duelWins + 1, score: t.score + 15 },
          game,
          {
            tilePosition: t.position,
            coinsEarned: duel.stakes.winnerCoins,
            coinsChange: duel.stakes.winnerCoins,
            events: ['Memenangkan duel dan menerima hadiah koin.'],
          }
        );
      }
      if (t.id === loserId && duel.stakes.loserPenalty !== 'none') {
        if (duel.stakes.loserPenalty === 'move_back') {
          const newPosition = Math.max(1, t.position - duel.stakes.loserPenaltyValue);
          return addTeamHistory(
            { ...t, position: newPosition },
            game,
            {
              tilePosition: t.position,
              tilesMovedBackward: t.position - newPosition,
              events: ['Mundur akibat kalah duel.'],
            }
          );
        } else if (duel.stakes.loserPenalty === 'lose_coins') {
          const coinsChange = Math.max(0, t.coins - duel.stakes.loserPenaltyValue) - t.coins;
          return addTeamHistory(
            { ...t, coins: t.coins + coinsChange },
            game,
            { tilePosition: t.position, coinsChange, events: ['Kehilangan koin akibat kalah duel.'] }
          );
        }
      }
      return t;
    });
    
    // Swap positions if that's the stake
    if (winnerId && duel.stakes.swapPositions) {
      const winner = updatedTeams.find(t => t.id === winnerId);
      const loser = updatedTeams.find(t => t.id === loserId);
      if (winner && loser) {
        const winnerPos = winner.position;
        updatedTeams = updatedTeams.map(t => {
          if (t.id === winnerId) return { ...t, position: loser.position };
          if (t.id === loserId) return { ...t, position: winnerPos };
          return t;
        });
        get().addNotification({ type: 'success', title: '🔄 Posisi Ditukar!', message: 'Kedua kelompok bertukar posisi!', emoji: '✨' });
      }
    }
    
    const winnerName = game.teams.find(t => t.id === winnerId)?.name;
    set({ game: { ...game, teams: updatedTeams, activeDuel: { ...duel, winnerId, phase: 'resolved' } } });
    
    if (winnerName) {
      get().addNotification({ type: 'success', title: `🏆 ${winnerName} Menang Duel!`, message: `+${duel.stakes.winnerCoins} koin diperoleh!`, emoji: '⚔️' });
    } else {
      get().addNotification({ type: 'info', title: '🤝 Duel Seri!', message: 'Kedua kelompok menjawab salah.', emoji: '🤷' });
    }
    
    setTimeout(() => get().endTurn(), 2000);
  },

  addNotification: (notification) => {
    const { game } = get();
    if (!game) return;
    const newNotif: Notification = {
      ...notification,
      id: uuidv4(),
      timestamp: Date.now(),
      duration: notification.duration || 3000,
    };
    set({ game: { ...game, notifications: [...game.notifications.slice(-4), newNotif] } });
    setTimeout(() => get().removeNotification(newNotif.id), newNotif.duration);
  },

  removeNotification: (id) => {
    const { game } = get();
    if (!game) return;
    set({ game: { ...game, notifications: game.notifications.filter(n => n.id !== id) } });
  },

  getCurrentTeam: () => {
    const { game } = get();
    if (!game) return null;
    return game.teams[game.currentTeamIndex] || null;
  },

  getTeamById: (teamId) => {
    const { game } = get();
    if (!game) return null;
    return game.teams.find(t => t.id === teamId) || null;
  },

  getLeaderboard: () => {
    const { game } = get();
    if (!game) return [];
    return [...game.teams].sort((a, b) => {
      if (a.position !== b.position) return b.position - a.position;
      return b.score - a.score;
    });
  },

  checkMissions: (teamId) => {
    const { game } = get();
    if (!game) return;
    const team = game.teams.find(t => t.id === teamId);
    if (!team) return;
    
    const updatedMissions = team.missions.map(mp => {
      if (mp.isCompleted) return mp;
      const { condition, reward } = mp.mission;
      let newProgress = mp.progress;
      let isCompleted = false;
      
      switch (condition.type) {
        case 'consecutive_correct':
          newProgress = team.consecutiveCorrect;
          if (newProgress >= condition.value) {
            isCompleted = true;
            get().adjustTeamCoins(teamId, reward.coins || 0);
            get().addNotification({ type: 'success', title: `🎯 Misi Selesai!`, message: `${mp.mission.name}: +${reward.coins} koin!`, emoji: mp.mission.emoji });
          }
          break;
        case 'collect_coins':
          newProgress = team.coins;
          if (newProgress >= condition.value) {
            isCompleted = true;
            get().adjustTeamCoins(teamId, reward.coins || 0);
            get().addNotification({ type: 'success', title: `💰 Misi Selesai!`, message: `${mp.mission.name}`, emoji: mp.mission.emoji });
          }
          break;
        case 'win_duel':
          newProgress = team.duelWins;
          if (newProgress >= condition.value) {
            isCompleted = true;
            get().adjustTeamCoins(teamId, reward.coins || 0);
          }
          break;
      }
      
      return { ...mp, progress: newProgress, isCompleted, completedAt: isCompleted ? Date.now() : undefined };
    });
    
    const latestGame = get().game;
    if (!latestGame) return;
    const updatedTeams = latestGame.teams.map(t =>
      t.id === teamId ? { ...t, missions: updatedMissions } : t
    );
    set({ game: { ...latestGame, teams: updatedTeams } });
  },

  triggerRandomEvent: () => {
    const { game } = get();
    if (!game) return;
    const event = game.randomEvents[Math.floor(Math.random() * game.randomEvents.length)];
    get().addNotification({ type: 'event', title: `🌟 EVENT: ${event.name}`, message: event.description, emoji: event.emoji, duration: 5000 });
    
    // Apply event effects
    if (event.affectsAllTeams && (event.effect.type === 'gain_coins_all')) {
      const coinsChange = event.effect.value || 0;
      const latestGame = get().game;
      if (!latestGame) return;
      const updatedTeams = latestGame.teams.map(t => addTeamHistory(
        { ...t, coins: t.coins + coinsChange },
        latestGame,
        { tilePosition: t.position, coinsChange, events: [`Event ${event.name}: +${coinsChange} koin.`] }
      ));
      set({ game: { ...latestGame, teams: updatedTeams, activeEvent: event } });
    }
  },

  computeAchievements: () => {
    const { game } = get();
    if (!game) return [];
    const achievements: Achievement[] = [];
    
    const sorted = get().getLeaderboard();
    if (sorted.length > 0) {
      achievements.push({ id: 'quiz_king', name: 'Raja Kuis', nameId: 'quiz_king', description: 'Kelompok dengan skor tertinggi', emoji: '👑', teamId: sorted[0].id });
    }
    
    const mostCorrect = [...game.teams].sort((a, b) => b.correctAnswers - a.correctAnswers)[0];
    if (mostCorrect) {
      achievements.push({ id: 'most_correct', name: 'Paling Banyak Menjawab Benar', nameId: 'most_correct', description: `${mostCorrect.correctAnswers} jawaban benar`, emoji: '🎯', teamId: mostCorrect.id });
    }
    
    const mostDuels = [...game.teams].sort((a, b) => b.duelWins - a.duelWins)[0];
    if (mostDuels && mostDuels.duelWins > 0) {
      achievements.push({ id: 'duel_champion', name: 'Juara Duel', nameId: 'duel_champion', description: `${mostDuels.duelWins} duel dimenangkan`, emoji: '⚔️', teamId: mostDuels.id });
    }
    
    const mostItems = [...game.teams].sort((a, b) => b.inventory.length - a.inventory.length)[0];
    if (mostItems && mostItems.inventory.length > 0) {
      achievements.push({ id: 'collector', name: 'Kolektor Item', nameId: 'collector', description: 'Memiliki paling banyak item', emoji: '🎒', teamId: mostItems.id });
    }
    
    return achievements;
  },

  skipTurn: (teamId) => {
    const { game } = get();
    if (!game) return;
    const updatedTeams = game.teams.map(t =>
      t.id === teamId ? { ...t, skipTurns: t.skipTurns + 1 } : t
    );
    set({ game: { ...game, teams: updatedTeams } });
  },

  adjustTeamCoins: (teamId, amount) => {
    const { game } = get();
    if (!game) return;
    const updatedTeams = game.teams.map(t => {
      if (t.id !== teamId) return t;
      const coinsChange = Math.max(0, t.coins + amount) - t.coins;
      return addTeamHistory(
        { ...t, coins: t.coins + coinsChange },
        game,
        { tilePosition: t.position, coinsChange, events: [`Saldo berubah ${coinsChange >= 0 ? '+' : ''}${coinsChange} koin.`] }
      );
    });
    set({ game: { ...game, teams: updatedTeams } });
  },

  adjustTeamPosition: (teamId, newPosition) => {
    const { game } = get();
    if (!game) return;
    const updatedTeams = game.teams.map(t =>
      t.id === teamId
        ? { ...t, position: Math.min(Math.max(1, newPosition), Math.min(100, game.settings.totalTiles)) }
        : t
    );
    set({ game: { ...game, teams: updatedTeams } });
  },

  adjustTeamEffects: (teamId: string, effects: ActiveEffect[]) => {
    const { game } = get();
    if (!game) return;
    const updatedTeams = game.teams.map(t =>
      t.id === teamId ? { ...t, activeEffects: effects } : t
    );
    set({ game: { ...game, teams: updatedTeams } });
  },
}), {
  name: 'quiz-board-adventure-board-settings',
  partialize: state => ({ savedBoardSettings: state.savedBoardSettings }) as GameStore,
}));
