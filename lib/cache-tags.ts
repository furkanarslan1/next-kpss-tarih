export function flashcardsTag(topicId: string) {
  return `flashcards:${topicId}`;
}

export const adminFlashcardsTag = "admin:flashcards";

export function quizQuestionsTag(topicId: string) {
  return `quiz-questions:${topicId}`;
}

export const adminQuizQuestionsTag = "admin:quiz-questions";
