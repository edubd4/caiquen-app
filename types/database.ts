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
      app_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      empanada_flavors: {
        Row: {
          active: boolean
          code: Database["public"]["Enums"]["emp_sabor"]
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          code: Database["public"]["Enums"]["emp_sabor"]
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          code?: Database["public"]["Enums"]["emp_sabor"]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      empanada_movements: {
        Row: {
          created_at: string
          flavor_id: string
          id: string
          location: Database["public"]["Enums"]["emp_location"]
          notes: string | null
          quantity: number
          responsible_id: string | null
          type: Database["public"]["Enums"]["emp_movement_type"]
        }
        Insert: {
          created_at?: string
          flavor_id: string
          id?: string
          location: Database["public"]["Enums"]["emp_location"]
          notes?: string | null
          quantity: number
          responsible_id?: string | null
          type: Database["public"]["Enums"]["emp_movement_type"]
        }
        Update: {
          created_at?: string
          flavor_id?: string
          id?: string
          location?: Database["public"]["Enums"]["emp_location"]
          notes?: string | null
          quantity?: number
          responsible_id?: string | null
          type?: Database["public"]["Enums"]["emp_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "empanada_movements_flavor_id_fkey"
            columns: ["flavor_id"]
            isOneToOne: false
            referencedRelation: "empanada_flavors"
            referencedColumns: ["id"]
          },
        ]
      }
      empanada_production: {
        Row: {
          created_at: string
          flavor_id: string
          id: string
          notes: string | null
          production_date: string
          quantity: number
          registered_by: string | null
          source_location: Database["public"]["Enums"]["emp_location"]
        }
        Insert: {
          created_at?: string
          flavor_id: string
          id?: string
          notes?: string | null
          production_date?: string
          quantity: number
          registered_by?: string | null
          source_location?: Database["public"]["Enums"]["emp_location"]
        }
        Update: {
          created_at?: string
          flavor_id?: string
          id?: string
          notes?: string | null
          production_date?: string
          quantity?: number
          registered_by?: string | null
          source_location?: Database["public"]["Enums"]["emp_location"]
        }
        Relationships: [
          {
            foreignKeyName: "empanada_production_flavor_id_fkey"
            columns: ["flavor_id"]
            isOneToOne: false
            referencedRelation: "empanada_flavors"
            referencedColumns: ["id"]
          },
        ]
      }
      empanada_stock: {
        Row: {
          flavor_id: string
          id: string
          location: Database["public"]["Enums"]["emp_location"]
          quantity: number
          updated_at: string
        }
        Insert: {
          flavor_id: string
          id?: string
          location: Database["public"]["Enums"]["emp_location"]
          quantity?: number
          updated_at?: string
        }
        Update: {
          flavor_id?: string
          id?: string
          location?: Database["public"]["Enums"]["emp_location"]
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empanada_stock_flavor_id_fkey"
            columns: ["flavor_id"]
            isOneToOne: false
            referencedRelation: "empanada_flavors"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          base_salary: number
          created_at: string
          deleted_at: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          position_id: string
          updated_at: string
        }
        Insert: {
          base_salary?: number
          created_at?: string
          deleted_at?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          position_id: string
          updated_at?: string
        }
        Update: {
          base_salary?: number
          created_at?: string
          deleted_at?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          position_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "job_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category_id: string
          created_at: string
          deleted_at: string | null
          id: string
          item_code: string
          name: string
          notes: string | null
          price: number | null
          supplier_id: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          // item_code es GENERATED ALWAYS AS (id) STORED — no se puede insertar
          name: string
          notes?: string | null
          price?: number | null
          supplier_id?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          // item_code es GENERATED ALWAYS AS — no se puede actualizar
          name?: string
          notes?: string | null
          price?: number | null
          supplier_id?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      job_positions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      payroll_advances: {
        Row: {
          amount: number
          created_at: string
          date: string
          employee_id: string
          id: string
          period_id: string | null
          reason: string | null
          registered_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          period_id?: string | null
          reason?: string | null
          registered_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          period_id?: string | null
          reason?: string | null
          registered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_payroll_summary"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "payroll_advances_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_advances_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "v_payroll_summary"
            referencedColumns: ["period_id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
          week_end: string
          week_start: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          week_end: string
          week_start: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      production_logs: {
        Row: {
          actual_yield: number | null
          created_at: string
          id: string
          location_id: string | null
          production_date: string
          qty_produced: number
          recipe_id: string
          registered_by: string | null
          status: string
          theoretical_yield: number | null
          yield_notes: string | null
        }
        Insert: {
          actual_yield?: number | null
          created_at?: string
          id?: string
          location_id?: string | null
          production_date?: string
          qty_produced: number
          recipe_id: string
          registered_by?: string | null
          status?: string
          theoretical_yield?: number | null
          yield_notes?: string | null
        }
        Update: {
          actual_yield?: number | null
          created_at?: string
          id?: string
          location_id?: string | null
          production_date?: string
          qty_produced?: number
          recipe_id?: string
          registered_by?: string | null
          status?: string
          theoretical_yield?: number | null
          yield_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_logs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      recipe_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          notes: string | null
          quantity: number
          recipe_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          recipe_id: string
          unit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          recipe_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
          yield_qty: number | null
          yield_unit: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          yield_qty?: number | null
          yield_unit?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          yield_qty?: number | null
          yield_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_yield_unit_fkey"
            columns: ["yield_unit"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_products: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
        }
        Insert: {
          category: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      regional_stock: {
        Row: {
          id: string
          presentation: string
          price: number | null
          product_id: string
          quantity: number
          reorder_point: number
          updated_at: string
        }
        Insert: {
          id?: string
          presentation: string
          price?: number | null
          product_id: string
          quantity?: number
          reorder_point?: number
          updated_at?: string
        }
        Update: {
          id?: string
          presentation?: string
          price?: number | null
          product_id?: string
          quantity?: number
          reorder_point?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regional_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "regional_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          date: string
          employee_id: string
          hours_worked: number | null
          id: string
          notes: string | null
          registered_by: string | null
          time_in: string | null
          time_out: string | null
        }
        Insert: {
          created_at?: string
          date: string
          employee_id: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          registered_by?: string | null
          time_in?: string | null
          time_out?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          employee_id?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          registered_by?: string | null
          time_in?: string | null
          time_out?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_payroll_summary"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      stock_current: {
        Row: {
          counted_by: string | null
          id: string
          item_id: string
          last_count_at: string | null
          location_id: string
          quantity: number
          reorder_point: number
          updated_at: string
        }
        Insert: {
          counted_by?: string | null
          id?: string
          item_id: string
          last_count_at?: string | null
          location_id: string
          quantity?: number
          reorder_point?: number
          updated_at?: string
        }
        Update: {
          counted_by?: string | null
          id?: string
          item_id?: string
          last_count_at?: string | null
          location_id?: string
          quantity?: number
          reorder_point?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_current_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_current_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          item_id: string
          location_id: string
          quantity: number
          reason: string | null
          responsible_id: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          location_id: string
          quantity: number
          reason?: string | null
          responsible_id?: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          location_id?: string
          quantity?: number
          reason?: string | null
          responsible_id?: string | null
          type?: Database["public"]["Enums"]["stock_movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_empanada_stock_summary: {
        Row: {
          location: Database["public"]["Enums"]["emp_location"] | null
          quantity: number | null
          sabor_code: Database["public"]["Enums"]["emp_sabor"] | null
          sabor_nombre: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_payroll_summary: {
        Row: {
          base_salary: number | null
          earned_salary: number | null
          employee_id: string | null
          full_name: string | null
          net_payable: number | null
          period_id: string | null
          period_status: string | null
          position: string | null
          total_advances: number | null
          total_hours: number | null
          week_end: string | null
          week_start: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_production_feasibility: {
        Args: { p_location_id?: string; p_qty: number; p_recipe_id: string }
        Returns: {
          available_qty: number
          item_id: string
          item_name: string
          missing_qty: number
          required_qty: number
          unit_abbr: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      emp_location: "BAR" | "FABRICA" | "SAN_MIGUEL"
      emp_movement_type:
        | "PRODUCCION"
        | "VENTA_FINDE"
        | "REPOSICION_BAR"
        | "RETIRO"
        | "CONSUMICION"
      emp_sabor:
        | "CARNE"
        | "PICANTE"
        | "POLLO"
        | "TYQ"
        | "JYQ"
        | "QCH"
        | "HUMITA"
      stock_movement_type:
        | "ENTRADA"
        | "SALIDA"
        | "AJUSTE"
        | "MERMA"
        | "TRANSFERENCIA"
      user_role: "admin" | "empleado"
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
      emp_location: ["BAR", "FABRICA", "SAN_MIGUEL"],
      emp_movement_type: [
        "PRODUCCION",
        "VENTA_FINDE",
        "REPOSICION_BAR",
        "RETIRO",
        "CONSUMICION",
      ],
      emp_sabor: ["CARNE", "PICANTE", "POLLO", "TYQ", "JYQ", "QCH", "HUMITA"],
      stock_movement_type: [
        "ENTRADA",
        "SALIDA",
        "AJUSTE",
        "MERMA",
        "TRANSFERENCIA",
      ],
      user_role: ["admin", "empleado"],
    },
  },
} as const
