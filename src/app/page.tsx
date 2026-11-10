'use client';

import { useGameStore } from '@/store/gameStore';
import LandingPage from '@/components/pages/LandingPage';
import GamePage from '@/components/pages/GamePage';

export default function Home() {
  const game = useGameStore(s => s.game);

  if (!game || game.phase === 'lobby') {
    return <LandingPage />;
  }

  return <GamePage />;
}
