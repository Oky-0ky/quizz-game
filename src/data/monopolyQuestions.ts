import { BAHASA_INDONESIA_QUESTIONS } from '@/data/bahasaIndonesiaQuestions';

export type MonopolyDifficulty = 'easy' | 'medium' | 'hard';

export interface MonopolyQuestion {
  id: string;
  category: 'PAI' | 'Bahasa Arab' | 'Asmaul Husna' | 'Pengetahuan umum' | 'Matematika' | 'Bahasa Indonesia';
  difficulty: MonopolyDifficulty;
  question: string;
  options: [string, string, string, string];
  answer: string;
}

const DIFFICULTY_MAP = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
  very_hard: 'hard',
} as const;

export const MONOPOLY_QUESTIONS: MonopolyQuestion[] = BAHASA_INDONESIA_QUESTIONS.flatMap(question => {
  if (question.type !== 'multiple_choice' || question.options.length !== 4) return [];
  const [first, second, third, fourth] = question.options;
  if (
    first === undefined ||
    second === undefined ||
    third === undefined ||
    fourth === undefined ||
    !question.options.includes(question.correctAnswer)
  ) return [];

  return [{
    id: question.id,
    category: 'Bahasa Indonesia',
    difficulty: DIFFICULTY_MAP[question.difficulty],
    question: question.text,
    options: [first, second, third, fourth],
    answer: question.correctAnswer,
  }];
});
