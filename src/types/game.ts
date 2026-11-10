// Quiz Board Adventure — Complete Type Definitions

export type TileType =
  | 'normal'
  | 'start'
  | 'finish'
  | 'reward'
  | 'challenge'
  | 'trap'
  | 'shop'
  | 'mystery'
  | 'duel'
  | 'shortcut'
  | 'rest'
  | 'tax'
  | 'surprise_box'
  | 'big_reward'
  | 'free_shop'
  | 'trap_with_penalty';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'image_guess'
  | 'logic'
  | 'math'
  | 'buzzer'
  | 'special_challenge';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'very_hard';
export type MovementMode = 'fixed' | 'dice' | 'challenge' | 'strategy';
export type GameMode = 'classic' | 'quiz_race' | 'dice_adventure' | 'strategy_battle' | 'mystery_board' | 'custom';
export type BoardMapId = 'classic' | 'adventure';
export type AdventurePathId = 'hutan' | 'sungai' | 'kota';
export type MysteryBoxPrize = 'coins_100' | 'free_item' | 'coins_200' | 'steal';
export type MysteryBoxPrizeWeights = Record<MysteryBoxPrize, number>;
export type GamePhase = 'lobby' | 'setup' | 'playing' | 'paused' | 'question' | 'moving' | 'tile_effect' | 'duel' | 'event' | 'final_challenge' | 'finished';
export type ItemCategory = 'help' | 'strategy' | 'defense';

/** Mata pelajaran yang bisa dipilih untuk bank soal */
export type SubjectId = 'matematika' | 'b_indonesia' | 'pai' | 'fiqih_lokal';

export const SUBJECTS: { id: SubjectId; name: string; emoji: string; desc: string }[] = [
  { id: 'matematika', name: 'Matematika', emoji: '➗', desc: 'Hitung, aljabar & geometri' },
  { id: 'b_indonesia', name: 'B. Indonesia', emoji: '📖', desc: 'Kosakata, ejaan & sastra' },
  { id: 'pai', name: 'PAI Nasional', emoji: '🕌', desc: 'Akidah, ibadah & Al-Qur\'an' },
  { id: 'fiqih_lokal', name: 'Fiqih Lokal', emoji: '🌙', desc: 'Ibadah: jamak, qashar, Jum\'at & jenazah' },
];

export const DEFAULT_SUBJECTS: SubjectId[] = SUBJECTS.map(s => s.id);

export interface BoardTile {
  id: number;
  position: number;
  type: TileType;
  x: number;
  y: number;
  label?: string;
  description?: string;
  effect?: TileEffect;
  color?: string;
  icon?: string;
  environment?: string;
}

export interface TileEffect {
  type: 'move_forward' | 'move_backward' | 'gain_coins' | 'lose_coins' | 'gain_item' | 'challenge' | 'duel' | 'protection' | 'tax' | 'shortcut_to' | 'surprise_box' | 'free_shop' | 'trap_with_penalty';
  value?: number;
  targetTile?: number;
  itemId?: string;
  penalty?: number;
  wheel?: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  avatarEmoji: string;
  pathId?: AdventurePathId;
  members: TeamMember[];
  position: number;
  claimedRewardTiles: number[];
  coins: number;
  score: number;
  inventory: InventoryItem[];
  cards: SurpriseCard[];
  history: TurnHistory[];
  correctAnswers: number;
  duelWins: number;
  isProtected: boolean;
  protectionTurns: number;
  skipTurns: number;
  missions: MissionProgress[];
  activeEffects: ActiveEffect[];
  consecutiveCorrect: number;
  currentSpeakerIndex: number;
  hasFinished: boolean;
  finishTime?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  avatarEmoji: string;
  isCurrentSpeaker: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  category: string;
  /** Mata pelajaran soal (opsional untuk kompatibilitas bank soal lama) */
  subject?: SubjectId;
  text: string;
  imageUrl?: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  timeLimit: number;
  coinsReward: number;
  movementReward: number;
  tags?: string[];
}

export interface ShopItem {
  id: string;
  name: string;
  nameId: string;
  category: ItemCategory;
  description: string;
  icon: string;
  emoji: string;
  price: number;
  maxStock: number;
  currentStock: number;
  effect: ItemEffect;
  usageLimit: number;
  requiresTarget: boolean;
  isEnabled: boolean;
}

export interface ItemEffect {
  type: string;
  value?: number;
  duration?: number;
  points?: number;
  coins?: number;
  targetTeam?: boolean;
  penalty?: number;
  wheel?: boolean;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  item: ShopItem;
  quantity: number;
  usedCount: number;
}

