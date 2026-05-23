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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      analytics_events: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_ms: number | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          hotspot_id: string | null
          id: number
          metadata: Json
          os: string | null
          panorama_id: string | null
          project_id: string
          referrer: string | null
          session_id: string
          share_id: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          hotspot_id?: string | null
          id?: number
          metadata?: Json
          os?: string | null
          panorama_id?: string | null
          project_id: string
          referrer?: string | null
          session_id: string
          share_id?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          hotspot_id?: string | null
          id?: number
          metadata?: Json
          os?: string | null
          panorama_id?: string | null
          project_id?: string
          referrer?: string | null
          session_id?: string
          share_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_hotspot_id_fkey"
            columns: ["hotspot_id"]
            isOneToOne: false
            referencedRelation: "hotspots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_panorama_id_fkey"
            columns: ["panorama_id"]
            isOneToOne: false
            referencedRelation: "panoramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "shares"
            referencedColumns: ["id"]
          },
        ]
      }
      hotspots: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          metadata: Json
          panorama_id: string
          pitch: number
          target_panorama_id: string | null
          title: string | null
          type: Database["public"]["Enums"]["hotspot_type"]
          updated_at: string
          yaw: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          panorama_id: string
          pitch: number
          target_panorama_id?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["hotspot_type"]
          updated_at?: string
          yaw: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          panorama_id?: string
          pitch?: number
          target_panorama_id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["hotspot_type"]
          updated_at?: string
          yaw?: number
        }
        Relationships: [
          {
            foreignKeyName: "hotspots_panorama_id_fkey"
            columns: ["panorama_id"]
            isOneToOne: false
            referencedRelation: "panoramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotspots_target_panorama_id_fkey"
            columns: ["target_panorama_id"]
            isOneToOne: false
            referencedRelation: "panoramas"
            referencedColumns: ["id"]
          },
        ]
      }
      panoramas: {
        Row: {
          created_at: string
          default_pitch: number | null
          default_yaw: number | null
          default_zoom: number | null
          deleted_at: string | null
          file_size: number | null
          height: number | null
          id: string
          metadata: Json
          position: number
          project_id: string
          status: Database["public"]["Enums"]["panorama_status"]
          storage_key: string
          thumbnail_key: string | null
          title: string
          updated_at: string
          width: number | null
        }
        Insert: {
          created_at?: string
          default_pitch?: number | null
          default_yaw?: number | null
          default_zoom?: number | null
          deleted_at?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          metadata?: Json
          position?: number
          project_id: string
          status?: Database["public"]["Enums"]["panorama_status"]
          storage_key: string
          thumbnail_key?: string | null
          title: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          created_at?: string
          default_pitch?: number | null
          default_yaw?: number | null
          default_zoom?: number | null
          deleted_at?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          metadata?: Json
          position?: number
          project_id?: string
          status?: Database["public"]["Enums"]["panorama_status"]
          storage_key?: string
          thumbnail_key?: string | null
          title?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "panoramas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          brand_logo_url: string | null
          brand_name: string | null
          brand_primary_color: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          brand_logo_url?: string | null
          brand_name?: string | null
          brand_primary_color?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          brand_logo_url?: string | null
          brand_name?: string | null
          brand_primary_color?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          cover_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          location: string | null
          metadata: Json
          owner_id: string
          status: Database["public"]["Enums"]["project_status"]
          title: string
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          metadata?: Json
          owner_id: string
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          metadata?: Json
          owner_id?: string
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          password_hash: string | null
          project_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          password_hash?: string | null
          project_id: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          password_hash?: string | null
          project_id?: string
          token?: string
        }
        Relationships: []
      }
      shares: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          password_hash: string | null
          project_id: string
          token: string
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          password_hash?: string | null
          project_id: string
          token: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          password_hash?: string | null
          project_id?: string
          token?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      viewpoints: {
        Row: {
          created_at: string
          id: string
          label: string
          lat: number | null
          lng: number | null
          project_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          lat?: number | null
          lng?: number | null
          project_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          lat?: number | null
          lng?: number | null
          project_id?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      project_stats: {
        Row: {
          avg_duration_ms: number | null
          hotspot_clicks: number | null
          last_view_at: string | null
          project_id: string | null
          total_views: number | null
          unique_visitors: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      analytics_event_type:
        | "view_start"
        | "view_end"
        | "panorama_change"
        | "hotspot_click"
        | "fullscreen_enter"
        | "vr_enter"
      hotspot_type: "link" | "info" | "pin" | "text" | "area" | "floor"
      panorama_status: "uploading" | "processing" | "ready" | "failed"
      project_status: "draft" | "published" | "archived"
      project_type: "real_estate" | "boat" | "other"
      user_role: "admin" | "client"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      analytics_event_type: [
        "view_start",
        "view_end",
        "panorama_change",
        "hotspot_click",
        "fullscreen_enter",
        "vr_enter",
      ],
      hotspot_type: ["link", "info"],
      panorama_status: ["uploading", "processing", "ready", "failed"],
      project_status: ["draft", "published", "archived"],
      project_type: ["real_estate", "boat", "other"],
      user_role: ["admin", "client"],
    },
  },
} as const
