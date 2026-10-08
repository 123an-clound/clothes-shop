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
      cs_admins: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      cs_categories: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_featured: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      cs_order_items: {
        Row: {
          color: string
          id: string
          order_id: string
          product_name: string
          quantity: number
          size: string
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          color: string
          id?: string
          order_id: string
          product_name: string
          quantity: number
          size: string
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          color?: string
          id?: string
          order_id?: string
          product_name?: string
          quantity?: number
          size?: string
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cs_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "cs_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cs_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "cs_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_orders: {
        Row: {
          address_line: string
          code: string
          created_at: string
          district: string
          id: string
          note: string
          payment_method: Database["public"]["Enums"]["cs_payment_method"]
          payment_status: Database["public"]["Enums"]["cs_payment_status"]
          phone: string
          province: string
          recipient_name: string
          shipping_fee: number
          status: Database["public"]["Enums"]["cs_order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
          ward: string
        }
        Insert: {
          address_line: string
          code: string
          created_at?: string
          district?: string
          id?: string
          note?: string
          payment_method: Database["public"]["Enums"]["cs_payment_method"]
          payment_status?: Database["public"]["Enums"]["cs_payment_status"]
          phone: string
          province: string
          recipient_name: string
          shipping_fee: number
          status?: Database["public"]["Enums"]["cs_order_status"]
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
          ward?: string
        }
        Update: {
          address_line?: string
          code?: string
          created_at?: string
          district?: string
          id?: string
          note?: string
          payment_method?: Database["public"]["Enums"]["cs_payment_method"]
          payment_status?: Database["public"]["Enums"]["cs_payment_status"]
          phone?: string
          province?: string
          recipient_name?: string
          shipping_fee?: number
          status?: Database["public"]["Enums"]["cs_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          ward?: string
        }
        Relationships: []
      }
      cs_product_images: {
        Row: {
          alt: string
          color: string | null
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string
          color?: string | null
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string
          color?: string | null
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "cs_products"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_products: {
        Row: {
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string
          id: string
          is_featured: boolean
          is_published: boolean
          name: string
          price: number
          slug: string
          sold_count: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name: string
          price: number
          slug: string
          sold_count?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name?: string
          price?: number
          slug?: string
          sold_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cs_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_profiles: {
        Row: {
          address_line: string | null
          district: string | null
          full_name: string | null
          id: string
          phone: string | null
          province: string | null
          updated_at: string
          ward: string | null
        }
        Insert: {
          address_line?: string | null
          district?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          province?: string | null
          updated_at?: string
          ward?: string | null
        }
        Update: {
          address_line?: string | null
          district?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          province?: string | null
          updated_at?: string
          ward?: string | null
        }
        Relationships: []
      }
      cs_rate_events: {
        Row: {
          created_at: string
          key: string
        }
        Insert: {
          created_at?: string
          key: string
        }
        Update: {
          created_at?: string
          key?: string
        }
        Relationships: []
      }
      cs_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      cs_variants: {
        Row: {
          color: string
          color_hex: string
          id: string
          price: number | null
          product_id: string
          size: string
          sku: string
          stock: number
        }
        Insert: {
          color: string
          color_hex: string
          id?: string
          price?: number | null
          product_id: string
          size: string
          sku: string
          stock?: number
        }
        Update: {
          color?: string
          color_hex?: string
          id?: string
          price?: number | null
          product_id?: string
          size?: string
          sku?: string
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "cs_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "cs_products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
    }
    Functions: {
      cs_admin_save_product: { Args: { p: Json }; Returns: string }
      cs_admin_stats: { Args: never; Returns: Json }
      cs_admin_update_order: {
        Args: {
          p_order_id: string
          p_payment_status: Database["public"]["Enums"]["cs_payment_status"]
          p_status: Database["public"]["Enums"]["cs_order_status"]
        }
        Returns: undefined
      }
      cs_is_admin: { Args: never; Returns: boolean }
      cs_place_order: {
        Args: {
          p_items: Json
          p_payment_method: Database["public"]["Enums"]["cs_payment_method"]
          p_shipping: Json
        }
        Returns: string
      }
      cs_rate_hit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
    }
    Enums: {
      cs_order_status:
        | "pending"
        | "confirmed"
        | "shipping"
        | "completed"
        | "cancelled"
      cs_payment_method: "cod" | "bank_transfer"
      cs_payment_status: "unpaid" | "paid"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      cs_order_status: [
        "pending",
        "confirmed",
        "shipping",
        "completed",
        "cancelled",
      ],
      cs_payment_method: ["cod", "bank_transfer"],
      cs_payment_status: ["unpaid", "paid"],
    },
  },
} as const
