'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { DEFAULT_SETTINGS, GameMode, MovementMode, MysteryBoxPrize, TileType } from '@/types/game';
import { ADVENTURE_PATHS, BOARD_MAPS } from '@/data/adventureMap';

const GAME_MODES: { id: GameMode; name: string; emoji: string; desc: string }[] = [
  { id: 'classic', name: 'Classic Board', emoji: '🎲', desc: 'Permainan normal START → FINISH' },
  { id: 'quiz_race', name: 'Quiz Race', emoji: '🏃', desc: 'Semua pergerakan dari jawaban soal' },
  { id: 'dice_adventure', name: 'Dice Adventure', emoji: '🎲', desc: 'Jawab benar = lempar dadu' },
  { id: 'strategy_battle', name: 'Strategy Battle', emoji: '⚔️', desc: 'Fokus item & duel' },
  { id: 'mystery_board', name: 'Mystery Board', emoji: '❓', desc: 'Banyak kotak misteri' },
  { id: 'custom', name: 'Custom', emoji: '⚙️', desc: 'Atur semua aturan sendiri' },
];

const MOVEMENT_MODES: { id: MovementMode; name: string; desc: string }[] = [
  { id: 'fixed', name: 'Langkah Tetap', desc: 'Benar = maju N kotak' },
  { id: 'dice', name: 'Mode Dadu', desc: 'Benar = boleh lempar dadu' },
  { id: 'challenge', name: 'Mode Tantangan', desc: 'Langkah sesuai kesulitan soal' },
  { id: 'strategy', name: 'Mode Strategi', desc: 'Langkah + koin dari jawaban' },
];

