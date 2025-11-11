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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      city_review_photos: {
        Row: {
          created_at: string
          id: string
          is_cover: boolean | null
          photo_url: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_cover?: boolean | null
          photo_url: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_cover?: boolean | null
          photo_url?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "city_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      city_reviews: {
        Row: {
          city_code: string | null
          city_name: string
          comment: string | null
          cover_photo_position_x: number | null
          cover_photo_position_y: number | null
          cover_photo_scale: number | null
          created_at: string
          id: string
          rating: number
          state_name: string
          updated_at: string
          user_id: string
          visit_end_date: string | null
          visit_start_date: string | null
        }
        Insert: {
          city_code?: string | null
          city_name: string
          comment?: string | null
          cover_photo_position_x?: number | null
          cover_photo_position_y?: number | null
          cover_photo_scale?: number | null
          created_at?: string
          id?: string
          rating: number
          state_name: string
          updated_at?: string
          user_id: string
          visit_end_date?: string | null
          visit_start_date?: string | null
        }
        Update: {
          city_code?: string | null
          city_name?: string
          comment?: string | null
          cover_photo_position_x?: number | null
          cover_photo_position_y?: number | null
          cover_photo_scale?: number | null
          created_at?: string
          id?: string
          rating?: number
          state_name?: string
          updated_at?: string
          user_id?: string
          visit_end_date?: string | null
          visit_start_date?: string | null
        }
        Relationships: []
      }
      municipios: {
        Row: {
          area_km2: number | null
          cd_concu: string | null
          cd_mun: string | null
          cd_regia: string | null
          cd_rgi: string | null
          cd_rgint: string | null
          cd_uf: string | null
          geometria: unknown
          id: number
          nm_concu: string | null
          nm_mun: string | null
          nm_regia: string | null
          nm_rgi: string | null
          nm_rgint: string | null
          nm_uf: string | null
          sigla_rg: string | null
          sigla_uf: string | null
        }
        Insert: {
          area_km2?: number | null
          cd_concu?: string | null
          cd_mun?: string | null
          cd_regia?: string | null
          cd_rgi?: string | null
          cd_rgint?: string | null
          cd_uf?: string | null
          geometria?: unknown
          id?: number
          nm_concu?: string | null
          nm_mun?: string | null
          nm_regia?: string | null
          nm_rgi?: string | null
          nm_rgint?: string | null
          nm_uf?: string | null
          sigla_rg?: string | null
          sigla_uf?: string | null
        }
        Update: {
          area_km2?: number | null
          cd_concu?: string | null
          cd_mun?: string | null
          cd_regia?: string | null
          cd_rgi?: string | null
          cd_rgint?: string | null
          cd_uf?: string | null
          geometria?: unknown
          id?: number
          nm_concu?: string | null
          nm_mun?: string | null
          nm_regia?: string | null
          nm_rgi?: string | null
          nm_rgint?: string | null
          nm_uf?: string | null
          sigla_rg?: string | null
          sigla_uf?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          state_colors: Json
          updated_at: string
          user_id: string
          wishlist_color: string
        }
        Insert: {
          created_at?: string
          id?: string
          state_colors?: Json
          updated_at?: string
          user_id: string
          wishlist_color?: string
        }
        Update: {
          created_at?: string
          id?: string
          state_colors?: Json
          updated_at?: string
          user_id?: string
          wishlist_color?: string
        }
        Relationships: []
      }
      visited_cities: {
        Row: {
          area_km2: number | null
          city_code: string | null
          city_name: string
          created_at: string
          id: string
          state_abbreviation: string
          state_name: string
          user_id: string
          visited_at: string
        }
        Insert: {
          area_km2?: number | null
          city_code?: string | null
          city_name: string
          created_at?: string
          id?: string
          state_abbreviation: string
          state_name: string
          user_id: string
          visited_at?: string
        }
        Update: {
          area_km2?: number | null
          city_code?: string | null
          city_name?: string
          created_at?: string
          id?: string
          state_abbreviation?: string
          state_name?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      wishlist_cities: {
        Row: {
          added_at: string
          area_km2: number | null
          city_code: string | null
          city_name: string
          created_at: string
          id: string
          state_abbreviation: string
          state_name: string
          user_id: string
        }
        Insert: {
          added_at?: string
          area_km2?: number | null
          city_code?: string | null
          city_name: string
          created_at?: string
          id?: string
          state_abbreviation: string
          state_name: string
          user_id: string
        }
        Update: {
          added_at?: string
          area_km2?: number | null
          city_code?: string | null
          city_name?: string
          created_at?: string
          id?: string
          state_abbreviation?: string
          state_name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_user_account: { Args: never; Returns: undefined }
      get_municipality_geometry: {
        Args: { city_name: string; state_name: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const