'use client';

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Clock3, Coins, Gamepad2, Hammer, Pause, Play, RotateCcw, ShoppingBag, Sparkles, Trash2, Trophy, Users, X } from 'lucide-react';
import Image, { type StaticImageData } from 'next/image';
import { useRouter } from 'next/navigation';
import { getQuestionsBySubjects } from '@/data/gameData';
import { DEFAULT_SUBJECTS, SUBJECTS, type Difficulty, type Question, type SubjectId } from '@/types/game';
import AcidPotionImage from '../../../Item/Acid Potion 🧪.jpg';
import BlackHoleImage from '../../../Item/Black Hole 🌀.jpg';
import CannonShotImage from '../../../Item/Cannon Shot 💣.jpg';
import EarthquakeImage from '../../../Item/Earthquake.jpg';
import FireBlastImage from '../../../Item/Fire Blast 🔥.jpg';
import IceBreakerImage from '../../../Item/Ice Breaker ❄️.jpg';
import LaserBeamImage from '../../../Item/Laser Beam.jpg';
import MegaBombImage from '../../../Item/Mega Bomb.jpg';
import MegaHammerImage from '../../../Item/Mega Hammer 🔨.jpg';
import MeteorStrikeImage from '../../../Item/Meteor Strike.jpg';
import SwordSlashImage from '../../../Item/Sword Slash ⚔️.jpg';
import ThunderStrikeImage from '../../../Item/Thunder Strike.jpg';
import TornadoImage from '../../../Item/Tornado 🌪️.jpg';
import UltimateBlastImage from '../../../Item/Ultimate Blast ☄️.jpg';
import VolcanoImage from '../../../Item/Volcano 🌋.jpg';

type QuestionKind = 'multiple_choice' | 'true_false' | 'short_answer';
type ItemId =
  | 'fire_blast'
  | 'mega_hammer'
  | 'tornado'
  | 'ice_breaker'
  | 'black_hole'
  | 'volcano'
  | 'acid_potion'
  | 'balance_thief'
  | 'cannon_shot'
  | 'sword_slash'
  | 'ultimate_blast'
  | 'mega_bomb'
  | 'thunder_strike'
  | 'meteor_strike'
  | 'earthquake'
  | 'laser_beam';
type Phase = 'playing' | 'paused' | 'finished';

interface ItemEffect {
  target: 'single' | 'all';
  damage: number;
  stealBlocks?: number;
  stealCoins?: number;
  skipTurns?: number;
  pierceShield?: boolean;
}

interface QuizQuestion {
  id: string;
  type: QuestionKind;
  text: string;
  options: string[];
  answer: string;
  difficulty: Difficulty;
  subject?: SubjectId;
}

interface TeamDraft {
  name: string;
  members: string[];
}

interface BattleTeam extends TeamDraft {
  color: string;
  blocks: number;
  lostBlocks: number;
  coins: number;
  correct: number;
  answered: number;
  streak: number;
  memberTurn: number;
  inventory: Record<ItemId, number>;
  itemUses: Record<ItemId, number>;
  shield: number;
  doubleNext: boolean;
  skipTurns: number;
}

interface BattleGame {
  phase: Phase;
  teams: BattleTeam[];
  questions: QuizQuestion[];
  totalQuestions: number;
  questionNumber: number;
  turnTeamIndex: number;
  secondsPerQuestion: number;
  secondsLeft: number;
  targetBlocks: number;
  difficulty: Difficulty;
}

interface ShopItem {
  id: ItemId;
  name: string;
  icon: string;
  image: StaticImageData;
  price: number;
  stock: number;
  description: string;
  effect: ItemEffect;
}

const STORAGE_KEY = 'battle-block-quiz-v1';
const TEAM_COLORS = ['#fa795f', '#5278ee', '#24a786', '#aa72e8', '#edae38', '#35a9c5'];
const ITEMS: ShopItem[] = [
  { id: 'fire_blast', name: 'Fire Blast', icon: '🔥', image: FireBlastImage, price: 12, stock: 2, description: 'Hancurkan 2 balok dari satu lawan.', effect: { target: 'single', damage: 2 } },
  { id: 'mega_hammer', name: 'Mega Hammer', icon: '🔨', image: MegaHammerImage, price: 15, stock: 2, description: 'Hantam satu lawan hingga kehilangan 3 balok.', effect: { target: 'single', damage: 3 } },
  { id: 'tornado', name: 'Tornado', icon: '🌪️', image: TornadoImage, price: 20, stock: 2, description: 'Terjang semua lawan dan hancurkan 2 balok masing-masing.', effect: { target: 'all', damage: 2 } },
  { id: 'ice_breaker', name: 'Ice Breaker', icon: '❄️', image: IceBreakerImage, price: 18, stock: 2, description: 'Hancurkan 1 balok dan bekukan giliran satu lawan.', effect: { target: 'single', damage: 1, skipTurns: 1 } },
  { id: 'black_hole', name: 'Black Hole', icon: '🌀', image: BlackHoleImage, price: 25, stock: 2, description: 'Sedot hingga 4 balok dari satu lawan ke menaramu.', effect: { target: 'single', damage: 0, stealBlocks: 4 } },
  { id: 'volcano', name: 'Volcano', icon: '🌋', image: VolcanoImage, price: 25, stock: 2, description: 'Letuskan gunung dan hancurkan 3 balok semua lawan.', effect: { target: 'all', damage: 3 } },
  { id: 'acid_potion', name: 'Acid Potion', icon: '🧪', image: AcidPotionImage, price: 14, stock: 2, description: 'Kikis 1 balok dan ambil hingga 5 koin dari satu lawan.', effect: { target: 'single', damage: 1, stealCoins: 5 } },
  { id: 'balance_thief', name: 'Pencuri Saldo', icon: '🪙', image: AcidPotionImage, price: 10, stock: 2, description: 'Ambil hingga 5 koin dari saldo satu kelompok lawan.', effect: { target: 'single', damage: 0, stealCoins: 5 } },
  { id: 'cannon_shot', name: 'Cannon Shot', icon: '💣', image: CannonShotImage, price: 18, stock: 2, description: 'Tembakkan meriam untuk menghancurkan 3 balok lawan.', effect: { target: 'single', damage: 3 } },
  { id: 'sword_slash', name: 'Sword Slash', icon: '⚔️', image: SwordSlashImage, price: 13, stock: 2, description: 'Tebas dan hancurkan 2 balok dari satu lawan.', effect: { target: 'single', damage: 2 } },
  { id: 'ultimate_blast', name: 'Ultimate Blast', icon: '☄️', image: UltimateBlastImage, price: 35, stock: 2, description: 'Hancurkan 5 balok dan lewati giliran satu lawan.', effect: { target: 'single', damage: 5, skipTurns: 1 } },
  { id: 'mega_bomb', name: 'Mega Bomb', icon: '💥', image: MegaBombImage, price: 15, stock: 2, description: 'Ledakkan 2 balok dari setiap lawan.', effect: { target: 'all', damage: 2 } },
  { id: 'thunder_strike', name: 'Thunder Strike', icon: '⚡', image: ThunderStrikeImage, price: 12, stock: 2, description: 'Sambar satu lawan, hancurkan 1 balok, dan lewati giliran berikutnya.', effect: { target: 'single', damage: 1, skipTurns: 1 } },
  { id: 'meteor_strike', name: 'Meteor Strike', icon: '☄️', image: MeteorStrikeImage, price: 20, stock: 2, description: 'Hantam satu menara dengan meteor dan hancurkan 4 balok.', effect: { target: 'single', damage: 4 } },
  { id: 'earthquake', name: 'Earthquake', icon: '🌎', image: EarthquakeImage, price: 18, stock: 2, description: 'Guncang semua lawan: hancurkan 2 balok dan lewati giliran mereka.', effect: { target: 'all', damage: 2, skipTurns: 1 } },
  { id: 'laser_beam', name: 'Laser Beam', icon: '🔆', image: LaserBeamImage, price: 10, stock: 2, description: 'Laser menembus perisai dan menghancurkan 2 balok lawan.', effect: { target: 'single', damage: 2, pierceShield: true } },
];
const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Mudah' },
  { value: 'medium', label: 'Sedang' },
  { value: 'hard', label: 'Sulit' },
  { value: 'very_hard', label: 'Sangat sulit' },
];

