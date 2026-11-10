'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, isAnswerCorrect } from '@/store/gameStore';

export default function QuestionModal() {
  const game = useGameStore(s => s.game);
  const submitAnswer = useGameStore(s => s.submitAnswer);
  const applyCompassHint = useGameStore(s => s.useHintInQuestion);
  const applyChanceRetry = useGameStore(s => s.useChanceCardRetry);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [retried, setRetried] = useState(false);
  const [loadedQuestionId, setLoadedQuestionId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Ref mirror of `answered` so the interval callback never reads stale state
  const answeredRef = useRef(false);
  // Written only from the timer's callback, read on click (never during render)
  const timeLeftRef = useRef(0);

  const question = game?.activeQuestion;
  const questionKey = game && question
    ? `${game.teams[game.currentTeamIndex]?.id}-${game.currentTurn}-${question.id}-${game.activeQuestionIsBonus ? 'bonus' : 'turn'}`
    : null;

  // Reset per-question state during render when a new question arrives
  // (avoids calling setState synchronously inside an effect)
  if (question && questionKey && loadedQuestionId !== questionKey) {
    setLoadedQuestionId(questionKey);
    setTimeLeft(question.timeLimit);
    setSelectedAnswer(null);
    setTextAnswer('');
    setAnswered(false);
    setIsCorrect(null);
    setRetried(false);
  }

  useEffect(() => {
    answeredRef.current = answered;
  }, [answered]);

  // Keep the ref mirror used by the interval in sync with the displayed time
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  function handleSubmit(answer: string, time: number, isRetry = false) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setAnswered(true);
    const correct = isAnswerCorrect(answer, question!);
    setIsCorrect(correct);
    // A retry never counts as a fresh turn — the team keeps the answer that
    // was already recorded, only the UI allows one more attempt.
    if (isRetry) return;
    setTimeout(() => submitAnswer(answer, time), 1200);
  }

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 1);
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!answeredRef.current) handleSubmit('', 0);
      }
    }, 1000);
  };

  useEffect(() => {
    if (!question) return;
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  if (!game || !question || game.phase !== 'question') return null;

  const currentTeam = game.teams[game.currentTeamIndex];
  const timePercent = (timeLeft / question.timeLimit) * 100;
  const wasUnanswered = answered && !isCorrect && timeLeft <= 0 && !selectedAnswer && !textAnswer.trim();

  const getDifficultyColor = () => {
    switch (question.difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'hard': return 'text-orange-400 bg-orange-500/20';
      case 'very_hard': return 'text-red-400 bg-red-500/20';
    }
  };

  const getDifficultyLabel = () => {
    switch (question.difficulty) {
      case 'easy': return 'Mudah';
      case 'medium': return 'Sedang';
      case 'hard': return 'Sulit';
      case 'very_hard': return 'Sangat Sulit';
    }
  };

  const handleOptionSelect = (opt: string) => {
    if (answered) return;
    setSelectedAnswer(opt);
    handleSubmit(opt, timeLeft);
  };

  const handleTextSubmit = () => {
    if (!textAnswer.trim() || answered) return;
    handleSubmit(textAnswer, timeLeft);
  };

  // 🧭 Kompas Petunjuk: eliminate two wrong options of the active question
  const handleUseCompass = () => {
    if (!currentTeam) return;
    applyCompassHint(currentTeam.id, question);
  };

  // 🃏 Kartu Kesempatan: one more attempt on the same question (only when wrong)
  const handleRetry = () => {
    if (!currentTeam || retried) return;
    if (!applyChanceRetry(currentTeam.id)) return;
    setRetried(true);
    setAnswered(false);
    setIsCorrect(null);
    setSelectedAnswer(null);
    setTextAnswer('');
    answeredRef.current = false;
    timeLeftRef.current = question.timeLimit;
    setTimeLeft(question.timeLimit);
    startTimer();
  };

  const eliminatedOptions = game?.eliminatedOptions || [];
  const hasCompass = !!currentTeam?.inventory.some(i => i.itemId === 'compass' && i.quantity > 0);
  const canUseCompass = !answered && hasCompass && !!question.options && question.options.length > 2 && eliminatedOptions.length === 0;
  const hasChanceCard = !!currentTeam && (
    currentTeam.inventory.some(i => i.itemId === 'chance_card' && i.quantity > 0) ||
    currentTeam.cards.some(c => c.effect.type === 'retry_answer' && !c.isUsed) ||
    currentTeam.activeEffects.some(e => e.type === 'retry_answer')
  );
  const canRetry = answered && isCorrect === false && !retried && hasChanceCard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        className="bg-gray-900 rounded-3xl p-6 w-full max-w-xl border border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2"
              style={{ backgroundColor: currentTeam.color + '33', borderColor: currentTeam.color }}
            >
              {currentTeam.avatarEmoji}
            </div>
            <div>
              <div className="font-bold text-white text-sm">{currentTeam.name}</div>
              <div className="text-white/50 text-xs">
                Kotak #{currentTeam.position} · {question.category}
                {question.tags?.[1] && <span className="text-white/40"> · {question.tags[1]}</span>}
                {game.activeQuestionIsBonus && <span className="ml-1 text-amber-300">· Soal tambahan</span>}
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor()}`}>
            {getDifficultyLabel()}
          </div>
        </div>

        {/* Timer bar */}
        <div className="relative mb-4">
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors ${timePercent > 60 ? 'bg-green-500' : timePercent > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${timePercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="absolute right-0 -top-5 text-white/70 text-sm font-bold">
            ⏱️ {timeLeft}s
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-5">
          <p className="text-white text-lg font-semibold leading-relaxed">{question.text}</p>
          {question.imageUrl && (
            <img src={question.imageUrl} alt="Gambar soal" className="mt-3 rounded-xl w-full object-cover max-h-40" />
          )}
        </div>

        {/* Answer section */}
        {!answered && (
          <>
            {question.options.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {question.options.map((opt, i) => {
                  const eliminated = eliminatedOptions.includes(opt);
                  return (
                    <motion.button
                      key={i}
                      whileHover={eliminated ? undefined : { scale: 1.02 }}
                      whileTap={eliminated ? undefined : { scale: 0.98 }}
                      onClick={() => !eliminated && handleOptionSelect(opt)}
                      disabled={eliminated}
                      className={`w-full text-left px-5 py-3 rounded-2xl border-2 font-semibold transition-all ${
                        eliminated
                          ? 'bg-gray-900/60 border-gray-800 text-white/25 line-through cursor-not-allowed'
                          : selectedAnswer === opt
                            ? 'bg-purple-600 border-purple-400 text-white'
                            : 'bg-gray-800 border-gray-600 text-white hover:border-purple-400 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-purple-400 mr-3 font-bold">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                      {eliminated && <span className="ml-2 text-xs no-underline">❌</span>}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {question.options.length === 0 && (
              <div className="space-y-3">
                <input
                  value={textAnswer}
                  onChange={e => setTextAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTextSubmit()}
                  placeholder="Ketik jawaban..."
                  autoFocus
                  className="w-full bg-gray-800 border-2 border-gray-600 focus:border-purple-400 rounded-2xl px-4 py-3 text-white text-lg outline-none transition-colors"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTextSubmit}
                  disabled={!textAnswer.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-colors text-lg"
                >
                  ✓ Jawab Sekarang
                </motion.button>
              </div>
            )}
          </>
        )}

        {/* Result overlay */}
        <AnimatePresence>
          {answered && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-center py-6 rounded-2xl ${isCorrect ? 'bg-green-500/20 border-2 border-green-500' : 'bg-red-500/20 border-2 border-red-500'}`}
            >
              <div className="text-5xl mb-2">{isCorrect ? '🎉' : '😔'}</div>
              <div className={`font-display text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'BENAR!' : wasUnanswered ? 'WAKTU HABIS!' : 'SALAH!'}
              </div>
              {!isCorrect && (
                <div className="text-white/70 text-sm mt-2">
                  Jawaban benar: <span className="text-green-400 font-bold whitespace-pre-line">{question.correctAnswer}</span>
                </div>
              )}
              {isCorrect && (
                <div className="text-yellow-400 font-bold mt-2">
                  +{question.coinsReward} koin 🪙
                </div>
              )}
              {question.explanation && (
                <div className="text-white/50 text-xs mt-2 max-w-xs mx-auto">{question.explanation}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Item actions: use Compass / Chance Card right inside the question */}
        {(canUseCompass || canRetry) && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {canUseCompass && (
              <button
                onClick={handleUseCompass}
                className="px-4 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white text-xs font-bold border border-blue-400/30 transition-colors"
              >
                🧭 Pakai Kompas (eliminasi 2 opsi)
              </button>
            )}
            {canRetry && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-bold border border-amber-400/30 transition-colors"
              >
                🃏 Ulangi dengan Kartu Kesempatan
              </button>
            )}
          </div>
        )}

        {/* Answer and movement preview */}
        {!answered && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-white/50">
            {game.activeQuestionIsBonus
              ? <span>📝 Jawab soal tambahan sebelum giliran berlanjut</span>
              : <>
                  <span>🪙 +{question.coinsReward} koin jika benar</span>
                  <span>👣 Benar: maju 1 · Salah: mundur 1</span>
                  {currentTeam.inventory.some(item => item.itemId === 'anti_back_shield' && item.quantity > 0)
                    && <span className="text-cyan-300">🛡️ Tameng siap</span>}
                </>
            }
          </div>
        )}
      </motion.div>
    </div>
  );
}
