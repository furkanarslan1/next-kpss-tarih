import type {
  Enums,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type AppRole = Enums<"app_role">;
export type ContentStatus = Enums<"content_status">;
export type EntityType = Enums<"entity_type">;
export type MapLayerKind = Enums<"map_layer_kind">;
export type QuestionDifficulty = Enums<"question_difficulty">;
export type TimelineEventType = Enums<"timeline_event_type">;

export type Profile = Tables<"profiles">;
export type UserRole = Tables<"user_roles">;
export type HistoricalPeriod = Tables<"historical_periods">;
export type Topic = Tables<"topics">;
export type HistoricalEntity = Tables<"historical_entities">;
export type MapLayer = Tables<"map_layers">;
export type TimelineEvent = Tables<"timeline_events">;
export type EventLocation = Tables<"event_locations">;
export type Flashcard = Tables<"flashcards">;
export type PracticeQuestion = Tables<"practice_questions">;
export type QuizQuestion = Tables<"quiz_questions">;
export type QuizOption = Tables<"quiz_options">;
export type QuizAttempt = Tables<"quiz_attempts">;
export type QuizAttemptAnswer = Tables<"quiz_attempt_answers">;
export type UserFlashcardReview = Tables<"user_flashcard_reviews">;

export type HistoricalPeriodInsert = TablesInsert<"historical_periods">;
export type TopicInsert = TablesInsert<"topics">;
export type HistoricalEntityInsert = TablesInsert<"historical_entities">;
export type MapLayerInsert = TablesInsert<"map_layers">;
export type TimelineEventInsert = TablesInsert<"timeline_events">;
export type EventLocationInsert = TablesInsert<"event_locations">;
export type FlashcardInsert = TablesInsert<"flashcards">;
export type PracticeQuestionInsert = TablesInsert<"practice_questions">;
export type QuizQuestionInsert = TablesInsert<"quiz_questions">;
export type QuizOptionInsert = TablesInsert<"quiz_options">;
export type QuizAttemptInsert = TablesInsert<"quiz_attempts">;
export type QuizAttemptAnswerInsert = TablesInsert<"quiz_attempt_answers">;

export type ProfileUpdate = TablesUpdate<"profiles">;
export type HistoricalPeriodUpdate = TablesUpdate<"historical_periods">;
export type TopicUpdate = TablesUpdate<"topics">;
export type HistoricalEntityUpdate = TablesUpdate<"historical_entities">;
export type MapLayerUpdate = TablesUpdate<"map_layers">;
export type TimelineEventUpdate = TablesUpdate<"timeline_events">;
export type EventLocationUpdate = TablesUpdate<"event_locations">;
export type FlashcardUpdate = TablesUpdate<"flashcards">;
export type PracticeQuestionUpdate = TablesUpdate<"practice_questions">;
export type QuizQuestionUpdate = TablesUpdate<"quiz_questions">;
export type QuizOptionUpdate = TablesUpdate<"quiz_options">;