function mapQuestion(question: Question): QuizQuestion {
  return {
    id: question.id,
    type: question.type === 'true_false' || question.type === 'short_answer' ? question.type : 'multiple_choice',
    text: question.text,
    options: question.type === 'true_false' ? ['Benar', 'Salah'] : question.options ?? [],
    answer: question.correctAnswer.replace(/^[A-D]\.\s*/, ''),
    difficulty: question.difficulty,
    subject: question.subject,
  };
}

const EMPTY_INVENTORY = (): Record<ItemId, number> => ({
  fire_blast: 0, mega_hammer: 0, tornado: 0, ice_breaker: 0, black_hole: 0,
  volcano: 0, acid_potion: 0, balance_thief: 0, cannon_shot: 0, sword_slash: 0, ultimate_blast: 0,
  mega_bomb: 0, thunder_strike: 0, meteor_strike: 0, earthquake: 0, laser_beam: 0,
});
const EMPTY_USES = (): Record<ItemId, number> => ({
  fire_blast: 0, mega_hammer: 0, tornado: 0, ice_breaker: 0, black_hole: 0,
  volcano: 0, acid_potion: 0, balance_thief: 0, cannon_shot: 0, sword_slash: 0, ultimate_blast: 0,
  mega_bomb: 0, thunder_strike: 0, meteor_strike: 0, earthquake: 0, laser_beam: 0,
});

