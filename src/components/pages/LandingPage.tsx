'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { MonopolyDuration, useMonopolyStore } from '@/store/monopolyStore';
import { TEAM_COLORS, TEAM_AVATARS, GameMode, DEFAULT_SUBJECTS, AdventurePathId, BoardMapId } from '@/types/game';
import { getAdventurePath, ADVENTURE_PATHS } from '@/data/adventureMap';

type SelectableMode = GameMode | 'monopoly';

type GameCard = {
  id: SelectableMode;
  icon: string;
  name: string;
  desc: string;
  accent: string;
};

const GAME_CARDS: GameCard[] = [
  { id: 'classic', icon: '🎲', name: 'Classic Board', desc: 'Papan START → FINISH klasik, giliran bergantian antar kelompok.', accent: 'from-yellow-400 to-orange-500' },
  { id: 'quiz_race', icon: '🏃', name: 'Quiz Race', desc: 'Kelompok hanya bergerak lewat jawaban soal yang benar.', accent: 'from-sky-400 to-blue-600' },
  { id: 'dice_adventure', icon: '🎯', name: 'Dice Adventure', desc: 'Jawab benar untuk mendapatkan giliran lempar dadu.', accent: 'from-emerald-400 to-teal-600' },
  { id: 'strategy_battle', icon: '⚔️', name: 'Strategy Battle', desc: 'Toko item dan duel intensif antar kelompok.', accent: 'from-rose-400 to-red-600' },
  { id: 'mystery_board', icon: '❓', name: 'Mystery Board', desc: 'Papan penuh kejutan dan kotak misteri acak.', accent: 'from-fuchsia-400 to-purple-600' },
  { id: 'monopoly', icon: '💰', name: 'Monopoli Petualang', desc: 'Keliling papan, beli wilayah, kumpulkan kekayaan.', accent: 'from-amber-400 to-orange-600' },
];

const PATH_CYCLE: AdventurePathId[] = ['hutan', 'sungai', 'kota'];

interface TeamDraft {
  name: string;
  color: string;
  avatar: string;
  pathId: AdventurePathId;
  members: Array<{ name: string; avatar: string }>;
}

const DEFAULT_TEAMS: TeamDraft[] = [
  {
    name: 'Kelompok Elang',
    color: TEAM_COLORS[1].value,
    avatar: '🦅',
    pathId: 'hutan',
    members: [{ name: 'Ahmad', avatar: '👦' }, { name: 'Ali', avatar: '👦' }, { name: 'Hasan', avatar: '👦' }],
  },
  {
    name: 'Kelompok Harimau',
    color: TEAM_COLORS[0].value,
    avatar: '🐯',
    pathId: 'sungai',
    members: [{ name: 'Fatimah', avatar: '👧' }, { name: 'Aisyah', avatar: '👧' }],
  },
  {
    name: 'Kelompok Serigala',
    color: TEAM_COLORS[2].value,
    avatar: '🐺',
    pathId: 'kota',
    members: [{ name: 'Umar', avatar: '👦' }, { name: 'Bilal', avatar: '👦' }, { name: 'Zaid', avatar: '👦' }],
  },
];