export interface SurpriseCard {
  id: string;
  name: string;
  type: string;
  description: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'legendary';
  effect: ItemEffect;
  isUsed: boolean;
}

export interface TurnHistory {
  turnNumber: number;
  teamId: string;
  teamName: string;
  questionId?: string;
  tilePosition?: number;
  questionText?: string;
  isCorrect?: boolean;
  coinsEarned: number;
  coinsChange?: number;
  tilesMovedForward: number;
  tilesMovedBackward: number;
  itemsUsed: string[];
  reward?: string;
  events: string[];
  timestamp: number;
}

export interface ActiveEffect {
  id: string;
  type: string;
  value?: number;
  /** Penalti yang diterapkan jika gagal (soal tambahan): pengurangan poin */
  points?: number;
  /** Penalti yang diterapkan jika gagal (soal tambahan): pengurangan koin */
  coins?: number;
  remainingTurns: number;
  sourceTeamId?: string;
  sourceItemId?: string;
}

export interface GameSettings {
  gameMode: GameMode;
  movementMode: MovementMode;
  totalTiles: number;
  maxTeams: number;
  membersPerTeam: number;
  questionTimeLimit: number;
  correctMoveSteps: number;
  incorrectPenalty: boolean;
  penaltySteps: number;
  enableDice: boolean;
  enableShop: boolean;
  shopOpenAnyTime: boolean;
  enableDuel: boolean;
  enableRandomEvents: boolean;
  enableMissions: boolean;
  enableFinalChallenge: boolean;
  finalChallengeQuestions: number;
  winCondition: 'first_finish' | 'highest_score';
  coinRewards: {
    correct: number;
    correctFast: number;
    hardChallenge: number;
    duelWin: number;
    specialMission: number;
  };
  itemPrices: Record<string, number>;
  enabledItems: string[];
  boardEnvironment: string;
  boardMapId: BoardMapId;
  adventurePathId: AdventurePathId;
  mysteryBoxPrizeWeights: MysteryBoxPrizeWeights;
  specialTilePositions: Record<number, TileType>;
  randomEventChance: number;
  movementByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
    very_hard: number;
  };
  /** Mata pelajaran yang dipakai sebagai bank soal */
  subjects: SubjectId[];
}

export interface GameState {
  id: string;
  roomCode: string;
  name: string;
  phase: GamePhase;
  settings: GameSettings;
  teams: Team[];
  currentTeamIndex: number;
  currentTurn: number;
  board: BoardTile[];
  activeQuestion?: Question;
  activeQuestionIsBonus?: boolean;
  questionAnswerSubmitted?: boolean;
  /** Wrong options removed by the Compass hint for the current question */
  eliminatedOptions?: string[];
  activeDuel?: Duel;
  activeEvent?: RandomEvent;
  winner?: string;
  startedAt?: number;
  endedAt?: number;
  adminId: string;
  turnTimeLeft: number;
  diceResult?: number;
  pendingEffect?: PendingEffect;
  pendingMysteryBox?: {
    teamId: string;
    tilePosition: number;
    prize: MysteryBoxPrize;
    status: 'spinning' | 'choosing_item' | 'choosing_target' | 'complete';
    resultMessage?: string;
  };
  pendingShopTile?: {
    teamId: string;
    tilePosition: number;
    freePurchaseAvailable: boolean;
  };
  pendingTrapTheft?: {
    teamId: string;
    tilePosition: number;
  };
  pendingHokiMbg?: {
    teamId: string;
    tilePosition: number;
  };
  questionAnsweredCorrectly?: boolean;
  finalChallengeProgress: Record<string, number>;
  shopItems: ShopItem[];
  tileQuestionIds: Record<number, string>;
  /** Bank soal yang sudah disaring sesuai mata pelajaran terpilih */
  questions: Question[];
  randomEvents: RandomEvent[];
  missions: Mission[];
  usedQuestionIds: string[];
  notifications: Notification[];
  eventActive?: boolean;
  eventDurationRemaining?: number;
  currentEventEffect?: RandomEvent;
}

export interface Duel {
  id: string;
  challengerTeamId: string;
  defendingTeamId: string;
  question?: Question;
  challengerAnswer?: string;
  defenderAnswer?: string;
  challengerCorrect?: boolean;
  defenderCorrect?: boolean;
  challengerTime?: number;
  defenderTime?: number;
  winnerId?: string;
  stakes: DuelStakes;
  phase: 'pending' | 'challenger_answering' | 'defender_answering' | 'resolved';
  triggeredBy?: string;
}

export interface DuelStakes {
  winnerCoins: number;
  loserPenalty: 'none' | 'move_back' | 'lose_coins';
  loserPenaltyValue: number;
  swapPositions: boolean;
}

