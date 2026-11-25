import type { Metadata } from 'next';
import '../battle-block.css';
import BattleBlockQuiz from '@/components/game/BattleBlockQuiz';

export const metadata: Metadata = {
  title: 'Battle Block Quiz — Pertarungan Kecerdasan Antarkelompok',
  description: 'Game kuis edukasi multiplayer lokal: jawab soal, kumpulkan balok, dan bangun menara kelompokmu.',
};

export default function BattleBlockPage() {
  return <BattleBlockQuiz />;
}
