'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { getQuestionsBySubjects } from '@/data/gameData';

export default function FinalChallengeModal() {
  const game = useGameStore(s => s.game);
  const endGame = useGameStore(s => s.endGame);
  const addNotification = useGameStore(s => s.addNotification);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [loadedQuestionId, setLoadedQuestionId] = useState<string | null>(null);
  const answeredRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const isFinalPhase = !!game && game.phase === 'final_challenge';
  const currentTeam = game?.teams[game.currentTeamIndex];
  const totalQuestions = game?.settings.finalChallengeQuestions ?? 0;

  // Pick hard questions for final challenge (only from the selected subjects)
  const questionBank = game && game.questions && game.questions.length > 0
    ? game.questions
    : getQuestionsBySubjects(game?.settings.subjects);
  const finalQuestions = questionBank
    .filter(q => q.difficulty === 'hard' || q.difficulty === 'very_hard')
    .slice(0, totalQuestions);

  const question = finalQuestions[questionIndex];

  // Reset the timer value during render when the question changes
  // (avoids calling setState synchronously inside an effect)
  const questionChanged = !!question && loadedQuestionId !== question.id;
  if (questionChanged) {
    setLoadedQuestionId(question.id);
    setTimeLeft(question.timeLimit || 30);
  }

  useEffect(() => {
    answeredRef.current = answered;
  }, [answered]);

  function handleAnswer(ans: string) {
    if (!question || !currentTeam) return;
    if (answeredRef.current) return;
    answeredRef.current = true;
    setAnswered(true);
    const correct = ans.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    const newAnswers = [...answers, correct];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (questionIndex + 1 < totalQuestions) {
        setQuestionIndex(i => i + 1);
      } else {
        setShowResult(true);
        const allCorrect = newAnswers.every(Boolean);
        if (allCorrect) {
          endGame();
          addNotification({
            type: 'success',
            title: '🏆 KEMENANGAN MUTLAK!',
            message: `${currentTeam.name} menyelesaikan Grand Final!`,
            emoji: '🎊',
            duration: 10000,
          });
        } else {
          addNotification({
            type: 'error',
            title: '😔 Belum Berhasil',
            message: `${currentTeam.name} gagal di Grand Final. Coba lagi pada giliran berikutnya!`,
            duration: 5000,
          });
        }
      }
    }, 1500);
  }

  // Restart the timer per question. The guarded setState below only runs when
  // the question actually changed, so it does not cause cascading renders.
  useEffect(() => {
    answeredRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswered(false);
  }, [questionIndex, showResult]);

  useEffect(() => {
    if (!question || showResult || questionChanged) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          handleAnswer('');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, showResult, questionChanged]);

  if (!isFinalPhase || !game || !currentTeam || !question) return null;

  if (showResult) {
    const passed = answers.filter(Boolean).length === totalQuestions;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">{passed ? '🏆' : '😔'}</div>
          <h1 className="font-display text-4xl text-white mb-2">
            {passed ? 'GRAND CHAMPION!' : 'Tantangan Gagal'}
          </h1>
          <div className="text-white/70 text-lg mb-6">
            {currentTeam.name} · {answers.filter(Boolean).length}/{totalQuestions} benar
          </div>
          <div className="flex justify-center gap-2 mb-8">
            {answers.map((correct, i) => (
              <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${correct ? 'bg-green-500' : 'bg-red-500'}`}>
                {correct ? '✅' : '❌'}
              </div>
            ))}
          </div>
          {!passed && (
            <button
              onClick={() => {
                setQuestionIndex(0);
                setAnswers([]);
                setShowResult(false);
                setAnswered(false);
                setCurrentAnswer('');
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors"
            >
              🔄 Coba Lagi
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  const isCorrectAnswer = answered && currentAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-3xl p-8 w-full max-w-xl border border-yellow-500/40 shadow-2xl"
      >
        {/* Grand Final header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">⚡</div>
          <h2 className="font-display text-3xl text-yellow-400">THE GRAND FINAL</h2>
          <p className="text-white/60 mt-1">
            Soal {questionIndex + 1} dari {totalQuestions} · {currentTeam.name}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 justify-center mb-6">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              i < answers.length ? (answers[i] ? 'bg-green-500' : 'bg-red-500') :
              i === questionIndex ? 'bg-yellow-500 animate-pulse' : 'bg-gray-700'
            }`}>
              {i < answers.length ? (answers[i] ? '✓' : '✗') : i + 1}
            </div>
          ))}
        </div>

        {/* Timer */}
        <div className="mb-4">
          <div className="h-2 bg-gray-700 rounded-full">
            <div
              className={`h-full rounded-full transition-all ${timeLeft > 20 ? 'bg-green-500' : timeLeft > 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${(timeLeft / (question.timeLimit || 30)) * 100}%` }}
            />
          </div>
          <div className="text-right text-white/60 text-sm mt-1">⏱️ {timeLeft}s</div>
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-2xl p-5 mb-5">
          <div className="text-yellow-400 text-xs font-bold mb-2 uppercase tracking-wider">{question.category}</div>
          <p className="text-white text-lg font-semibold">{question.text}</p>
        </div>

        {/* Options */}
        {!answered && question.options && question.options.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((opt, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setCurrentAnswer(opt); handleAnswer(opt); }}
                className="px-4 py-3 rounded-xl bg-gray-800 hover:bg-yellow-600/20 border border-gray-700 hover:border-yellow-500 text-white font-semibold transition-all"
              >
                <span className="text-yellow-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </motion.button>
            ))}
          </div>
        )}

        {answered && (
          <div className={`text-center py-4 rounded-2xl ${isCorrectAnswer ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'}`}>
            <div className="text-3xl mb-1">{isCorrectAnswer ? '🎉' : '❌'}</div>
            <div className={`font-bold text-lg ${isCorrectAnswer ? 'text-green-400' : 'text-red-400'}`}>
              {isCorrectAnswer ? 'Benar!' : 'Salah!'}
            </div>
            {!isCorrectAnswer && (
              <div className="text-white/70 text-sm">Jawaban: <span className="text-green-400 whitespace-pre-line">{question.correctAnswer}</span></div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
