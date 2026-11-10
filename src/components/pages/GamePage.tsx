'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

import GameBoard from '@/components/board/GameBoard';
import TurnPanel from '@/components/game/TurnPanel';
import TeamMonitorPanel from '@/components/game/TeamMonitorPanel';
import QuestionModal from '@/components/game/QuestionModal';
import ShopModal from '@/components/game/ShopModal';
import DuelModal from '@/components/game/DuelModal';
import LeaderboardPanel from '@/components/game/LeaderboardPanel';
import NotificationStack from '@/components/ui/NotificationStack';
import AdminPanel from '@/components/game/AdminPanel';
import InventoryModal from '@/components/game/InventoryModal';
import ResultsPage from '@/components/pages/ResultsPage';
import FinalChallengeModal from '@/components/game/FinalChallengeModal';

export default function GamePage() {
  const game = useGameStore(s => s.game);
  const setPhase = useGameStore(s => s.setPhase);
  const [showShop, setShowShop] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [mobileTab, setMobileTab] = useState<'board' | 'turn'>('board');
  const [showMonitor, setShowMonitor] = useState(false);

  if (!game) return null;

  if (game.phase === 'finished') {
    return <ResultsPage />;
  }

  const currentTeam = game.teams[game.currentTeamIndex] || game.teams[0];

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 border-b border-white/10 px-4 py-2.5 flex items-center justify-between flex-shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase('lobby')}
            className="text-2xl hover:scale-110 transition-transform"
            title="Kembali ke Lobby"
          >
            🏆
          </button>
          <div>
            <h1 className="font-display text-base md:text-lg text-white leading-tight">QUIZ BOARD ADVENTURE</h1>
            <div className="text-white/60 text-xs">{game.name} · Room: <span className="font-mono text-yellow-300 font-bold">{game.roomCode}</span></div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLeaderboard(v => !v)}
            className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors"
          >
            🏆 Peringkat
          </button>
          <button
            onClick={() => setShowAdmin(v => !v)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-colors"
          >
            ⚙️ Admin
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative min-h-0">
        {/* Leftmost: Live Team Monitor */}
        <div className="hidden md:flex md:w-52 md:flex-shrink-0 flex-col border-r border-white/10 bg-gray-800/50 overflow-hidden">
          <TeamMonitorPanel />
        </div>

        {/* Left: Board */}
        <div className={`flex-1 relative overflow-hidden bg-gray-900 min-h-0 ${mobileTab === 'turn' ? 'hidden md:block' : 'block'}`}>
          <GameBoard />
        </div>

        {/* Right: Turn Panel */}
        <div className={`
          md:w-80 md:flex-shrink-0 border-t md:border-t-0 md:border-l border-white/10 bg-gray-800/95 md:bg-gray-800/50 overflow-y-auto min-h-0
          ${mobileTab === 'board' ? 'hidden md:block' : 'flex-1 md:flex-initial block'}
        `}>
          <TurnPanel
            onOpenShop={() => setShowShop(true)}
            onOpenInventory={() => setShowInventory(true)}
          />
        </div>
        <NotificationStack />
      </div>

      {/* Mobile Monitor Drawer (tombol ada di bawah) */}
      {showMonitor && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 max-w-[80vw] bg-gray-900 border-r border-white/15 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-3 pt-3">
              <span className="text-white/60 text-xs font-bold uppercase tracking-wider">📊 Monitoring</span>
              <button
                onClick={() => setShowMonitor(false)}
                className="text-white/50 hover:text-white text-xl leading-none"
                aria-label="Tutup monitoring"
              >
                ✕
              </button>
            </div>
            <TeamMonitorPanel />
          </div>
          <button
            className="flex-1 bg-black/60"
            onClick={() => setShowMonitor(false)}
            aria-label="Tutup monitoring"
          />
        </div>
      )}

      {/* Mobile Tab Toggle */}
      <div className="md:hidden flex border-t border-white/10 bg-gray-900/95 backdrop-blur px-3 py-2 gap-2 flex-shrink-0 z-30">
        <button
          onClick={() => setMobileTab('board')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'board' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-white/60 hover:text-white'
          }`}
        >
          <span>🗺️</span> Papan Permainan
        </button>
        <button
          onClick={() => setMobileTab('turn')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'turn' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-white/60 hover:text-white'
          }`}
        >
          <span>{currentTeam?.avatarEmoji || '🎲'}</span> Giliran ({currentTeam?.name || 'Tim'})
        </button>
        <button
          onClick={() => setShowMonitor(true)}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-white/5 text-white/60 hover:text-white"
        >
          <span>📊</span> Monitoring
        </button>
      </div>

      {/* Modals */}
      {game.phase === 'question' && <QuestionModal />}
      {(game.phase === 'duel' || game.activeDuel?.phase === 'challenger_answering' || game.activeDuel?.phase === 'defender_answering') && <DuelModal />}
      {game.phase === 'final_challenge' && <FinalChallengeModal />}
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}
      {showInventory && <InventoryModal onClose={() => setShowInventory(false)} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      {showLeaderboard && <LeaderboardPanel onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}
