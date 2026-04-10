/**
 * Tipos de la base de datos de El Caiquen.
 * Este archivo se puede regenerar con:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */

export type UserRole = 'admin' | 'empleado'

export type StockMovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'MERMA' | 'TRANSFERENCIA'

export type EmpMovementType =
  | 'PRODUCCION'
  | 'VENTA_FINDE'
  | 'REPOSICION_BAR'
  | 'RETIRO'
  | 'CONSUMICION'

export type EmpSabor = 'CARNE' | 'PICANTE' | 'POLLO' | 'TYQ' | 'JYQ' | 'QCH' | 'HUMITA'

export type EmpLocation = 'BAR' | 'FABRICA' | 'SAN_MIGUEL'

export type ProductionLogStatus = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          role?: UserRole
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          color?: string | null
        }
      }
      units: {
        Row: {
          id: string
          name: string
          abbreviation: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          abbreviation: string
        }
        Update: {
          name?: string
          abbreviation?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact: string | null
          phone: string | null
          notes: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact?: string | null
          phone?: string | null
          notes?: string | null
        }
        Update: {
          name?: string
          contact?: string | null
          phone?: string | null
          notes?: string | null
          deleted_at?: string | null
        }
      }
      items: {
        Row: {
          id: string          // ELC-0001
          item_code: string   // cebolla_kg
          name: string
          category_id: string
          unit_id: string
          supplier_id: string | null
          notes: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          item_code: string
          name: string
          category_id: string
          unit_id: string
          supplier_id?: string | null
          notes?: string | null
        }
        Update: {
          name?: string
          category_id?: string
          unit_id?: string
          supplier_id?: string | null
          notes?: string | null
          deleted_at?: string | null
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          name?: string
          description?: string | null
        }
      }
      stock_current: {
        Row: {
          id: string
          item_id: string
          location_id: string
          quantity: number
          reorder_point: number
          last_count_at: string | null
          counted_by: string | null
          updated_at: string
        }
        Insert: {
          item_id: string
          location_id: string
          quantity?: number
          reorder_point?: number
        }
        Update: {
          quantity?: number
          reorder_point?: number
          last_count_at?: string | null
          counted_by?: string | null
        }
      }
      stock_movements: {
        Row: {
          id: string
          item_id: string
          location_id: string
          type: StockMovementType
          quantity: number
          reason: string | null
          responsible_id: string | null
          created_at: string
        }
        Insert: {
          item_id: string
          location_id: string
          type: StockMovementType
          quantity: number
          reason?: string | null
          responsible_id?: string | null
        }
        Update: never // Ledger inmutable
      }
      employees: {
        Row: {
          id: string
          full_name: string
          position_id: string
          base_salary: number
          phone: string | null
          notes: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          full_name: string
          position_id: string
          base_salary: number
          phone?: string | null
          notes?: string | null
        }
        Update: {
          full_name?: string
          position_id?: string
          base_salary?: number
          phone?: string | null
          notes?: string | null
          deleted_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          old_data: Record<string, unknown> | null
          new_data: Record<string, unknown> | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          table_name: string
          record_id: string
          action: string
          old_data?: Record<string, unknown> | null
          new_data?: Record<string, unknown> | null
          user_id?: string | null
        }
        Update: never // Inmutable
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      stock_movement_type: StockMovementType
    }
  }
}
