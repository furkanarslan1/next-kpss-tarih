export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      event_locations: {
        Row: {
          created_at: string
          event_id: string
          geojson: Json | null
          id: string
          lat: number | null
          lng: number | null
          modal_body: string | null
          modal_title: string | null
          place_name: string | null
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          event_id: string
          geojson?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          modal_body?: string | null
          modal_title?: string | null
          place_name?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          event_id?: string
          geojson?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          modal_body?: string | null
          modal_title?: string | null
          place_name?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_locations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          created_by: string | null
          front: string
          hint: string | null
          id: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          topic_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          back: string
          created_at?: string
          created_by?: string | null
          front: string
          hint?: string | null
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          topic_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          back?: string
          created_at?: string
          created_by?: string | null
          front?: string
          hint?: string | null
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          topic_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      historical_entities: {
        Row: {
          body: string | null
          color: string | null
          created_at: string
          created_by: string | null
          ends_at_year: number | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          metadata: Json
          name: string
          slug: string
          starts_at_year: number | null
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          topic_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          ends_at_year?: number | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          metadata?: Json
          name: string
          slug: string
          starts_at_year?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          topic_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          ends_at_year?: number | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          metadata?: Json
          name?: string
          slug?: string
          starts_at_year?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          topic_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historical_entities_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      historical_periods: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          ends_at_year: number | null
          id: string
          slug: string
          starts_at_year: number | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          ends_at_year?: number | null
          id?: string
          slug: string
          starts_at_year?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          ends_at_year?: number | null
          id?: string
          slug?: string
          starts_at_year?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      map_layers: {
        Row: {
          created_at: string
          created_by: string | null
          geojson: Json
          id: string
          layer_kind: Database["public"]["Enums"]["map_layer_kind"]
          status: Database["public"]["Enums"]["content_status"]
          style: Json
          title: string
          topic_id: string
          updated_at: string
          updated_by: string | null
          valid_from_year: number | null
          valid_to_year: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          geojson: Json
          id?: string
          layer_kind: Database["public"]["Enums"]["map_layer_kind"]
          status?: Database["public"]["Enums"]["content_status"]
          style?: Json
          title: string
          topic_id: string
          updated_at?: string
          updated_by?: string | null
          valid_from_year?: number | null
          valid_to_year?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          geojson?: Json
          id?: string
          layer_kind?: Database["public"]["Enums"]["map_layer_kind"]
          status?: Database["public"]["Enums"]["content_status"]
          style?: Json
          title?: string
          topic_id?: string
          updated_at?: string
          updated_by?: string | null
          valid_from_year?: number | null
          valid_to_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "map_layers_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarding_completed: boolean
          total_points: number
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          onboarding_completed?: boolean
          total_points?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean
          total_points?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      quiz_attempt_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option_id: string | null
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean
          question_id: string
          selected_option_id?: string | null
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "quiz_options"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          blank_count: number
          completed_at: string | null
          correct_count: number
          created_at: string
          elapsed_seconds: number
          id: string
          mode: string
          point_delta: number
          quiz_set_id: string | null
          score: number
          topic_id: string | null
          total_questions: number
          user_id: string
          wrong_count: number
        }
        Insert: {
          blank_count?: number
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          elapsed_seconds?: number
          id?: string
          mode?: string
          point_delta?: number
          quiz_set_id?: string | null
          score?: number
          topic_id?: string | null
          total_questions?: number
          user_id: string
          wrong_count?: number
        }
        Update: {
          blank_count?: number
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          elapsed_seconds?: number
          id?: string
          mode?: string
          point_delta?: number
          quiz_set_id?: string | null
          score?: number
          topic_id?: string | null
          total_questions?: number
          user_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_set_id_fkey"
            columns: ["quiz_set_id"]
            isOneToOne: false
            referencedRelation: "quiz_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_options: {
        Row: {
          id: string
          is_correct: boolean
          option_text: string
          question_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_text: string
          question_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_text?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sets: {
        Row: {
          created_at: string
          id: string
          question_count: number
          set_order: number
          status: Database["public"]["Enums"]["content_status"]
          title: string
          topic_id: string
          unlock_required_correct: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_count?: number
          set_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          topic_id: string
          unlock_required_correct?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          question_count?: number
          set_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          topic_id?: string
          unlock_required_correct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sets_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          explanation: string | null
          id: string
          prompt: string
          quiz_set_id: string | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          topic_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: string | null
          id?: string
          prompt: string
          quiz_set_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          topic_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: string | null
          id?: string
          prompt?: string
          quiz_set_id?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          topic_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_set_id_fkey"
            columns: ["quiz_set_id"]
            isOneToOne: false
            referencedRelation: "quiz_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          ends_at_year: number | null
          entity_id: string | null
          event_type: Database["public"]["Enums"]["timeline_event_type"]
          id: string
          importance: number
          occurred_on: string | null
          starts_at_year: number | null
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          title: string
          topic_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          ends_at_year?: number | null
          entity_id?: string | null
          event_type?: Database["public"]["Enums"]["timeline_event_type"]
          id?: string
          importance?: number
          occurred_on?: string | null
          starts_at_year?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title: string
          topic_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          ends_at_year?: number | null
          entity_id?: string | null
          event_type?: Database["public"]["Enums"]["timeline_event_type"]
          id?: string
          importance?: number
          occurred_on?: string | null
          starts_at_year?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title?: string
          topic_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "historical_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          map_center: Json
          period_id: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          map_center?: Json
          period_id: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          map_center?: Json
          period_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "historical_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_flashcard_reviews: {
        Row: {
          confidence: number
          flashcard_id: string
          reviewed_at: string
          user_id: string
        }
        Insert: {
          confidence: number
          flashcard_id: string
          reviewed_at?: string
          user_id: string
        }
        Update: {
          confidence?: number
          flashcard_id?: string
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_quiz_question_with_options: {
        Args: {
          p_topic_id: string
          p_quiz_set_id: string
          p_prompt: string
          p_explanation: string | null
          p_status: Database["public"]["Enums"]["content_status"]
          p_options: Json
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "member"
      content_status: "draft" | "published" | "archived"
      entity_type:
        | "state"
        | "empire"
        | "tribe"
        | "person"
        | "place"
        | "army"
        | "treaty"
        | "other"
      map_layer_kind: "points" | "regions" | "routes" | "battlefronts"
      question_difficulty: "easy" | "medium" | "hard"
      timeline_event_type:
        | "battle"
        | "migration"
        | "treaty"
        | "capital"
        | "political"
        | "cultural"
        | "religious"
        | "economic"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "member"],
      content_status: ["draft", "published", "archived"],
      entity_type: [
        "state",
        "empire",
        "tribe",
        "person",
        "place",
        "army",
        "treaty",
        "other",
      ],
      map_layer_kind: ["points", "regions", "routes", "battlefronts"],
      question_difficulty: ["easy", "medium", "hard"],
      timeline_event_type: [
        "battle",
        "migration",
        "treaty",
        "capital",
        "political",
        "cultural",
        "religious",
        "economic",
        "other",
      ],
    },
  },
} as const