const SPECIAL_TILES: { type: TileType; name: string; emoji: string }[] = [
  { type: 'reward', name: 'Hadiah', emoji: '🎁' },
  { type: 'challenge', name: 'Hoki MBG', emoji: '⚡' },
  { type: 'trap', name: 'Jebakan', emoji: '🕳️' },
  { type: 'shop', name: 'Toko', emoji: '🏪' },
  { type: 'mystery', name: 'Misteri', emoji: '❓' },
  { type: 'surprise_box', name: 'Kotak Kejutan', emoji: '🎁' },
  { type: 'duel', name: 'Duel', emoji: '⚔️' },
  { type: 'shortcut', name: 'Jalan Pintas', emoji: '🛤️' },
  { type: 'rest', name: 'Istirahat', emoji: '😴' },
  { type: 'tax', name: 'Pajak', emoji: '💸' },
];

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const game = useGameStore(s => s.game);
  const updateSettings = useGameStore(s => s.updateSettings);
  const pauseGame = useGameStore(s => s.pauseGame);
  const resumeGame = useGameStore(s => s.resumeGame);
  const endGame = useGameStore(s => s.endGame);
  const adjustTeamCoins = useGameStore(s => s.adjustTeamCoins);
  const adjustTeamPosition = useGameStore(s => s.adjustTeamPosition);
  const skipTurn = useGameStore(s => s.skipTurn);
  const endTurn = useGameStore(s => s.endTurn);
  const addTeam = useGameStore(s => s.addTeam);
  const removeTeam = useGameStore(s => s.removeTeam);

  const [tab, setTab] = useState<'game' | 'teams' | 'board' | 'settings'>('game');
  const [newTilePos, setNewTilePos] = useState('');
  const [newTileType, setNewTileType] = useState<TileType>('reward');
  const [tileError, setTileError] = useState('');
  const [tileCountError, setTileCountError] = useState('');
  const tileCountInputRef = useRef<HTMLInputElement>(null);
  const [newTeamName, setNewTeamName] = useState('');

  const [coinAdjust, setCoinAdjust] = useState<Record<string, string>>({});
  const [posAdjust, setPosAdjust] = useState<Record<string, string>>({});

  if (!game) return null;

  const tabs = [
    { id: 'game' as const, label: '🎮 Permainan', },
    { id: 'teams' as const, label: '👥 Kelompok' },
    { id: 'board' as const, label: '🗺️ Papan' },
    { id: 'settings' as const, label: '⚙️ Pengaturan' },
  ];

  const handleAddSpecialTile = () => {
    const pos = Number(newTilePos);
    if (!Number.isInteger(pos) || pos < 2 || pos >= game.settings.totalTiles) {
      setTileError(`Pilih kotak antara 2 dan ${game.settings.totalTiles - 1}.`);
      return;
    }
    const newPositions = { ...game.settings.specialTilePositions, [pos]: newTileType };
    updateSettings({ specialTilePositions: newPositions });
    setNewTilePos('');
    setTileError('');
  };

  const handleRemoveSpecialTile = (pos: number) => {
    const newPositions = { ...game.settings.specialTilePositions };
    delete newPositions[pos];
    updateSettings({ specialTilePositions: newPositions });
    if (Number(newTilePos) === pos) setNewTilePos('');
    setTileError('');
  };

  const handleTileCountChange = () => {
    const count = Number(tileCountInputRef.current?.value);
    if (!Number.isInteger(count) || count < 20 || count > 100) {
      setTileCountError('Papan klasik harus memiliki 20 sampai 100 kotak.');
      return;
    }
    updateSettings({ totalTiles: count });
    setTileCountError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-display text-2xl text-white">⚙️ Panel Admin</h2>
            <p className="text-white/50 text-sm">Kelola seluruh aspek permainan</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl transition-colors">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                tab === t.id ? 'text-white border-b-2 border-purple-500 bg-white/5' : 'text-white/50 hover:text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ── GAME TAB ── */}
          {tab === 'game' && (
            <>
              {/* Game controls */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-white mb-3">🎮 Kontrol Permainan</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={game.phase === 'paused' ? resumeGame : pauseGame}
                    className={`py-3 rounded-xl font-bold text-sm transition-colors ${
                      game.phase === 'paused'
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-orange-600 hover:bg-orange-500 text-white'
                    }`}
                  >
                    {game.phase === 'paused' ? '▶ Lanjutkan' : '⏸ Jeda'}
                  </button>
                  <button onClick={endTurn} className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-sm transition-colors">
                    ⏭ Lewati Giliran
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Yakin ingin mengakhiri permainan?')) endGame();
                    }}
                    className="col-span-2 bg-red-700 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-sm transition-colors"
                  >
                    🏁 Akhiri Permainan
                  </button>
                </div>
              </div>

              {/* Game status */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-white mb-3">📊 Status</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-black/30 rounded-xl p-3">
                    <div className="text-white/50">Fase</div>
                    <div className="text-white font-bold">{game.phase}</div>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3">
                    <div className="text-white/50">Giliran ke</div>
                    <div className="text-white font-bold">{game.currentTurn}</div>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3">
                    <div className="text-white/50">Kelompok Aktif</div>
                    <div className="text-white font-bold">{game.teams[game.currentTeamIndex]?.name}</div>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3">
                    <div className="text-white/50">Mode</div>
                    <div className="text-white font-bold">{game.settings.gameMode}</div>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3">
                    <div className="text-white/50">Room Code</div>
                    <div className="text-white font-bold">{game.roomCode}</div>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3">
                    <div className="text-white/50">Soal Terpakai</div>
                    <div className="text-white font-bold">{game.usedQuestionIds.length}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── TEAMS TAB ── */}
          {tab === 'teams' && (
            <>
              {game.teams.map(team => (
                <div key={team.id} className="bg-gray-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
                      style={{ backgroundColor: team.color + '33', borderColor: team.color }}
                    >
                      {team.avatarEmoji}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white">{team.name}</div>
                      <div className="text-white/50 text-xs">{team.members.map(m => m.name).join(', ')}</div>
                    </div>
                    <button
                      onClick={() => { if (confirm(`Hapus ${team.name}?`)) removeTeam(team.id); }}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-center text-sm">
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="text-white/50 text-xs">Kotak</div>
                      <div className="text-white font-bold">#{team.position}</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="text-yellow-400/70 text-xs">Koin</div>
                      <div className="text-yellow-300 font-bold">{team.coins}</div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-2">
                      <div className="text-white/50 text-xs">Skor</div>
                      <div className="text-white font-bold">{team.score}</div>
                    </div>
                  </div>

                  {/* Admin adjustments */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex gap-1">
                      <input
                        type="number"
                        placeholder="± Koin"
                        value={coinAdjust[team.id] || ''}
                        onChange={e => setCoinAdjust(prev => ({ ...prev, [team.id]: e.target.value }))}
                        className="flex-1 bg-black/30 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm outline-none focus:border-yellow-500 w-20"
                      />
                      <button
                        onClick={() => {
                          const amount = parseInt(coinAdjust[team.id]);
                          if (!isNaN(amount)) {
                            adjustTeamCoins(team.id, amount);
                            setCoinAdjust(prev => ({ ...prev, [team.id]: '' }));
                          }
                        }}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white px-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        💰
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        placeholder="Kotak #"
                        value={posAdjust[team.id] || ''}
                        onChange={e => setPosAdjust(prev => ({ ...prev, [team.id]: e.target.value }))}
                        className="flex-1 bg-black/30 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-sm outline-none focus:border-blue-500 w-20"
                      />
                      <button
                        onClick={() => {
                          const pos = parseInt(posAdjust[team.id]);
                          if (!isNaN(pos)) {
                            adjustTeamPosition(team.id, pos);
                            setPosAdjust(prev => ({ ...prev, [team.id]: '' }));
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        📍
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => skipTurn(team.id)}
                      className="flex-1 bg-orange-600/30 hover:bg-orange-600/50 text-orange-300 border border-orange-600/30 text-xs py-1.5 rounded-lg transition-colors"
                    >
                      ⏭ Lewati Giliran
                    </button>
                    <button
                      onClick={() => adjustTeamCoins(team.id, 50)}
                      className="flex-1 bg-green-600/30 hover:bg-green-600/50 text-green-300 border border-green-600/30 text-xs py-1.5 rounded-lg transition-colors"
                    >
                      🎁 +50 Koin
                    </button>
                  </div>
                </div>
              ))}

              {/* Add team */}
              {game.teams.length < 6 && (
                <div className="bg-gray-800 rounded-2xl p-4">
                  <h3 className="text-white font-bold mb-2">+ Tambah Kelompok</h3>
                  <div className="flex gap-2">
                    <input
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      placeholder="Nama kelompok..."
                      className="flex-1 bg-black/30 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newTeamName.trim()) {
                          addTeam(newTeamName, '#3b82f6', '🦋', [{ name: 'Pemain 1', avatarEmoji: '👦' }]);
                          setNewTeamName('');
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-xl text-sm font-bold transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── BOARD TAB ── */}
          {tab === 'board' && (
            <>
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-white mb-3">🗺️ Peta Permainan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BOARD_MAPS.map(map => (
                    <button
                      key={map.id}
                      onClick={() => {
                        updateSettings({ boardMapId: map.id });
                        setTileError('');
                        setTileCountError('');
                      }}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        game.settings.boardMapId === map.id
                          ? 'border-purple-400 bg-purple-600/20 text-white'
                          : 'border-gray-700 bg-black/20 text-white/60 hover:border-gray-500 hover:text-white'
                      }`}
                    >
                      <span className="block font-bold">{map.emoji} {map.name}</span>
                      <span className="text-xs opacity-70">{map.desc}</span>
                    </button>
                  ))}
                </div>
                {game.settings.boardMapId === 'adventure' && (
                  <div className="mt-4">
                    <label className="text-white/60 text-xs mb-1 block">Jalur semua kelompok</label>
                    <p className="text-white/40 text-xs mb-2">Mengganti jalur akan memindahkan penanda seluruh kelompok ke jalur ini.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {ADVENTURE_PATHS.map(path => (
                        <button
                          key={path.id}
                          onClick={() => updateSettings({ adventurePathId: path.id })}
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                            game.settings.adventurePathId === path.id
                              ? 'border-emerald-400 bg-emerald-600/20 text-white'
                              : 'border-gray-700 bg-black/20 text-white/60 hover:border-gray-500 hover:text-white'
                          }`}
                        >
                          {path.emoji} {path.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-white">🧩 Editor Kotak</h3>
                    <p className="text-white/45 text-xs mt-1">Pilih nomor kotak, tentukan jenisnya, lalu simpan.</p>
                  </div>
                  <button
                    onClick={() => {
                      updateSettings({ specialTilePositions: DEFAULT_SETTINGS.specialTilePositions });
                      setNewTilePos('');
                      setTileError('');
                    }}
                    className="shrink-0 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-white/70 text-xs"
                  >
                    Pulihkan default
                  </button>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 mb-4 max-h-52 overflow-y-auto p-1">
                  {Array.from({ length: game.settings.totalTiles }, (_, index) => {
                    const position = index + 1;
                    const type = game.settings.specialTilePositions[position] ?? 'normal';
                    const tileInfo = SPECIAL_TILES.find(tile => tile.type === type);
                    const isSelected = Number(newTilePos) === position;
                    return (
                      <button
                        key={position}
                        onClick={() => {
                          setNewTilePos(String(position));
                          if (type !== 'normal') setNewTileType(type);
                          setTileError('');
                        }}
                        aria-label={`Pilih kotak ${position}${type !== 'normal' ? `, ${tileInfo?.name ?? type}` : ', normal'}`}
                        className={`min-h-11 rounded-lg border px-1 text-center transition-colors ${
                          isSelected
                            ? 'border-yellow-300 bg-yellow-500/25 text-white ring-1 ring-yellow-300'
                            : type !== 'normal'
                              ? 'border-purple-400/50 bg-purple-500/15 text-white'
                              : 'border-white/10 bg-black/20 text-white/45 hover:border-white/30'
                        }`}
                      >
                        <span className="block text-xs font-bold">#{position}</span>
                        {tileInfo && <span className="block text-sm leading-4">{tileInfo.emoji}</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="max-h-44 overflow-y-auto space-y-2 mb-4">
                  {Object.entries(game.settings.specialTilePositions)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([pos, type]) => {
                      const tileInfo = SPECIAL_TILES.find(t => t.type === type);
                      return (
                        <div key={pos} className="flex items-center justify-between bg-black/30 rounded-xl px-3 py-2">
                          <span className="text-white text-sm font-bold">#{pos}</span>
                          <span className="text-white/70 text-sm flex items-center gap-1">
                            {tileInfo?.emoji} {tileInfo?.name || type}
                          </span>
                          {type !== 'start' && type !== 'finish' && (
                            <button
                              onClick={() => handleRemoveSpecialTile(Number(pos))}
                              aria-label={`Hapus kotak spesial ${pos}`}
                              className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-white/50 text-xs">Nomor Kotak</label>
                    <input
                      type="number"
                      value={newTilePos}
                      onChange={e => {
                        setNewTilePos(e.target.value);
                        setTileError('');
                      }}
                      min={2}
                      max={game.settings.totalTiles - 1}
                      disabled={game.settings.totalTiles <= 2}
                      placeholder="Nomor..."
                      className="w-full bg-black/30 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-white/50 text-xs">Jenis</label>
                    <select
                      value={newTileType}
                      onChange={e => setNewTileType(e.target.value as TileType)}
                      className="w-full bg-black/30 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm outline-none"
                    >
                      {SPECIAL_TILES.map(t => (
                        <option key={t.type} value={t.type}>{t.emoji} {t.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAddSpecialTile}
                    disabled={game.settings.totalTiles <= 2}
                    className="bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                  >
                    Simpan
                  </button>
                </div>
                {tileError && <p role="alert" className="mt-2 text-red-300 text-xs">{tileError}</p>}
                <p className="mt-2 text-white/40 text-xs">
                  Kotak START dan FINISH dikelola otomatis. Menyimpan pada nomor yang sudah terisi akan mengganti jenis kotaknya.
                </p>
              </div>

              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-white mb-2">📏 Jumlah Kotak</h3>
                {game.settings.boardMapId === 'adventure' ? (
                  <p className="text-white/60 text-sm">
                    Peta petualangan memiliki 30 kotak tetap. Beralih ke Papan Klasik untuk mengubah jumlahnya.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      key={game.settings.totalTiles}
                      ref={tileCountInputRef}
                      defaultValue={game.settings.totalTiles}
                      onChange={() => setTileCountError('')}
                      min={20}
                      max={100}
                      aria-label="Jumlah kotak papan klasik"
                      className="w-32 bg-black/30 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm outline-none"
                    />
                    <span className="text-white/50 text-sm">kotak (20-100)</span>
                    <button
                      onClick={handleTileCountChange}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
                    >
                      Terapkan
                    </button>
                    {tileCountError && <p role="alert" className="w-full text-red-300 text-xs">{tileCountError}</p>}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── SETTINGS TAB ── */}
          {tab === 'settings' && (
            <>
              {/* Game Mode */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-white mb-3">🎮 Mode Permainan</h3>
                <div className="grid grid-cols-2 gap-2">
                  {GAME_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => updateSettings({ gameMode: mode.id })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        game.settings.gameMode === mode.id
                          ? 'bg-purple-600/30 border-purple-500 text-white'
                          : 'bg-black/30 border-gray-700 text-white/60 hover:text-white hover:border-gray-500'
                      }`}
                    >
                      <span className="text-lg mr-1">{mode.emoji}</span>
                      <span className="font-bold text-sm">{mode.name}</span>
                      <div className="text-xs opacity-70 mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Movement Mode */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-white mb-3">🚶 Mode Pergerakan</h3>
                <div className="grid grid-cols-2 gap-2">
                  {MOVEMENT_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => updateSettings({ movementMode: mode.id, enableDice: mode.id === 'dice' })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        game.settings.movementMode === mode.id
                          ? 'bg-blue-600/30 border-blue-500 text-white'
                          : 'bg-black/30 border-gray-700 text-white/60 hover:text-white hover:border-gray-500'
                      }`}
                    >
                      <span className="font-bold text-sm">{mode.name}</span>
                      <div className="text-xs opacity-70">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-white mb-3">🔧 Fitur</h3>
                <div className="space-y-3">
                  {[
                    { key: 'enableShop', label: '🏪 Toko Item', value: game.settings.enableShop },
                    { key: 'shopOpenAnyTime', label: '🛒 Toko Buka Kapan Saja', value: game.settings.shopOpenAnyTime },
                    { key: 'enableDuel', label: '⚔️ Sistem Duel', value: game.settings.enableDuel },
                    { key: 'enableRandomEvents', label: '🌟 Event Acak', value: game.settings.enableRandomEvents },
                    { key: 'enableMissions', label: '🎯 Misi Khusus', value: game.settings.enableMissions },
                    { key: 'enableFinalChallenge', label: '⚡ Grand Final', value: game.settings.enableFinalChallenge },
                    { key: 'incorrectPenalty', label: '⚠️ Penalti Salah (mundur)', value: game.settings.incorrectPenalty },
                  ].map(toggle => (
                    <div key={toggle.key} className="flex items-center justify-between">
                      <span className="text-white text-sm">{toggle.label}</span>
                      <button
                        onClick={() => updateSettings({ [toggle.key]: !toggle.value })}
                        className={`w-12 h-6 rounded-full relative transition-colors ${toggle.value ? 'bg-green-500' : 'bg-gray-600'}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${toggle.value ? 'left-6' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Number settings */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-white mb-3">🔢 Pengaturan Angka</h3>
                <div className="space-y-3">
                  {[
                    { key: 'questionTimeLimit', label: 'Waktu Soal (detik)', value: game.settings.questionTimeLimit, min: 10, max: 120 },
                    { key: 'correctMoveSteps', label: 'Langkah Benar (fixed)', value: game.settings.correctMoveSteps, min: 1, max: 10 },
                    { key: 'penaltySteps', label: 'Langkah Penalti', value: game.settings.penaltySteps, min: 0, max: 5 },
                    { key: 'finalChallengeQuestions', label: 'Soal Grand Final', value: game.settings.finalChallengeQuestions, min: 1, max: 5 },
                  ].map(setting => (
                    <div key={setting.key} className="flex items-center justify-between gap-3">
                      <span className="text-white text-sm">{setting.label}</span>
                      <input
                        type="number"
                        value={setting.value}
                        onChange={e => updateSettings({ [setting.key]: Math.max(setting.min, Math.min(setting.max, parseInt(e.target.value) || setting.min)) })}
                        min={setting.min}
                        max={setting.max}
                        className="w-20 bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm text-center outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Win condition */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-white mb-3">🏆 Kondisi Menang</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSettings({ winCondition: 'first_finish' })}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      game.settings.winCondition === 'first_finish'
                        ? 'bg-yellow-600/30 border-yellow-500 text-white'
                        : 'bg-black/30 border-gray-700 text-white/50'
                    }`}
                  >
                    🏁 Pertama Finish
                  </button>
                  <button
                    onClick={() => updateSettings({ winCondition: 'highest_score' })}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      game.settings.winCondition === 'highest_score'
                        ? 'bg-yellow-600/30 border-yellow-500 text-white'
                        : 'bg-black/30 border-gray-700 text-white/50'
                    }`}
                  >
                    📊 Skor Tertinggi
                  </button>
                </div>
              </div>

              {/* Coin rewards */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-white mb-3">💰 Hadiah Koin</h3>
                <div className="space-y-2">
                  {[
                    { key: 'correct', label: 'Jawaban Benar', value: game.settings.coinRewards.correct },
                    { key: 'correctFast', label: 'Bonus Cepat', value: game.settings.coinRewards.correctFast },
                    { key: 'hardChallenge', label: 'Tantangan Sulit', value: game.settings.coinRewards.hardChallenge },
                    { key: 'duelWin', label: 'Menang Duel', value: game.settings.coinRewards.duelWin },
                    { key: 'specialMission', label: 'Misi Khusus', value: game.settings.coinRewards.specialMission },
                  ].map(reward => (
                    <div key={reward.key} className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">{reward.label}</span>
                      <input
                        type="number"
                        value={reward.value}
                        onChange={e => {
                          const newRewards = { ...game.settings.coinRewards, [reward.key]: parseInt(e.target.value) || 0 };
                          updateSettings({ coinRewards: newRewards });
                        }}
                        min={0}
                        max={100}
                        className="w-20 bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm text-center outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mystery box prize weights */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-white mb-1">🎡 Peluang Hadiah Kotak Kejutan</h3>
                <p className="mb-3 text-xs text-white/50">Bobot relatif: angka lebih tinggi berarti hadiah lebih sering muncul. Minimal satu bobot harus di atas 0.</p>
                <div className="space-y-2">
                  {([
                    { key: 'coins_100', label: '🪙 +100 Koin' },
                    { key: 'free_item', label: '🎁 Gratis 1 Item' },
                    { key: 'coins_200', label: '💰 +200 Koin' },
                    { key: 'steal', label: '🏆 Curi Koin + Poin' },
                  ] satisfies Array<{ key: MysteryBoxPrize; label: string }>).map(reward => (
                    <div key={reward.key} className="flex items-center justify-between gap-3">
                      <label htmlFor={`mystery-weight-${reward.key}`} className="text-sm text-white/80">{reward.label}</label>
                      <input
                        id={`mystery-weight-${reward.key}`}
                        type="number"
                        value={game.settings.mysteryBoxPrizeWeights[reward.key]}
                        onChange={event => {
                          const weights = {
                            ...game.settings.mysteryBoxPrizeWeights,
                            [reward.key]: Math.max(0, Math.min(100, Number.parseInt(event.target.value, 10) || 0)),
                          };
                          if (Object.values(weights).some(weight => weight > 0)) {
                            updateSettings({ mysteryBoxPrizeWeights: weights });
                          }
                        }}
                        min={0}
                        max={100}
                        className="w-20 rounded-lg border border-gray-600 bg-black/30 px-2 py-1 text-center text-sm text-white outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