export default function LandingPage() {
  const router = useRouter();
  const startNewGame = useGameStore(s => s.startNewGame);
  const startMonopolyGame = useMonopolyStore(s => s.startGame);

  const [selectedMode, setSelectedMode] = useState<SelectableMode | null>(null);
  const [selectedMap, setSelectedMap] = useState<BoardMapId>('adventure');
  const [pathOverrides, setPathOverrides] = useState<Record<number, AdventurePathId>>({});
  const [teams, setTeams] = useState<TeamDraft[]>(DEFAULT_TEAMS);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(3);
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  const [memberInputs, setMemberInputs] = useState([{ name: '', avatar: '👦' }]);
  const [monopolyDuration, setMonopolyDuration] = useState<MonopolyDuration>({ type: 'rounds', value: 10 });

  const isMonopoly = selectedMode === 'monopoly';

  const handleAddTeam = () => {
    if (!newTeamName.trim() || memberInputs.every(m => !m.name.trim())) return;
    const validMembers = memberInputs.filter(m => m.name.trim());
    setTeams(prev => [...prev, {
      name: newTeamName.trim(),
      color: TEAM_COLORS[selectedColorIdx].value,
      avatar: selectedAvatar,
      pathId: PATH_CYCLE[prev.length % PATH_CYCLE.length],
      members: validMembers,
    }]);
    setNewTeamName('');
    setMemberInputs([{ name: '', avatar: '👦' }]);
  };

  const handlePlay = () => {
    if (!selectedMode || teams.length === 0) return;
    if (isMonopoly) {
      if (teams.length < 2) return;
      startMonopolyGame(
        teams.map(team => ({ name: team.name, color: team.color, avatar: team.avatar })),
        monopolyDuration,
        DEFAULT_SUBJECTS,
      );
      return;
    }
    startNewGame(
      'Quiz Board Adventure',
      teams.map((t, idx) => ({
        name: t.name,
        color: t.color,
        avatar: t.avatar,
        pathId: selectedMap === 'adventure' ? (pathOverrides[idx] ?? t.pathId ?? PATH_CYCLE[idx % PATH_CYCLE.length]) : t.pathId,
        members: t.members.map(m => ({ name: m.name, avatarEmoji: m.avatar })),
      })),
      {
        gameMode: selectedMode,
        movementMode: selectedMode === 'dice_adventure' ? 'dice' : selectedMode === 'quiz_race' ? 'challenge' : 'fixed',
        enableDice: selectedMode === 'dice_adventure',
        subjects: DEFAULT_SUBJECTS,
        boardMapId: selectedMap,
        totalTiles: selectedMap === 'adventure' ? 30 : 100,
      },
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="font-display text-4xl text-white md:text-5xl">Pilih Game</h1>
          <p className="mt-2 text-white/60">Pilih jenis permainan, lalu tekan Mulai.</p>
          <button
            onClick={() => router.push('/battle-block')}
            className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-orange-200/50 bg-gradient-to-r from-orange-400 to-rose-500 px-5 py-3 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110"
          >
            <span className="text-3xl">🧱</span>
            <span><span className="block text-sm font-black">BATTLE BLOCK QUIZ</span><span className="block text-xs text-white/85">Bangun menara, tantang kelompok lain</span></span>
          </button>
        </header>

        {/* Game selection */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {GAME_CARDS.map((mode, i) => {
            const isSelected = selectedMode === mode.id;
            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedMode(mode.id)}
                className={`rounded-2xl border p-4 text-left transition-all ${isSelected
                    ? 'border-white bg-white/20 shadow-xl ring-2 ring-white/60'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
              >
                <div className={`mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${mode.accent} text-2xl shadow`}>
                  {mode.icon}
                </div>
                <div className="font-bold text-white text-sm">{mode.name}</div>
                <div className="text-white/60 text-xs mt-0.5 leading-snug">{mode.desc}</div>
              </motion.button>
            );
          })}
        </div>

        {/* Map selection */}
        {selectedMode && !isMonopoly && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-white/15 bg-white/5 p-5"
          >
            <h2 className="mb-3 font-bold text-white">🗺️ Pilih Peta</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {([
                { id: 'adventure', name: '1. Peta Petualangan', emoji: '🗺️', desc: '3 jalur: Hutan, Sungai, Kota — 30 kotak' },
                { id: 'classic', name: '2. Papan Klasik', emoji: '🎲', desc: 'Grid ular tangga klasik — 100 kotak' },
              ] as Array<{ id: BoardMapId; name: string; emoji: string; desc: string }>).map(map => {
                const isSelected = selectedMap === map.id;
                return (
                  <button
                    key={map.id}
                    onClick={() => setSelectedMap(map.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      isSelected ? 'border-white bg-white/20 ring-2 ring-white/50' : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <span className="block font-bold text-sm text-white">{map.emoji} {map.name}</span>
                    <span className="block text-white/60 text-xs">{map.desc}</span>
                  </button>
                );
              })}
            </div>
            {selectedMap === 'adventure' && (
              <div className="mt-3">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/60">Jalur per kelompok</h3>
                <div className="space-y-1.5">
                  {teams.map((t, i) => {
                    const pathId = pathOverrides[i] ?? PATH_CYCLE[i % PATH_CYCLE.length];
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-32 truncate text-xs text-white/70">{t.avatar} {t.name}</span>
                        <div className="flex gap-1">
                          {ADVENTURE_PATHS.map(path => (
                            <button
                              key={path.id}
                              onClick={() => setPathOverrides(prev => ({ ...prev, [i]: path.id }))}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                pathId === path.id ? 'text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                              }`}
                              style={pathId === path.id ? { backgroundColor: path.labelColor } : undefined}
                            >
                              {path.emoji} {path.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Team list */}
        {selectedMode && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-white/15 bg-white/5 p-5"
          >
            <h2 className="mb-3 font-bold text-white">
              {isMonopoly ? '🎲 Kelompok Monopoli' : '🏆 Kelompok'} <span className="text-white/50 text-xs">({teams.length})</span>
            </h2>
            <div className="mb-4 space-y-2 max-h-56 overflow-y-auto pr-1">
              {teams.map((t, i) => {
                const pathDef = getAdventurePath(t.pathId || PATH_CYCLE[i % PATH_CYCLE.length]);
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-white/10 p-2.5">
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xl"
                      style={{ backgroundColor: t.color + '33', border: `2px solid ${t.color}` }}
                    >
                      {t.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-white">{t.name}</div>
                      <div className="truncate text-[11px] text-white/60">
                        {!isMonopoly && <span className="mr-1">{pathDef.emoji} {pathDef.name} ·</span>}
                        {t.members.map(m => m.name).join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={() => setTeams(prev => prev.filter((_, idx) => idx !== i))}
                      className="px-2 text-red-300 hover:text-red-200"
                      title="Hapus kelompok"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {teams.length === 0 && <p className="py-2 text-center text-xs text-amber-200">Tambahkan minimal 1 kelompok.</p>}
            </div>

            {teams.length < 6 && (
              <div className="space-y-2.5 rounded-xl bg-white/5 p-3">
                <input
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="Nama kelompok baru..."
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-purple-400"
                />
                <div className="flex flex-wrap gap-1.5">
                  {TEAM_COLORS.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedColorIdx(i)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${selectedColorIdx === i ? 'scale-125 border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {TEAM_AVATARS.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedAvatar(a)}
                      className={`rounded p-1 text-xl ${selectedAvatar === a ? 'bg-white/20' : ''}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {memberInputs.map((m, i) => (
                    <input
                      key={i}
                      value={m.name}
                      onChange={e => {
                        const updated = [...memberInputs];
                        updated[i] = { ...m, name: e.target.value };
                        setMemberInputs(updated);
                      }}
                      placeholder={`Anggota ${i + 1}...`}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none"
                    />
                  ))}
                </div>
                {memberInputs.length < 3 && (
                  <button
                    onClick={() => setMemberInputs(prev => [...prev, { name: '', avatar: '👦' }])}
                    className="text-xs text-purple-300 hover:text-purple-200"
                  >
                    + Anggota
                  </button>
                )}
                <button
                  onClick={handleAddTeam}
                  disabled={!newTeamName.trim()}
                  className="w-full rounded-lg bg-purple-600 py-2 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-40"
                >
                  + Tambah Kelompok
                </button>
              </div>
            )}
          </motion.section>
        )}

        {/* Monopoly duration */}
        {isMonopoly && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-5"
          >
            <h2 className="mb-3 font-bold text-amber-100">⏱️ Durasi Permainan</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([
                { label: '10 putaran', value: { type: 'rounds', value: 10 } },
                { label: '15 putaran', value: { type: 'rounds', value: 15 } },
                { label: '20 putaran', value: { type: 'rounds', value: 20 } },
                { label: 'Mode waktu', value: { type: 'time', value: 10 } },
              ] as Array<{ label: string; value: MonopolyDuration }>).map(option => {
                const isSelected = monopolyDuration.type === option.value.type && monopolyDuration.value === option.value.value;
                return (
                  <button
                    key={option.label}
                    onClick={() => setMonopolyDuration(option.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${isSelected ? 'border-amber-200 bg-amber-300/25 text-amber-100' : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {monopolyDuration.type === 'time' && (
              <label className="mt-3 flex items-center gap-3 text-xs text-white/70">
                Durasi pertandingan
                <select
                  value={monopolyDuration.value}
                  onChange={event => setMonopolyDuration({ type: 'time', value: Number(event.target.value) })}
                  className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white"
                >
                  <option value={5}>5 menit</option>
                  <option value={10}>10 menit</option>
                  <option value={15}>15 menit</option>
                  <option value={20}>20 menit</option>
                </select>
              </label>
            )}
          </motion.section>
        )}

        {/* Play button */}
        {selectedMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePlay}
              disabled={teams.length === 0 || (isMonopoly && teams.length < 2)}
              className="w-full max-w-md rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 py-4 font-display text-xl text-white shadow-lg transition hover:brightness-110 disabled:opacity-40"
            >
              {isMonopoly ? '🎲 Mulai Monopoli Petualang!' : '🎮 Mulai Permainan!'}
            </motion.button>
            {isMonopoly && teams.length < 2 && (
              <p className="mt-2 text-xs text-amber-200">Monopoli butuh minimal 2 kelompok.</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
