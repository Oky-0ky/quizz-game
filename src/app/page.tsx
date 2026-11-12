'use client';

import { useGameStore } from '@/store/gameStore';
import LandingPage from '@/components/pages/LandingPage';
import GamePage from '@/components/pages/GamePage';
import MonopolyPage from '@/components/pages/MonopolyPage';
import { useMonopolyStore } from '@/store/monopolyStore';

export default function Home() {
  const game = useGameStore(s => s.game);
  const monopolyGame = useMonopolyStore(s => s.game);

  if (monopolyGame) {
    return <MonopolyPage />;
  }

  if (!game || game.phase === 'lobby') {
    return <LandingPage />;
  }

  return <GamePage />;
}