function normalizeAnswer(value: string) {
  return value.trim().toLocaleLowerCase('id').replace(/[.,;:!?'"()]/g, '').replace(/\s+/g, ' ');
}

function shuffled<T>(values: T[]): T[] {
  const items = [...values];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function getRankedTeams(teams: BattleTeam[]) {
  return [...teams].sort((a, b) => b.blocks - a.blocks || b.correct - a.correct || b.coins - a.coins);
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function playFeedbackSound(correct: boolean) {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return;
  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = correct ? 740 : 190;
  volume.gain.setValueAtTime(0.13, context.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.22);
  oscillator.onended = () => { void context.close(); };
}

export default function BattleBlockQuiz() {
  const router = useRouter();
  const [game, setGame] = useState<BattleGame | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [teamCount, setTeamCount] = useState(3);
  const [drafts, setDrafts] = useState<TeamDraft[]>(() => Array.from({ length: 6 }, (_, index) => ({
    name: `Kelompok ${index + 1}`,
    members: ['Anggota 1', 'Anggota 2', 'Anggota 3'],
  })));
  const [questionCount, setQuestionCount] = useState(12);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(30);
  const [targetBlocks, setTargetBlocks] = useState(50);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectId[]>(DEFAULT_SUBJECTS);
  const [customQuestions, setCustomQuestions] = useState<QuizQuestion[]>([]);
  const [newQuestionType, setNewQuestionType] = useState<QuestionKind>('multiple_choice');
  const [newQuestionSubject, setNewQuestionSubject] = useState<SubjectId>('bahasa_arab');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswer, setNewQuestionAnswer] = useState('');
  const [newQuestionOptions, setNewQuestionOptions] = useState('Pilihan A, Pilihan B, Pilihan C, Pilihan D');
  const [questionEditorOpen, setQuestionEditorOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'shop' | 'teacher' | null>(null);
  const [shopTeamId, setShopTeamId] = useState(0);
  const [itemToUse, setItemToUse] = useState<ItemId | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [notice, setNotice] = useState('');
  const answerLock = useRef(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (
          parsed && typeof parsed === 'object' &&
          'teams' in parsed && Array.isArray(parsed.teams) &&
          'questions' in parsed && Array.isArray(parsed.questions)
        ) {
          const savedGame = parsed as BattleGame;
          startTransition(() => setGame({
            ...savedGame,
            teams: savedGame.teams.map(savedTeam => ({
              ...savedTeam,
              inventory: { ...EMPTY_INVENTORY(), ...savedTeam.inventory },
              itemUses: { ...EMPTY_USES(), ...savedTeam.itemUses },
            })),
            targetBlocks: savedGame.targetBlocks === 100 ? 100 : 50,
          }));
        } else {
          startTransition(() => setLoadError('Data permainan tersimpan tidak valid. Mulai permainan baru untuk melanjutkan.'));
        }
      }
    } catch (error) {
      console.error('Gagal memuat progres Battle Block Quiz dari penyimpanan lokal.', error);
      startTransition(() => setLoadError('Progres permainan tidak dapat dibaca dari penyimpanan lokal.'));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (game) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
      if (storageError) startTransition(() => setStorageError(''));
    } catch (error) {
      console.error('Gagal menyimpan progres Battle Block Quiz ke penyimpanan lokal.', error);
      if (!storageError) startTransition(() => setStorageError('Progres belum berhasil disimpan di perangkat ini.'));
    }
  }, [game, ready, storageError]);

  const team = game?.teams[game.turnTeamIndex];
  const question = game?.questions[game.questionNumber % game.questions.length];
  const member = team?.members[team.memberTurn];
  const canUseInventory = game?.phase === 'playing' && game.turnTeamIndex === shopTeamId;
  const rankedTeams = useMemo(() => game ? getRankedTeams(game.teams) : [], [game]);
  const selectedBuiltInQuestions = useMemo(
    () => getQuestionsBySubjects(selectedSubjects).map(mapQuestion),
    [selectedSubjects],
  );
  const selectedCustomQuestions = useMemo(
    () => customQuestions.filter(item => item.subject && selectedSubjects.includes(item.subject)),
    [customQuestions, selectedSubjects],
  );
  const totalAvailableQuestions = useMemo(
    () => new Set([...selectedBuiltInQuestions, ...selectedCustomQuestions].map(item => item.id)).size,
    [selectedBuiltInQuestions, selectedCustomQuestions],
  );

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 2800);
  }

  function updateDraft(index: number, patch: Partial<TeamDraft>) {
    setDrafts(current => current.map((draft, i) => i === index ? { ...draft, ...patch } : draft));
  }

  function updateMember(index: number, memberIndex: number, name: string) {
    setDrafts(current => current.map((draft, i) => i === index
      ? { ...draft, members: draft.members.map((memberName, j) => j === memberIndex ? name : memberName) }
      : draft));
  }

  function setMemberCount(index: number, count: number) {
    setDrafts(current => current.map((draft, i) => i === index
      ? { ...draft, members: Array.from({ length: count }, (_, j) => draft.members[j] ?? `Anggota ${j + 1}`) }
      : draft));
  }

  function toggleSubject(subjectId: SubjectId) {
    if (selectedSubjects.includes(subjectId)) {
      if (selectedSubjects.length === 1) {
        showNotice('Pilih minimal satu mata pelajaran.');
        return;
      }
      setSelectedSubjects(current => current.filter(subject => subject !== subjectId));
      return;
    }
    setSelectedSubjects(current => [...current, subjectId]);
  }

  function addCustomQuestion() {
    const text = newQuestionText.trim();
    const answer = newQuestionAnswer.trim();
    const options = newQuestionType === 'true_false'
      ? ['Benar', 'Salah']
      : newQuestionType === 'multiple_choice'
        ? newQuestionOptions.split(',').map(option => option.trim()).filter(Boolean)
        : [];
    if (!text || !answer || (newQuestionType === 'multiple_choice' && options.length < 2)) {
      showNotice('Lengkapi teks, jawaban, dan minimal dua pilihan untuk soal pilihan ganda.');
      return;
    }
    if (newQuestionType === 'multiple_choice' && !options.some(option => normalizeAnswer(option) === normalizeAnswer(answer))) {
      showNotice('Jawaban benar harus sama dengan salah satu pilihan.');
      return;
    }
    setCustomQuestions(current => [...current, {
      id: `custom-${Date.now()}`,
      type: newQuestionType,
      text,
      answer,
      options,
      difficulty,
      subject: newQuestionSubject,
    }]);
    setNewQuestionText('');
    setNewQuestionAnswer('');
    showNotice('Soal berhasil ditambahkan ke bank kuis.');
  }

  function startGame() {
    if (!selectedSubjects.length) {
      showNotice('Pilih minimal satu mata pelajaran.');
      return;
    }
    const cleanTeams = drafts.slice(0, teamCount).map(draft => ({
      ...draft,
      name: draft.name.trim(),
      members: draft.members.map(name => name.trim()).filter(Boolean),
    }));
    if (cleanTeams.some(draft => !draft.name || draft.members.length === 0)) {
      showNotice('Setiap kelompok harus memiliki nama dan minimal satu anggota.');
      return;
    }
    const preferredQuestions = [
      ...selectedBuiltInQuestions.filter(item => item.difficulty === difficulty),
      ...selectedCustomQuestions.filter(item => item.difficulty === difficulty),
    ];
    const otherQuestions = [
      ...selectedBuiltInQuestions.filter(item => item.difficulty !== difficulty),
      ...selectedCustomQuestions.filter(item => item.difficulty !== difficulty),
    ];
    const preferred = Array.from(new Map(preferredQuestions.map(item => [item.id, item])).values());
    const other = Array.from(new Map(otherQuestions.map(item => [item.id, item])).values());
    const available = [...shuffled(preferred), ...shuffled(other)];
    if (!available.length) {
      showNotice('Bank soal kosong. Tambahkan soal terlebih dahulu.');
      return;
    }
    const selectedQuestions = shuffled(available).slice(0, Math.min(questionCount, available.length));
    const teams = cleanTeams.map((draft, index): BattleTeam => ({
      ...draft,
      color: TEAM_COLORS[index],
      blocks: 0,
      lostBlocks: 0,
      coins: 0,
      correct: 0,
      answered: 0,
      streak: 0,
      memberTurn: 0,
      inventory: EMPTY_INVENTORY(),
      itemUses: EMPTY_USES(),
      shield: 0,
      doubleNext: false,
      skipTurns: 0,
    }));
    setLoadError('');
    setFeedback(null);
    answerLock.current = false;
    setGame({
      phase: 'playing',
      teams,
      questions: selectedQuestions,
      totalQuestions: selectedQuestions.length,
      questionNumber: 0,
      turnTeamIndex: 0,
      secondsPerQuestion,
      secondsLeft: secondsPerQuestion,
      targetBlocks,
      difficulty,
    });
  }

  const submitAnswer = useCallback((value: string) => {
    if (!game || !question || !team || answerLock.current || game.phase !== 'playing') return;
    answerLock.current = true;
    const isCorrect = normalizeAnswer(value) === normalizeAnswer(question.answer);
    const hasAnswer = value.trim().length > 0;
    playFeedbackSound(isCorrect);
    setFeedback({
      correct: isCorrect,
      message: isCorrect
        ? 'Jawaban tepat! Balok masuk ke menara!'
        : hasAnswer
          ? 'Jawaban salah. Saldo berkurang 1 koin.'
          : 'Waktu habis. Giliran berpindah tanpa mengurangi saldo.',
    });
    setGame(previous => {
      if (!previous || previous.phase !== 'playing') return previous;
      const teams = previous.teams.map((currentTeam, index) => {
        if (index !== previous.turnTeamIndex) return currentTeam;
        const correct = isCorrect;
        const streak = correct ? currentTeam.streak + 1 : 0;
        const doubleActive = currentTeam.doubleNext;
        const blocksEarned = correct ? (doubleActive ? 2 : 1) : 0;
        const streakBonus = correct && streak % 3 === 0 ? 3 : 0;
        const memberTurn = (currentTeam.memberTurn + 1) % currentTeam.members.length;
        return {
          ...currentTeam,
          blocks: currentTeam.blocks + blocksEarned,
          coins: Math.max(0, currentTeam.coins + (correct ? 2 + streakBonus : hasAnswer ? -1 : 0)),
          correct: currentTeam.correct + (correct ? 1 : 0),
          answered: currentTeam.answered + 1,
          streak,
          memberTurn,
          doubleNext: false,
        };
      });
      const questionNumber = previous.questionNumber + 1;
      if (teams.some(currentTeam => currentTeam.blocks >= previous.targetBlocks)) {
        return { ...previous, teams, questionNumber, phase: 'finished' };
      }
      let nextTeamIndex = (previous.turnTeamIndex + 1) % teams.length;
      let checked = 0;
      while (teams[nextTeamIndex].skipTurns > 0 && checked < teams.length) {
        teams[nextTeamIndex] = { ...teams[nextTeamIndex], skipTurns: teams[nextTeamIndex].skipTurns - 1 };
        nextTeamIndex = (nextTeamIndex + 1) % teams.length;
        checked++;
      }
      return {
        ...previous,
        teams,
        questionNumber,
        turnTeamIndex: nextTeamIndex,
        secondsLeft: previous.secondsPerQuestion,
      };
    });
    window.setTimeout(() => {
      setFeedback(null);
      answerLock.current = false;
    }, 1250);
  }, [game, question, team]);

  useEffect(() => {
    if (!game || game.phase !== 'playing' || feedback || game.secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      if (game.secondsLeft === 1) {
        submitAnswer('');
      } else {
        setGame(current => current ? { ...current, secondsLeft: current.secondsLeft - 1 } : current);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [game, feedback, submitAnswer]);

  function adjustQuestionTime(amount: number) {
    setGame(current => {
      if (!current) return current;
      const secondsPerQuestion = Math.max(5, Math.min(120, current.secondsPerQuestion + amount));
      return {
        ...current,
        secondsPerQuestion,
        secondsLeft: Math.min(secondsPerQuestion, current.secondsLeft + amount),
      };
    });
  }

  function buyItem(item: ShopItem) {
    if (!game || !game.teams[shopTeamId]) return;
    const buyer = game.teams[shopTeamId];
    if (buyer.coins < item.price) {
      showNotice('Koin kelompok belum cukup untuk membeli item ini.');
      return;
    }
    if (buyer.itemUses[item.id] + buyer.inventory[item.id] >= item.stock) {
      showNotice(`Stok ${item.name} untuk kelompok ini sudah habis.`);
      return;
    }
    setGame(current => current ? {
      ...current,
      teams: current.teams.map((currentTeam, index) => index === shopTeamId
        ? {
          ...currentTeam,
          coins: currentTeam.coins - item.price,
          inventory: { ...currentTeam.inventory, [item.id]: currentTeam.inventory[item.id] + 1 },
        }
        : currentTeam),
    } : current);
    showNotice(`${item.icon} ${item.name} masuk ke inventaris ${buyer.name}.`);
  }

  function activateItem(itemId: ItemId, targetIndex?: number) {
    if (!game) return;
    const item = ITEMS.find(candidate => candidate.id === itemId);
    if (!item) return;
    const sourceIndex = shopTeamId;
    const source = game.teams[sourceIndex];
    const target = targetIndex === undefined ? undefined : game.teams[targetIndex];
    if (game.phase !== 'playing' || sourceIndex !== game.turnTeamIndex) {
      showNotice('Item hanya dapat digunakan saat giliran kelompokmu.');
      return;
    }
    if (!source || source.inventory[itemId] < 1) {
      showNotice('Item tidak tersedia di inventaris.');
      return;
    }
    if (item.effect.target === 'single' && !target) {
      showNotice('Pilih kelompok lawan sebagai target item.');
      return;
    }
    if (targetIndex === sourceIndex) {
      showNotice('Kelompok tidak dapat menyerang dirinya sendiri.');
      return;
    }
    if (targetIndex !== undefined && !target) {
      showNotice('Kelompok target tidak ditemukan.');
      return;
    }
    const affectedTeams = item.effect.target === 'all'
      ? game.teams.filter((_, index) => index !== sourceIndex)
      : target ? [target] : [];
    const blockedTargets = affectedTeams.filter(victim => victim.shield > 0 && !item.effect.pierceShield);
    setGame(current => {
      if (!current || current.phase !== 'playing' || sourceIndex !== current.turnTeamIndex) return current;
      const teams = current.teams.map(currentTeam => ({
        ...currentTeam,
        inventory: { ...currentTeam.inventory },
        itemUses: { ...currentTeam.itemUses },
      }));
      const attacker = teams[sourceIndex];
      if (attacker.inventory[itemId] < 1) return current;
      attacker.inventory[itemId]--;
      attacker.itemUses[itemId]++;
      const targetIndexes = item.effect.target === 'all'
        ? teams.map((_, index) => index).filter(index => index !== sourceIndex)
        : targetIndex === undefined ? [] : [targetIndex];
      for (const index of targetIndexes) {
        const victim = teams[index];
        if (victim.shield > 0 && !item.effect.pierceShield) {
          victim.shield--;
          continue;
        }
        const blocksLost = Math.min(victim.blocks, item.effect.damage);
        victim.blocks -= blocksLost;
        victim.lostBlocks += blocksLost;
        const blocksStolen = Math.min(victim.blocks, item.effect.stealBlocks ?? 0);
        victim.blocks -= blocksStolen;
        victim.lostBlocks += blocksStolen;
        attacker.blocks += blocksStolen;
        const coinsStolen = Math.min(victim.coins, item.effect.stealCoins ?? 0);
        victim.coins -= coinsStolen;
        attacker.coins += coinsStolen;
        victim.skipTurns += item.effect.skipTurns ?? 0;
      }
      return {
        ...current,
        teams,
        phase: teams.some(currentTeam => currentTeam.blocks >= current.targetBlocks) ? 'finished' : current.phase,
      };
    });
    if (affectedTeams.length && blockedTargets.length === affectedTeams.length) {
      showNotice(`🛡️ Shield semua target menangkis ${item.name}!`);
    } else if (target) {
      showNotice(`⚡ ${source.name} menggunakan ${item.name} pada ${target.name}!`);
    } else {
      showNotice(`⚡ ${source.name} menggunakan ${item.name} pada semua lawan!`);
    }
    setItemToUse(null);
  }

  function updateCoins(teamIndex: number, amount: number) {
    setGame(current => current ? {
      ...current,
      teams: current.teams.map((currentTeam, index) => index === teamIndex
        ? { ...currentTeam, coins: Math.max(0, currentTeam.coins + amount) }
        : currentTeam),
    } : current);
  }

  function resetMemberTurn(teamIndex: number) {
    setGame(current => current ? {
      ...current,
      teams: current.teams.map((currentTeam, index) => index === teamIndex ? { ...currentTeam, memberTurn: 0 } : currentTeam),
    } : current);
    showNotice(`Urutan anggota ${game?.teams[teamIndex]?.name} dimulai kembali dari anggota pertama.`);
  }

  function startNewGame() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setStorageError('');
    } catch (error) {
      console.error('Gagal menghapus progres Battle Block Quiz.', error);
      setStorageError('Progres lama tidak dapat dihapus dari perangkat ini.');
    }
    setGame(null);
    setFeedback(null);
    setActiveModal(null);
    setCustomQuestions([]);
    setLoadError('');
  }

  if (!ready) return <div className="battle-shell flex min-h-screen items-center justify-center text-white">Menyiapkan arena…</div>;

  if (!game) {
    return (
      <main className="battle-shell min-h-screen px-4 py-8 text-slate-800 sm:px-7">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => router.push('/')} className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:-translate-x-1">
            <ArrowLeft size={17} /> Kembali ke menu
          </button>
          <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_.95fr]">
            <section className="battle-card overflow-hidden p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="battle-logo grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-4xl shadow-lg">🧱</div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[.2em] text-orange-500">Pertarungan kecerdasan antarkelompok</p>
                  <h1 className="battle-title mt-1 text-3xl leading-tight text-slate-900 sm:text-4xl">Battle Block Quiz</h1>
                </div>
              </div>
              <p className="mb-7 max-w-2xl text-sm leading-6 text-slate-500">Jawab soal bersama tim dan susun menara. Tim pertama yang mencapai target balok akan menang. Atur kelasmu lalu mulai bertanding!</p>
              {loadError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{loadError} <button className="ml-1 underline" onClick={() => { localStorage.removeItem(STORAGE_KEY); setLoadError(''); }}>Hapus data tersimpan</button></p>}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-extrabold text-slate-800">Jumlah kelompok</label>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">{teamCount} kelompok</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map(count => (
                    <button key={count} onClick={() => setTeamCount(count)} className={`rounded-xl border-2 py-3 text-lg font-black transition ${teamCount === count ? 'border-orange-400 bg-orange-50 text-orange-600 shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-orange-200'}`}>
                      {count}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                        {drafts.slice(0, teamCount).map((draft, index) => (
                  <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: TEAM_COLORS[index] }} />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">Tim {String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <input aria-label={`Nama kelompok ${index + 1}`} value={draft.name} onChange={event => updateDraft(index, { name: event.target.value })} className="battle-input mb-3 w-full font-bold" placeholder={`Kelompok ${index + 1}`} />
                    <label className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                      Jumlah anggota
                      <select value={draft.members.length} onChange={event => setMemberCount(index, Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-bold text-slate-700">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(count => <option key={count} value={count}>{count} anggota</option>)}
                      </select>
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {draft.members.map((name, memberIndex) => <input key={memberIndex} aria-label={`Nama anggota ${memberIndex + 1} kelompok ${index + 1}`} value={name} onChange={event => updateMember(index, memberIndex, event.target.value)} className="battle-input w-full text-sm" placeholder={`Nama anggota ${memberIndex + 1}`} />)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="space-y-5">
              <section className="battle-card p-6 sm:p-7">
                <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-900"><Sparkles size={20} className="text-orange-500" /> Aturan pertandingan</h2>
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  <label className="block"><span className="mb-2 block text-sm font-bold text-slate-600">Jumlah soal dalam rotasi</span><select value={questionCount} onChange={event => setQuestionCount(Number(event.target.value))} className="battle-input w-full">{[5, 8, 10, 12, 15, 20].map(count => <option key={count} value={count}>{count} pertanyaan</option>)}</select></label>
                  <label className="block"><span className="mb-2 block text-sm font-bold text-slate-600">Waktu menjawab</span><select value={secondsPerQuestion} onChange={event => setSecondsPerQuestion(Number(event.target.value))} className="battle-input w-full">{[15, 20, 30, 45, 60].map(seconds => <option key={seconds} value={seconds}>{seconds} detik</option>)}</select></label>
                  <label className="block"><span className="mb-2 block text-sm font-bold text-slate-600">Tingkat kesulitan</span><select value={difficulty} onChange={event => setDifficulty(event.target.value as Difficulty)} className="battle-input w-full">{DIFFICULTIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="block"><span className="mb-2 block text-sm font-bold text-slate-600">Target balok untuk menang</span><select value={targetBlocks} onChange={event => setTargetBlocks(Number(event.target.value))} className="battle-input w-full"><option value={50}>50 balok</option><option value={100}>100 balok</option></select></label>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 id="subject-selection-title" className="text-sm font-bold text-slate-600">Pilih mata pelajaran</h3>
                    <button type="button" onClick={() => setSelectedSubjects(DEFAULT_SUBJECTS)} className="text-xs font-black text-orange-600 hover:text-orange-700">Pilih semua</button>
                  </div>
                  <div role="group" aria-labelledby="subject-selection-title" className="grid gap-2 sm:grid-cols-2">
                    {SUBJECTS.map(subject => {
                      const selected = selectedSubjects.includes(subject.id);
                      const isLastSelected = selected && selectedSubjects.length === 1;
                      return <label key={subject.id} className={`flex items-center gap-2 rounded-xl border p-2.5 text-sm font-bold transition ${selected ? 'border-orange-300 bg-orange-50 text-orange-800' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={isLastSelected}
                          onChange={() => toggleSubject(subject.id)}
                          className="accent-orange-500"
                        />
                        <span>{subject.emoji}</span>
                        <span>{subject.id === 'bahasa_arab' ? 'B. Arab' : subject.name}</span>
                      </label>;
                    })}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{selectedSubjects.length} pelajaran dipilih · {totalAvailableQuestions} soal tersedia</p>
                </div>
                <div className="my-5 rounded-2xl bg-orange-50 p-4 text-sm leading-6 text-orange-900">
                  <p className="font-extrabold">🪙 Benar = 1 balok + 2 koin</p>
                  <p className="text-orange-800/80">Bonus streak 3 jawaban benar berturut-turut: +3 koin.</p>
                  <p className="text-orange-800/80">Soal dalam rotasi akan diulang sampai ada kelompok yang mencapai target balok.</p>
                </div>
                <button onClick={startGame} className="battle-primary flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-lg font-black text-white shadow-lg transition hover:-translate-y-0.5">
                  <Gamepad2 size={21} /> MULAI PERMAINAN
                </button>
                <p className="mt-3 text-center text-xs text-slate-400">Soal diambil dari pelajaran yang dipilih · progres tersimpan otomatis di perangkat</p>
              </section>
              <section className="battle-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div><h2 className="font-black text-slate-900">Bank pertanyaan</h2><p className="mt-1 text-xs text-slate-500">{customQuestions.length} soal buatan guru · pilihan ganda, benar/salah, isian</p></div>
                  <button onClick={() => setQuestionEditorOpen(value => !value)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-700">{questionEditorOpen ? 'Tutup editor' : '+ Tambah soal'}</button>
                </div>
                {questionEditorOpen && (
                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                    <select value={newQuestionType} onChange={event => setNewQuestionType(event.target.value as QuestionKind)} className="battle-input w-full">
                      <option value="multiple_choice">Pilihan ganda</option><option value="true_false">Benar atau salah</option><option value="short_answer">Isian singkat</option>
                    </select>
                    <label className="block text-xs font-bold text-slate-500">Mata pelajaran soal
                      <select value={newQuestionSubject} onChange={event => setNewQuestionSubject(event.target.value as SubjectId)} className="battle-input mt-2 w-full">
                        {SUBJECTS.map(subject => <option key={subject.id} value={subject.id}>{subject.id === 'bahasa_arab' ? 'B. Arab' : subject.name}</option>)}
                      </select>
                    </label>
                    <textarea value={newQuestionText} onChange={event => setNewQuestionText(event.target.value)} className="battle-input min-h-20 w-full resize-y" placeholder="Tulis pertanyaan..." />
                    {newQuestionType === 'multiple_choice' && <input value={newQuestionOptions} onChange={event => setNewQuestionOptions(event.target.value)} className="battle-input w-full" placeholder="Pilihan dipisahkan dengan koma" />}
                    {newQuestionType === 'true_false' ? <select value={newQuestionAnswer} onChange={event => setNewQuestionAnswer(event.target.value)} className="battle-input w-full"><option value="">Pilih kunci jawaban</option><option>Benar</option><option>Salah</option></select> : <input value={newQuestionAnswer} onChange={event => setNewQuestionAnswer(event.target.value)} className="battle-input w-full" placeholder="Kunci jawaban" />}
                    <div className="flex items-center gap-3">
                      <select value={difficulty} onChange={event => setDifficulty(event.target.value as Difficulty)} className="battle-input flex-1">{DIFFICULTIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                      <button onClick={addCustomQuestion} className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-orange-600">Simpan soal</button>
                    </div>
                    {customQuestions.map((item, index) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"><span className="line-clamp-1 pr-3 text-slate-600">{index + 1}. {item.text}</span><button aria-label={`Hapus soal ${index + 1}`} onClick={() => setCustomQuestions(current => current.filter(question => question.id !== item.id))} className="text-rose-500"><Trash2 size={15} /></button></div>)}
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
        {notice && <Toast message={notice} />}
      </main>
    );
  }

  if (game.phase === 'finished') {
    const winner = rankedTeams[0];
    return (
      <main className="battle-shell min-h-screen px-4 py-8 text-slate-800">
        <div className="mx-auto max-w-4xl">
          <div className="battle-card overflow-hidden p-7 text-center sm:p-12">
            <Confetti />
            <div className="mb-4 text-7xl">🏆</div>
            <p className="text-xs font-black uppercase tracking-[.24em] text-orange-500">{winner && winner.blocks >= game.targetBlocks ? `Target ${game.targetBlocks} balok tercapai` : 'Pertandingan selesai'}</p>
            <h1 className="battle-title mt-2 text-4xl text-slate-900 sm:text-5xl">Juara Battle Block!</h1>
            {winner && <div className="mx-auto mt-7 max-w-lg rounded-3xl p-6 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${winner.color}, #29325e)` }}>
              <div className="text-4xl">👑</div><h2 className="mt-2 text-2xl font-black">{winner.name}</h2>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-extrabold"><span>🧱 {winner.blocks} balok</span><span>✅ {winner.correct} benar</span><span>🪙 {winner.coins} koin</span></div>
            </div>}
            <div className="mx-auto mt-8 max-w-2xl text-left">
              <h3 className="mb-3 flex items-center gap-2 font-black text-slate-800"><Trophy size={18} className="text-amber-500" /> Peringkat akhir</h3>
              <div className="space-y-2">{rankedTeams.map((row, index) => <div key={row.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="flex items-center gap-3 font-bold text-slate-700"><b className="text-slate-400">0{index + 1}</b><span className="h-3 w-3 rounded-full" style={{ background: row.color }} />{row.name}</span><span className="text-sm font-black text-slate-600">🧱 {row.blocks} <span className="ml-2 text-emerald-600">✅ {row.correct}</span></span></div>)}</div>
            </div>
            <button onClick={startNewGame} className="battle-primary mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-black text-white"><RotateCcw size={17} /> Permainan baru</button>
          </div>
        </div>
        {notice && <Toast message={notice} />}
      </main>
    );
  }

  return (
    <main className="battle-shell min-h-screen px-3 py-4 text-slate-800 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-100 text-3xl shadow-sm">🧱</span><div><h1 className="battle-title text-xl text-slate-900 sm:text-2xl">BATTLE BLOCK QUIZ</h1><p className="text-xs font-bold text-slate-400">Pertarungan kecerdasan antarkelompok</p></div></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveModal('teacher')} className="battle-utility"><Hammer size={16} /> Panel guru</button>
            <button onClick={() => { setShopTeamId(game.turnTeamIndex); setActiveModal('shop'); }} className="battle-utility"><ShoppingBag size={16} /> Toko</button>
            {game.phase === 'playing' ? <button onClick={() => setGame(current => current ? { ...current, phase: 'paused' } : current)} className="battle-utility"><Pause size={16} /> Jeda</button> : <button onClick={() => setGame(current => current ? { ...current, phase: 'playing' } : current)} className="battle-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white"><Play size={16} /> Lanjutkan</button>}
          </div>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="battle-stat"><span className="battle-stat-icon bg-orange-100 text-orange-600"><Users size={20} /></span><span><small>Kelompok</small><b>{game.teams.length} bertanding</b></span></div>
          <div className="battle-stat"><span className="battle-stat-icon bg-blue-100 text-blue-600"><Clock3 size={20} /></span><span><small>Soal ke</small><b>{game.questionNumber + 1}</b></span></div>
          <div className="battle-stat"><span className="battle-stat-icon bg-violet-100 text-violet-600"><Trophy size={20} /></span><span><small>Target menang</small><b>{game.targetBlocks} balok</b></span></div>
          <div className="battle-stat"><span className="battle-stat-icon bg-amber-100 text-amber-600"><Trophy size={20} /></span><span><small>Pemimpin sementara</small><b>{rankedTeams[0]?.name} · {rankedTeams[0]?.blocks} balok</b></span></div>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.8fr)]">
          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black text-slate-900">Arena menara</h2><span className="rounded-full bg-white/75 px-3 py-1 text-xs font-bold text-slate-500">Urutan giliran berjalan otomatis</span></div>
            <div className="grid gap-3 grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3">
              {game.teams.map((currentTeam, index) => <TeamCard key={currentTeam.name} team={currentTeam} isCurrent={game.turnTeamIndex === index && game.phase === 'playing'} onOpenShop={() => { setShopTeamId(index); setActiveModal('shop'); }} />)}
            </div>
          </section>

          <aside className="battle-card overflow-hidden">
            <div className="battle-question-head px-5 py-4 text-white">
              <div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-[.16em] text-white/75">Giliran menjawab</span><span className={`rounded-full px-3 py-1 font-mono text-lg font-black ${game.secondsLeft <= 8 ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/15'}`}>{formatTime(game.secondsLeft)}</span></div>
              <p className="mt-2 text-lg font-black">{team?.name ?? 'Kelompok'} <span className="text-white/50">·</span> <span className="font-bold">{member ?? 'Anggota'}</span></p>
            </div>
            <div className="p-5">
              {game.phase === 'paused' ? <div className="py-12 text-center"><div className="mb-3 text-5xl">⏸️</div><h2 className="text-xl font-black text-slate-800">Permainan dijeda</h2><p className="mt-1 text-sm text-slate-500">Guru dapat melanjutkan dari panel di atas.</p><button onClick={() => setGame(current => current ? { ...current, phase: 'playing' } : current)} className="battle-primary mt-5 rounded-xl px-5 py-3 font-black text-white">Lanjutkan permainan</button></div>
                : question ? <>
                  <div className="mb-4 flex items-center justify-between text-xs font-bold text-slate-400"><span>SOAL {game.questionNumber + 1}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize">{DIFFICULTIES.find(item => item.value === question.difficulty)?.label}</span></div>
                  <h2 className="mb-5 text-lg font-extrabold leading-7 text-slate-800">{question.text}</h2>
                  <div className="space-y-2">
                    {question.options.length ? question.options.map((option, index) => <button key={option} disabled={Boolean(feedback)} onClick={() => submitAnswer(option)} className="battle-answer flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left text-sm font-bold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-xs font-black text-slate-400 shadow-sm">{String.fromCharCode(65 + index)}</span>{option}</button>)
                      : <form onSubmit={event => { event.preventDefault(); const value = new FormData(event.currentTarget).get('answer'); submitAnswer(typeof value === 'string' ? value : ''); }} className="flex gap-2"><input name="answer" autoComplete="off" disabled={Boolean(feedback)} className="battle-input min-w-0 flex-1" placeholder="Ketik jawabanmu..." /><button disabled={Boolean(feedback)} className="battle-primary rounded-xl px-4 font-black text-white">Jawab</button></form>}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-400"><span>✅ {team?.correct ?? 0} jawaban benar</span><span>🔥 Streak {team?.streak ?? 0}</span></div>
                </> : <div className="py-12 text-center text-slate-500">Tidak ada pertanyaan yang tersedia.</div>}
            </div>
          </aside>
        </div>

        <section className="battle-card mt-5 p-5">
          <div className="mb-4 flex items-center gap-2"><Trophy size={18} className="text-amber-500" /><h2 className="font-black text-slate-900">Leaderboard</h2></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rankedTeams.map((row, index) => <div key={row.name} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${index === 0 ? 'border-amber-200 bg-amber-50/80' : 'border-slate-100 bg-slate-50/70'}`}><span className="flex min-w-0 items-center gap-2 text-sm font-extrabold text-slate-700"><b className="text-slate-400">#{index + 1}</b><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.color }} /><span className="truncate">{row.name}</span></span><span className="shrink-0 text-xs font-black text-slate-500">🧱 {row.blocks} · ✅ {row.correct}</span></div>)}</div>
        </section>
      </div>

      <AnimatePresence>{feedback && <motion.div initial={{ opacity: 0, y: 12, scale: .92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className={`battle-feedback ${feedback.correct ? 'bg-emerald-500' : 'bg-rose-500'}`}><span className="text-3xl">{feedback.correct ? '🎉' : '💭'}</span><div><b>{feedback.correct ? 'KEREN!' : 'TETAP SEMANGAT!'}</b><p>{feedback.message}</p></div></motion.div>}</AnimatePresence>
      {notice && <Toast message={notice} />}
      {storageError && <div role="alert" className="fixed bottom-4 left-4 z-[70] rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white shadow-xl">{storageError}</div>}
      {activeModal === 'shop' && <Modal title={`Toko Item · ${game.teams[shopTeamId]?.name}`} onClose={() => { setActiveModal(null); setItemToUse(null); }}>
        <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3"><span className="font-bold text-amber-900">Saldo kelompok</span><b className="flex items-center gap-1 text-amber-700"><Coins size={16} /> {game.teams[shopTeamId]?.coins ?? 0}</b></div>
        <div className="grid gap-2 sm:grid-cols-2">{ITEMS.map(item => {
          const currentTeam = game.teams[shopTeamId];
          const purchasedCount = currentTeam.itemUses[item.id] + currentTeam.inventory[item.id];
          const remainingStock = item.stock - purchasedCount;
          const canBuy = currentTeam.coins >= item.price && remainingStock > 0;
          return <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <b className="text-sm text-slate-800">{item.icon} {item.name}</b>
                <p className="text-xs leading-4 text-slate-500">{item.description}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="text-xs font-black text-amber-700">
                <p>🪙 {item.price}</p>
                <p className="mt-1 text-slate-500">Stok {remainingStock} · Inventaris {currentTeam.inventory[item.id]}</p>
              </div>
              <button onClick={() => buyItem(item)} disabled={!canBuy} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-35">{remainingStock === 0 ? 'Stok habis' : 'Beli'}</button>
            </div>
          </div>;
        })}</div>
        {itemToUse && <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4"><h3 className="mb-3 font-black text-orange-900">Pilih target serangan</h3><div className="flex flex-wrap gap-2">{game.teams.map((target, index) => index !== shopTeamId && <button key={target.name} onClick={() => activateItem(itemToUse, index)} className="rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-orange-100">{target.name} · 🧱{target.blocks}</button>)}</div></div>}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="mb-1 text-sm font-black text-slate-700">Inventaris & gunakan</h3>
          <p className="mb-3 text-xs text-slate-500">{canUseInventory ? 'Item siap digunakan pada giliran ini.' : 'Item hanya dapat digunakan saat giliran kelompok ini.'}</p>
          <div className="flex flex-wrap gap-2">{ITEMS.map(item => game.teams[shopTeamId].inventory[item.id] > 0 && <button key={item.id} disabled={!canUseInventory} onClick={() => item.effect.target === 'single' ? setItemToUse(item.id) : activateItem(item.id)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-orange-300 disabled:cursor-not-allowed disabled:opacity-40">{item.icon} {item.name} ×{game.teams[shopTeamId].inventory[item.id]}</button>)}</div>
          {!ITEMS.some(item => game.teams[shopTeamId].inventory[item.id] > 0) && <p className="text-xs text-slate-400">Belum ada item. Belanja untuk mengisi inventaris.</p>}
        </div>
      </Modal>}
      {activeModal === 'teacher' && <Modal title="Panel Guru" onClose={() => setActiveModal(null)}>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {game.phase === 'playing' ? <button onClick={() => setGame(current => current ? { ...current, phase: 'paused' } : current)} className="rounded-xl bg-amber-100 p-3 text-sm font-black text-amber-800"><Pause size={16} className="mr-1 inline" /> Jeda permainan</button> : <button onClick={() => setGame(current => current ? { ...current, phase: 'playing' } : current)} className="rounded-xl bg-emerald-100 p-3 text-sm font-black text-emerald-800"><Play size={16} className="mr-1 inline" /> Lanjutkan</button>}
          <button onClick={() => { if (window.confirm('Akhiri permainan sekarang dan tampilkan pemenang?')) setGame(current => current ? { ...current, phase: 'finished' } : current); }} className="rounded-xl bg-rose-100 p-3 text-sm font-black text-rose-700"><FlagIcon /> Akhiri permainan</button>
        </div>
        <div className="mb-4 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-800">Soal ke-{game.questionNumber + 1} · Target menang: {game.targetBlocks} balok</div>
        <div className="mb-4 rounded-xl border border-slate-100 p-3">
          <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-black text-slate-800">Atur waktu menjawab</h3><span className="text-xs font-bold text-slate-500">{game.secondsPerQuestion} detik</span></div>
          <div className="flex gap-2"><button onClick={() => adjustQuestionTime(-5)} className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">−5 detik</button><button onClick={() => adjustQuestionTime(5)} className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">+5 detik</button></div>
        </div>
        {question && <form key={question.id} onSubmit={event => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const text = String(formData.get('questionText') ?? '').trim();
          const answer = String(formData.get('questionAnswer') ?? '').trim();
          const options = question.options.length
            ? String(formData.get('questionOptions') ?? '').split(',').map(option => option.trim()).filter(Boolean)
            : [];
          if (!text || !answer) {
            showNotice('Pertanyaan dan kunci jawaban tidak boleh kosong.');
            return;
          }
          if (options.length && !options.some(option => normalizeAnswer(option) === normalizeAnswer(answer))) {
            showNotice('Kunci jawaban harus cocok dengan salah satu pilihan.');
            return;
          }
          setGame(current => current ? {
            ...current,
            questions: current.questions.map((currentQuestion, index) => index === current.questionNumber % current.questions.length
              ? { ...currentQuestion, text, answer, ...(options.length ? { options } : {}) }
              : currentQuestion),
          } : current);
          showNotice('Pertanyaan dan kunci jawaban berhasil diperbarui.');
        }} className="mb-4 space-y-2 rounded-xl border border-slate-100 p-3">
          <h3 className="text-sm font-black text-slate-800">Edit pertanyaan aktif</h3>
          <textarea name="questionText" defaultValue={question.text} className="battle-input min-h-16 w-full resize-y text-xs" aria-label="Edit teks pertanyaan aktif" />
          {question.options.length > 0 && <input name="questionOptions" defaultValue={question.options.join(', ')} className="battle-input w-full text-xs" aria-label="Edit pilihan jawaban aktif" />}
          <input name="questionAnswer" defaultValue={question.answer} className="battle-input w-full text-xs" aria-label="Edit kunci jawaban aktif" />
          <button className="w-full rounded-lg bg-orange-500 px-3 py-2 text-xs font-black text-white">Simpan perubahan soal</button>
        </form>}
        <h3 className="mb-2 text-sm font-black text-slate-800">Statistik & kontrol kelompok</h3>
        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">{game.teams.map((row, index) => <div key={row.name} className="rounded-xl border border-slate-100 p-3"><div className="mb-2 flex items-center justify-between"><b className="text-sm" style={{ color: row.color }}>{row.name}</b><span className="text-xs font-bold text-slate-400">{row.correct}/{row.answered} benar · 🧱{row.blocks}</span></div><p className="mb-3 text-xs text-slate-500">{row.members.map((name, i) => `${i === row.memberTurn ? '▶ ' : ''}${name}`).join(' · ')}</p><div className="flex flex-wrap gap-2"><button onClick={() => updateCoins(index, 1)} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700">+1 koin</button><button onClick={() => updateCoins(index, -1)} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-black text-rose-700">−1 koin</button><button onClick={() => resetMemberTurn(index)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-600"><RotateCcw size={12} className="mr-1 inline" />Reset giliran anggota</button></div></div>)}</div>
      </Modal>}
    </main>
  );
}

function TeamCard({ team, isCurrent, onOpenShop }: { team: BattleTeam; isCurrent: boolean; onOpenShop: () => void }) {
  const inventoryCount = Object.values(team.inventory).reduce((total, count) => total + count, 0);
  const blocks = Array.from({ length: team.blocks });
  return <motion.article layout className={`battle-card overflow-hidden transition ${isCurrent ? 'battle-current-team' : ''}`}>
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5"><span className="h-3.5 w-3.5 shrink-0 rounded-full shadow-sm" style={{ background: team.color }} /><div className="min-w-0"><h3 className="truncate font-black text-slate-800">{team.name}</h3><p className="truncate text-[11px] font-semibold text-slate-400">{team.members.length} anggota · {team.members.map((name, index) => `${index === team.memberTurn ? '▶ ' : ''}${name}`).join(' · ')}</p></div></div>
      {isCurrent ? <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">Bermain</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">Menunggu</span>}
    </div>
    <div className="battle-tower-zone relative flex min-h-[160px] items-end justify-center px-3 pb-3">
      <div className="absolute bottom-3 h-2 w-[82%] rounded-full bg-slate-300/70" />
      {team.blocks === 0 ? <div className="relative mb-7 text-center"><span className="text-4xl opacity-55">🧱</span><p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Mulai menumpuk!</p></div> : <div className="relative z-10 mb-4 flex flex-col-reverse items-center">
        {blocks.map((_, index) => <motion.div initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} key={index} className="battle-block" style={{ backgroundColor: team.color, transform: `translateX(${index % 2 === 0 ? -1 : 1}px)` }}><span className="battle-block-shine" /></motion.div>)}
      </div>}
      {team.shield > 0 && <span className="absolute right-3 top-3 rounded-full bg-blue-100 px-2 py-1 text-xs font-black text-blue-700">🛡️ {team.shield}</span>}
      {team.doubleNext && <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">✨ DOUBLE AKTIF</span>}
    </div>
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
      <div className="flex gap-3 text-xs font-black"><span className="text-slate-700">🧱 {team.blocks}</span><span className="text-amber-600">🪙 {team.coins}</span><span className="text-emerald-600">✅ {team.correct}</span></div>
      <button onClick={onOpenShop} className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[11px] font-black text-orange-700 hover:bg-orange-100"><ShoppingBag size={12} /> Item {inventoryCount > 0 && `· ${inventoryCount}`}</button>
    </div>
  </motion.article>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <motion.div className="battle-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.section role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0, y: 20, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} className="battle-modal">
      <header className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-black text-slate-900">{title}</h2><button onClick={onClose} aria-label="Tutup" className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"><X size={18} /></button></header>
      {children}
    </motion.section>
  </motion.div>;
}

function Toast({ message }: { message: string }) {
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="battle-toast"><Check size={17} /> {message}</motion.div>;
}

function Confetti() {
  const colors = ['#fb7185', '#fbbf24', '#34d399', '#60a5fa', '#c084fc'];
  return <div aria-hidden="true" className="battle-confetti">{Array.from({ length: 42 }, (_, index) => <i key={index} style={{ left: `${(index * 37) % 100}%`, backgroundColor: colors[index % colors.length], animationDelay: `${(index % 9) * .12}s`, transform: `rotate(${index * 29}deg)` }} />)}</div>;
}

function FlagIcon() {
  return <span aria-hidden="true">🏁</span>;
}
