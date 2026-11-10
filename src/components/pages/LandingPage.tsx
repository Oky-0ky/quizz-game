'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { TEAM_COLORS, TEAM_AVATARS, GameMode, SUBJECTS, SubjectId, DEFAULT_SUBJECTS, BoardMapId, AdventurePathId } from '@/types/game';
import { QUESTION_BANK } from '@/data/gameData';
import { ADVENTURE_PATHS, BOARD_MAPS, getAdventurePath } from '@/data/adventureMap';

interface BgTile {
  emoji: string;
  size: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
}

const BG_TILES: BgTile[] = [
  { emoji: '🏆', top: '10%', left: '5%', size: 40 },
  { emoji: '🎲', top: '20%', right: '8%', size: 48 },
  { emoji: '⭐', top: '60%', left: '10%', size: 36 },
  { emoji: '🎯', top: '70%', right: '5%', size: 44 },
  { emoji: '🗺️', top: '40%', left: '3%', size: 32 },
  { emoji: '💎', bottom: '15%', left: '15%', size: 38 },
  { emoji: '🎪', bottom: '10%', right: '12%', size: 42 },
  { emoji: '🎨', top: '15%', left: '20%', size: 30 },
  { emoji: '⚔️', top: '80%', left: '30%', size: 36 },
  { emoji: '🛡️', top: '5%', right: '25%', size: 34 },
];

