import { QUESTION_BANK } from '@/data/gameData';
import { DEFAULT_SUBJECTS, SubjectId } from '@/types/game';

export type MonopolyDifficulty = 'easy' | 'medium' | 'hard';

export interface MonopolyQuestion {
  id: string;
  category: string;
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

export function getMonopolyQuestions(subjects: SubjectId[] = DEFAULT_SUBJECTS): MonopolyQuestion[] {
  return QUESTION_BANK.flatMap(question => {
    if (
      !question.subject ||
      !subjects.includes(question.subject) ||
      question.type !== 'multiple_choice' ||
      question.options.length !== 4 ||
      !question.options.includes(question.correctAnswer)
    ) return [];

    const [first, second, third, fourth] = question.options;
    if (first === undefined || second === undefined || third === undefined || fourth === undefined) return [];

    return [{
      id: question.id,
      category: question.category,
      difficulty: DIFFICULTY_MAP[question.difficulty],
      question: question.text,
      options: [first, second, third, fourth],
      answer: question.correctAnswer,
    }];
  });
}
