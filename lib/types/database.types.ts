// Hand-written from supabase/migrations/*.sql (no CLI/MCP access to this
// project to auto-generate — see FOUNDER_TODO.md). Keep in sync with the
// migrations by hand until that's possible.
//
// `Relationships: []` on every table is required structurally by
// @supabase/postgrest-js's GenericTable type (2.x) even though we don't
// use embedded/joined selects yet — without it the query builder's
// generics silently collapse to `never` everywhere.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          onboarding_completed: boolean;
          preferred_genres: number[];
          content_origin: "domestic" | "foreign" | "both";
          watch_language: "turkish" | "subtitled" | "both";
          ui_language: "en" | "tr" | "fr";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          preferred_genres?: number[];
          content_origin?: "domestic" | "foreign" | "both";
          watch_language?: "turkish" | "subtitled" | "both";
          ui_language?: "en" | "tr" | "fr";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      movies_cache: {
        Row: {
          tmdb_id: number;
          title: string;
          poster_path: string | null;
          backdrop_path: string | null;
          release_year: number | null;
          runtime: number | null;
          genres: Json;
          genre_ids: number[];
          director: string | null;
          cast_members: Json;
          overview: string | null;
          external_rating: number | null;
          popularity: number | null;
          original_language: string | null;
          spoken_languages: Json;
          keywords: Json;
          production_companies: Json;
          search_blob: string;
          trailer_key: string | null;
          trailer_videos: Json;
          trailer_key_tr: string | null;
          trailer_key_fr: string | null;
          cached_at: string;
        };
        Insert: {
          tmdb_id: number;
          title: string;
          poster_path?: string | null;
          backdrop_path?: string | null;
          release_year?: number | null;
          runtime?: number | null;
          genres?: Json;
          genre_ids?: number[];
          director?: string | null;
          cast_members?: Json;
          overview?: string | null;
          external_rating?: number | null;
          popularity?: number | null;
          original_language?: string | null;
          spoken_languages?: Json;
          keywords?: Json;
          production_companies?: Json;
          search_blob?: string;
          trailer_key?: string | null;
          trailer_videos?: Json;
          trailer_key_tr?: string | null;
          trailer_key_fr?: string | null;
          cached_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["movies_cache"]["Insert"]>;
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          user_id: string;
          movie_id: number;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          movie_id: number;
          rating: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ratings"]["Insert"]>;
        Relationships: [];
      };
      watch_history: {
        Row: {
          id: string;
          user_id: string;
          movie_id: number;
          watched_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          movie_id: number;
          watched_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["watch_history"]["Insert"]>;
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["friendships"]["Insert"]>;
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          avatar_url?: string | null;
          owner_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["group_members"]["Insert"]>;
        Relationships: [];
      };
      pathways: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          type: "main" | "themed";
          filters_json: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          type?: "main" | "themed";
          filters_json?: Json;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pathways"]["Insert"]>;
        Relationships: [];
      };
      pathway_movies: {
        Row: {
          pathway_id: string;
          movie_id: number;
          position: number;
          group_match_score: number | null;
        };
        Insert: {
          pathway_id: string;
          movie_id: number;
          position: number;
          group_match_score?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["pathway_movies"]["Insert"]>;
        Relationships: [];
      };
      pathway_progress: {
        Row: {
          pathway_id: string;
          movie_id: number;
          user_id: string;
          status: "not_started" | "watched";
          rating: number | null;
          completed_at: string | null;
        };
        Insert: {
          pathway_id: string;
          movie_id: number;
          user_id: string;
          status?: "not_started" | "watched";
          rating?: number | null;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pathway_progress"]["Insert"]>;
        Relationships: [];
      };
      reel_swipes: {
        Row: {
          user_id: string;
          movie_id: number;
          liked: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          movie_id: number;
          liked: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reel_swipes"]["Insert"]>;
        Relationships: [];
      };
      saved_movies: {
        Row: {
          user_id: string;
          movie_id: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          movie_id: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_movies"]["Insert"]>;
        Relationships: [];
      };
      movie_comments: {
        Row: {
          id: string;
          user_id: string;
          movie_id: number;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          movie_id: number;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["movie_comments"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string };
        Returns: boolean;
      };
      group_role: {
        Args: { p_group_id: string; p_user_id: string };
        Returns: string | null;
      };
      movie_community_rating: {
        Args: { p_movie_id: number };
        Returns: { avg_rating: number | null; rating_count: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
