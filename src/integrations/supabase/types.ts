export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          parent_id: string | null;
          position: number;
          store_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          parent_id?: string | null;
          position?: number;
          store_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          parent_id?: string | null;
          position?: number;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      product_color_images: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          image_url: string;
          position: number;
          product_id: string;
        };
        Insert: {
          color: string;
          created_at?: string;
          id?: string;
          image_url: string;
          position?: number;
          product_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          image_url?: string;
          position?: number;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_color_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          created_at: string;
          id: string;
          position: number;
          product_id: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          position?: number;
          product_id: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          position?: number;
          product_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          color: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          numbering: string | null;
          product_id: string;
          size: string | null;
          sku: string | null;
          stock: number;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          numbering?: string | null;
          product_id: string;
          size?: string | null;
          sku?: string | null;
          stock?: number;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          numbering?: string | null;
          product_id?: string;
          size?: string | null;
          sku?: string | null;
          stock?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          barcode: string | null;
          category_id: string | null;
          compare_at_price: number | null;
          created_at: string;
          description: string | null;
          featured: boolean;
          has_variations: boolean;
          id: string;
          name: string;
          price: number;
          sku: string | null;
          stock: number;
          store_id: string;
        };
        Insert: {
          active?: boolean;
          barcode?: string | null;
          category_id?: string | null;
          compare_at_price?: number | null;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          has_variations?: boolean;
          id?: string;
          name: string;
          price?: number;
          sku?: string | null;
          stock?: number;
          store_id: string;
        };
        Update: {
          active?: boolean;
          barcode?: string | null;
          category_id?: string | null;
          compare_at_price?: number | null;
          created_at?: string;
          description?: string | null;
          featured?: boolean;
          has_variations?: boolean;
          id?: string;
          name?: string;
          price?: number;
          sku?: string | null;
          stock?: number;
          store_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      stores: {
        Row: {
          address: string | null;
          banner_url: string | null;
          city: string | null;
          created_at: string;
          description: string | null;
          id: string;
          instagram: string | null;
          logo_url: string | null;
          name: string;
          owner_id: string;
          slug: string;
          state: string | null;
          theme_color: string | null;
          whatsapp: string | null;
          zip_code: string | null;
        };
        Insert: {
          address?: string | null;
          banner_url?: string | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          instagram?: string | null;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          slug: string;
          state?: string | null;
          theme_color?: string | null;
          whatsapp?: string | null;
          zip_code?: string | null;
        };
        Update: {
          address?: string | null;
          banner_url?: string | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          instagram?: string | null;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          slug?: string;
          state?: string | null;
          theme_color?: string | null;
          whatsapp?: string | null;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      store_visit_counts: {
        Row: {
          store_id: string;
          day: string;
          count: number;
        };
        Insert: {
          store_id: string;
          day?: string;
          count?: number;
        };
        Update: {
          store_id?: string;
          day?: string;
          count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "store_visit_counts_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          store_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          store_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          store_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_store_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _store_id: string;
          _user_id: string;
        };
        Returns: boolean;
      };
      increment_store_visit: {
        Args: {
          p_store_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      app_role: "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const;