export interface RandomEvent {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: string;
  effect: ItemEffect;
  affectsAllTeams: boolean;
  duration: number;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: MissionCondition;
  reward: MissionReward;
}

export interface MissionCondition {
  type: 'consecutive_correct' | 'land_on_reward' | 'win_duel' | 'collect_coins' | 'use_defense' | 'complete_hard';
  value: number;
}

export interface MissionReward {
  coins?: number;
  items?: string[];
  cards?: string[];
  moveForward?: number;
}

export interface MissionProgress {
  missionId: string;
  mission: Mission;
  progress: number;
  isCompleted: boolean;
  completedAt?: number;
}

export interface PendingEffect {
  type: string;
  teamId: string;
  value?: number;
  resolved: boolean;
  description?: string;
}

export interface Achievement {
  id: string;
  name: string;
  nameId: string;
  description: string;
  emoji: string;
  teamId?: string;
}

export interface GameResult {
  gameId: string;
  winner: Team;
  teams: Team[];
  achievements: Achievement[];
  totalTurns: number;
  duration: number;
  timestamp: number;
}

export interface LeaderboardEntry {
  rank: number;
  team: Team;
  position: number;
  coins: number;
  score: number;
  correctAnswers: number;
  duelWins: number;
  itemCount: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'event';
  title: string;
  message: string;
  emoji?: string;
  duration?: number;
  timestamp: number;
}

export const TEAM_COLORS = [
  { name: 'Merah', value: '#ef4444', light: '#fef2f2', dark: '#dc2626' },
  { name: 'Biru', value: '#3b82f6', light: '#eff6ff', dark: '#2563eb' },
  { name: 'Hijau', value: '#22c55e', light: '#f0fdf4', dark: '#16a34a' },
  { name: 'Kuning', value: '#eab308', light: '#fefce8', dark: '#ca8a04' },
  { name: 'Ungu', value: '#a855f7', light: '#faf5ff', dark: '#9333ea' },
  { name: 'Oranye', value: '#f97316', light: '#fff7ed', dark: '#ea580c' },
];

export const TEAM_AVATARS = ['🦅', '🐯', '🐺', '🦁', '🐉', '🦊', '🦋', '🐬', '🦄', '🔥'];

export const DEFAULT_SETTINGS: GameSettings = {
  gameMode: 'classic',
  movementMode: 'fixed',
  totalTiles: 30,
  maxTeams: 4,
  membersPerTeam: 3,
  questionTimeLimit: 30,
  correctMoveSteps: 1,
  incorrectPenalty: false,
  penaltySteps: 1,
  enableDice: false,
  enableShop: true,
  shopOpenAnyTime: false,
  enableDuel: true,
  enableRandomEvents: true,
  enableMissions: true,
  enableFinalChallenge: true,
  finalChallengeQuestions: 3,
  winCondition: 'first_finish',
  coinRewards: {
    correct: 10,
    correctFast: 5,
    hardChallenge: 20,
    duelWin: 15,
    specialMission: 25,
  },
  itemPrices: {
    coin_thief: 40,
    big_robber: 70,
    point_curse: 35,
    score_eraser: 65,
    mud_trap: 30,
    blocking_storm: 55,
    speed_boots: 40,
    anti_back_shield: 40,
    double_step: 35,
    super_step: 55,
    adventurer_rocket: 65,
    surprise_question: 30,
    hard_test: 60,
    point_shield: 45,
    step_shield: 45,
    double_coins: 120,
    combined_attack: 200,
    cancel_card: 50,
  },
  enabledItems: [
    'coin_thief','big_robber','point_curse','score_eraser','mud_trap',
    'blocking_storm','speed_boots','adventurer_rocket','double_step','super_step','anti_back_shield','surprise_question','hard_test',
    'point_shield','step_shield','double_coins','combined_attack','cancel_card',
  ],
  boardEnvironment: 'mixed',
  boardMapId: 'adventure',
  adventurePathId: 'hutan',
  mysteryBoxPrizeWeights: {
    coins_100: 25,
    free_item: 25,
    coins_200: 25,
    steal: 25,
  },
  specialTilePositions: {
    1: 'start',
    5: 'mystery',
    8: 'reward',
    11: 'shop',
    14: 'duel',
    17: 'trap',
    20: 'surprise_box',
    23: 'reward',
    26: 'shop',
    29: 'duel',
    30: 'finish',
  },
  randomEventChance: 0.15,
  movementByDifficulty: {
    easy: 2,
    medium: 3,
    hard: 5,
    very_hard: 7,
  },
  subjects: DEFAULT_SUBJECTS,
};