export default function LandingPage() {
  const startNewGame = useGameStore(s => s.startNewGame);

  const [step, setStep] = useState<'home' | 'setup' | 'teams'>('home');
  const [gameName, setGameName] = useState('Quiz Board Adventure');
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectId[]>(DEFAULT_SUBJECTS);
  const [selectedMap, setSelectedMap] = useState<BoardMapId>('adventure');
  const [selectedPath, setSelectedPath] = useState<AdventurePathId>('hutan');
  const [teams, setTeams] = useState<Array<{
    name: string;
    color: string;
    avatar: string;
    pathId: AdventurePathId;
    members: Array<{ name: string; avatar: string }>;
  }>>([
    {
      name: 'Kelompok Elang',
      color: TEAM_COLORS[1].value, // Biru
      avatar: '🦅',
      pathId: 'hutan',
      members: [{ name: 'Ahmad', avatar: '👦' }, { name: 'Ali', avatar: '👦' }, { name: 'Hasan', avatar: '👦' }],
    },
    {
      name: 'Kelompok Harimau',
      color: TEAM_COLORS[0].value, // Merah
      avatar: '🐯',
      pathId: 'sungai',
      members: [{ name: 'Fatimah', avatar: '👧' }, { name: 'Aisyah', avatar: '👧' }],
    },
    {
      name: 'Kelompok Serigala',
      color: TEAM_COLORS[2].value, // Hijau
      avatar: '🐺',
      pathId: 'kota',
      members: [{ name: 'Umar', avatar: '👦' }, { name: 'Bilal', avatar: '👦' }, { name: 'Zaid', avatar: '👦' }],
    },
  ]);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(3);
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  const [memberInputs, setMemberInputs] = useState([{ name: '', avatar: '👦' }]);

  const handleStart = () => {
    setStep('teams');
  };

  const handleAddTeam = () => {
    if (!newTeamName.trim() || memberInputs.every(m => !m.name.trim())) return;
    const validMembers = memberInputs.filter(m => m.name.trim());
    const PATH_CYCLE: AdventurePathId[] = ['hutan', 'sungai', 'kota'];
    const assignedPath = PATH_CYCLE[teams.length % PATH_CYCLE.length];
    setTeams(prev => [...prev, {
      name: newTeamName,
      color: TEAM_COLORS[selectedColorIdx].value,
      avatar: selectedAvatar,
      pathId: assignedPath,
      members: validMembers,
    }]);
    setNewTeamName('');
    setMemberInputs([{ name: '', avatar: '👦' }]);
  };

  const handlePlayGame = () => {
    const PATH_CYCLE: AdventurePathId[] = ['hutan', 'sungai', 'kota'];
    startNewGame(
      gameName,
      teams.map((t, idx) => ({
        name: t.name,
        color: t.color,
        avatar: t.avatar,
        pathId: t.pathId || PATH_CYCLE[idx % PATH_CYCLE.length],
        members: t.members.map(m => ({ name: m.name, avatarEmoji: m.avatar })),
      })),
      {
        gameMode: selectedMode,
        movementMode: selectedMode === 'dice_adventure' ? 'dice' : selectedMode === 'quiz_race' ? 'challenge' : 'fixed',
        enableDice: selectedMode === 'dice_adventure',
        subjects: selectedSubjects.length > 0 ? selectedSubjects : DEFAULT_SUBJECTS,
        boardMapId: selectedMap,
        adventurePathId: selectedPath,
      }
    );
  };

  if (step === 'teams') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-2xl border border-white/20">
          <h2 className="font-display text-3xl text-white mb-6 text-center">🏆 Atur Kelompok</h2>
          
          {/* Existing Teams */}
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {teams.map((t, i) => {
              const PATH_CYCLE: AdventurePathId[] = ['hutan', 'sungai', 'kota'];
              const pathId = t.pathId || PATH_CYCLE[i % PATH_CYCLE.length];
              const pathDef = getAdventurePath(pathId);
              return (
                <div key={i} className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 border border-white/10">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: t.color + '33', border: `2px solid ${t.color}` }}>
                    {t.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-base truncate">{t.name}</span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 shadow-sm" style={{ backgroundColor: pathDef.labelColor + 'dd', borderColor: pathDef.ribbon, color: '#fff' }}>
                        {pathDef.emoji} Jalur {i + 1}: {pathDef.name}
                      </span>
                    </div>
                    <div className="text-white/70 text-xs mt-0.5">{t.members.map(m => m.name).join(', ')}</div>
                  </div>
                  <button onClick={() => setTeams(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 text-xl px-2" title="Hapus Kelompok">✕</button>
                </div>
              );
            })}
          </div>

          {/* Add Team Form */}
          {teams.length < 4 && (
            <div className="bg-white/5 rounded-2xl p-4 mb-6 space-y-3">
              <h3 className="text-white font-bold">+ Tambah Kelompok</h3>
              <input
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="Nama kelompok..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/40 outline-none focus:border-purple-400"
              />
              <div className="flex gap-2 flex-wrap">
                {TEAM_COLORS.map((c, i) => (
                  <button key={i} onClick={() => setSelectedColorIdx(i)} className={`w-7 h-7 rounded-full border-2 transition-transform ${selectedColorIdx === i ? 'scale-125 border-white' : 'border-transparent'}`} style={{ backgroundColor: c.value }} />
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {TEAM_AVATARS.map((a, i) => (
                  <button key={i} onClick={() => setSelectedAvatar(a)} className={`text-2xl p-1 rounded-lg ${selectedAvatar === a ? 'bg-white/20' : ''}`}>{a}</button>
                ))}
              </div>
              {memberInputs.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={m.name}
                    onChange={e => {
                      const updated = [...memberInputs];
                      updated[i] = { ...m, name: e.target.value };
                      setMemberInputs(updated);
                    }}
                    placeholder={`Anggota ${i + 1}...`}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/40 outline-none text-sm"
                  />
                </div>
              ))}
              {memberInputs.length < 3 && (
                <button onClick={() => setMemberInputs(prev => [...prev, { name: '', avatar: '👦' }])} className="text-purple-300 text-sm hover:text-purple-200">+ Anggota</button>
              )}
              <button onClick={handleAddTeam} disabled={!newTeamName.trim()} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl transition-colors">
                Tambah Kelompok
              </button>
            </div>
          )}

          <button
            onClick={handlePlayGame}
            disabled={teams.length === 0}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 text-white font-display text-xl py-4 rounded-2xl transition-all transform hover:scale-105 shadow-lg"
          >
            🎮 Mulai Permainan!
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-2xl border border-white/20">
          <h2 className="font-display text-3xl text-white mb-6 text-center">🎮 Buat Permainan</h2>
          <div className="space-y-4">
            <div>
              <label className="text-white/80 text-sm font-semibold mb-1 block">Nama Permainan</label>
              <input
                value={gameName}
                onChange={e => setGameName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="text-white/80 text-sm font-semibold mb-2 block">Mata Pelajaran</label>
              <div className="space-y-2">
                {SUBJECTS.map(subject => {
                  const isActive = selectedSubjects.includes(subject.id);
                  const count = QUESTION_BANK.filter(q => q.subject === subject.id).length;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => setSelectedSubjects(prev =>
                        prev.includes(subject.id)
                          ? prev.filter(id => id !== subject.id)
                          : [...prev, subject.id]
                      )}
                      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border transition-all text-left ${
                        isActive
                          ? 'bg-purple-600/40 border-purple-400'
                          : 'bg-white/5 border-white/15 hover:border-white/30'
                      }`}
                    >
                      <span className="text-2xl">{subject.emoji}</span>
                      <span className="flex-1">
                        <span className="block text-white font-bold text-sm">{subject.name}</span>
                        <span className="block text-white/60 text-xs">{subject.desc} · {count} soal</span>
                      </span>
                      <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs font-bold ${
                        isActive ? 'bg-purple-500 border-purple-300 text-white' : 'border-white/40 text-transparent'
                      }`}>✓</span>
                    </button>
                  );
                })}
              </div>
              {selectedSubjects.length === 0 && (
                <p className="text-amber-300 text-xs mt-2">Pilih minimal 1 mata pelajaran.</p>
              )}
              <button
                onClick={() => setSelectedSubjects(DEFAULT_SUBJECTS)}
                className="text-purple-300 text-xs mt-2 hover:text-purple-200"
              >
                Pilih semua mata pelajaran
              </button>
            </div>
            <div>
              <label className="text-white/80 text-sm font-semibold mb-2 block">Pilih Peta</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BOARD_MAPS.map(map => (
                  <button
                    key={map.id}
                    onClick={() => setSelectedMap(map.id)}
                    className={`text-left rounded-xl px-4 py-3 border transition-all ${
                      selectedMap === map.id
                        ? 'bg-emerald-600/40 border-emerald-300'
                        : 'bg-white/5 border-white/15 hover:border-white/30'
                    }`}
                  >
                    <span className="text-white font-bold text-sm block">{map.emoji} {map.name}</span>
                    <span className="text-white/60 text-xs">{map.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            {selectedMap === 'adventure' && (
              <div>
                <label className="text-white/80 text-sm font-semibold mb-2 block">Pilih Jalur</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ADVENTURE_PATHS.map(path => (
                    <button
                      key={path.id}
                      onClick={() => setSelectedPath(path.id)}
                      className={`text-left rounded-xl px-3 py-2.5 border transition-all ${
                        selectedPath === path.id
                          ? 'border-white/70'
                          : 'bg-white/5 border-white/15 hover:border-white/30'
                      }`}
                      style={selectedPath === path.id ? { backgroundColor: path.labelColor + 'cc' } : undefined}
                    >
                      <span className="text-white font-bold text-sm block">{path.emoji} {path.name}</span>
                      <span className="text-white/70 text-xs">{path.tagline}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleStart}
              disabled={selectedSubjects.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:hover:scale-100 text-white font-display text-xl py-4 rounded-2xl transition-all transform hover:scale-105 shadow-lg"
            >
              Lanjut →
            </button>
            <button onClick={() => setStep('home')} className="w-full text-white/60 hover:text-white/80 py-2 transition-colors">
              ← Kembali
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Home / Landing
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Animated background elements */}
      {BG_TILES.map((tile, i) => (
        <motion.div
          key={i}
          className="absolute select-none pointer-events-none"
          style={{ top: tile.top, left: tile.left, right: tile.right, bottom: tile.bottom, fontSize: tile.size }}
          animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
        >
          {tile.emoji}
        </motion.div>
      ))}

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.1) 60px, rgba(255,255,255,0.1) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.1) 60px, rgba(255,255,255,0.1) 61px)' }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, type: 'spring' }}>
          {/* Logo/Title */}
          <div className="mb-4">
            <motion.div
              className="text-7xl mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              🏆
            </motion.div>
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl text-white mb-2 drop-shadow-2xl">
            QUIZ BOARD
          </h1>
          <h1 className="font-display text-5xl md:text-7xl bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4 drop-shadow-2xl">
            ADVENTURE
          </h1>
          
          <p className="text-white/80 text-lg md:text-xl mb-2 font-semibold">
            Jawab Soal, Jalankan Pion, Kuasai Permainan!
          </p>
          <p className="text-white/60 text-sm md:text-base mb-10 max-w-lg">
            Game kuis berkelompok dengan konsep papan petualangan. Jawab pertanyaan, gerakkan pion, kumpulkan koin, dan jadilah yang pertama mencapai FINISH!
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {['🎲 Papan Petualangan', '👥 2-4 Kelompok', '❓ 25+ Soal', '🏪 Toko Item', '⚔️ Sistem Duel', '🎁 Kotak Spesial'].map(f => (
              <span key={f} className="glass text-white/90 text-sm font-semibold px-4 py-2 rounded-full border border-white/30">
                {f}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep('setup')}
              className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 text-white font-display text-2xl px-10 py-5 rounded-2xl shadow-2xl hover:shadow-orange-500/30 transition-shadow"
            >
              🚀 Mulai Bermain!
            </motion.button>
          </div>
        </motion.div>

        {/* Game mode cards */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl w-full"
        >
          {[
            { id: 'classic', icon: '🎲', name: 'Classic Board', desc: 'START → FINISH klasik' },
            { id: 'quiz_race', icon: '🏃', name: 'Quiz Race', desc: 'Semua dari jawaban soal' },
            { id: 'dice_adventure', icon: '🎲', name: 'Dice Adventure', desc: 'Jawab benar = lempar dadu' },
            { id: 'strategy_battle', icon: '⚔️', name: 'Strategy Battle', desc: 'Item & duel intensif' },
            { id: 'mystery_board', icon: '❓', name: 'Mystery Board', desc: 'Penuh kejutan acak' },
            { id: 'custom', icon: '⚙️', name: 'Custom Mode', desc: 'Atur sendiri semua aturan' },
          ].map((mode, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass rounded-2xl p-4 cursor-pointer border border-white/10 hover:border-white/30 transition-all"
              onClick={() => { setSelectedMode(mode.id as GameMode); setStep('setup'); }}
            >
              <div className="text-3xl mb-2">{mode.icon}</div>
              <div className="font-bold text-white text-sm">{mode.name}</div>
              <div className="text-white/60 text-xs">{mode.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
