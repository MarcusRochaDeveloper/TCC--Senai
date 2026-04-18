// ============================================================
// src/types/database.ts
// Schema TypeScript compatível com Supabase v2 createClient<Database>
//
// FORMATO OBRIGATÓRIO: cada tabela DEVE ter Row, Insert, Update,
// e Relationships. O schema DEVE ter Views, Enums, CompositeTypes.
// Sem esses campos, o generic constraint falha e tudo vira 'never'.
// ============================================================

export type Role = 'operador' | 'inspetor' | 'engenheiro' | 'supervisor'
export type ProductType = 'power_transformer' | 'voltage_regulator'
export type OrderStatus = 'in_progress' | 'completed' | 'on_hold'
export type DocumentType = 'engineering_drawing' | 'sop' | 'inspection_report'
export type DocumentStatus = 'WIP' | 'Released' | 'Obsolete'
export type AuditAction =
  | 'login'
  | 'logout'
  | 'op_opened'
  | 'document_viewed'
  | 'session_timeout'
  | 'qr_scan'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// -----------------------------------------------------------
// Row types — espelham exatamente as colunas do PostgreSQL
// -----------------------------------------------------------
export type DbRole = {
  id: string
  name: Role
  permissions: string[]
}

export type DbSector = {
  id: string
  name: string
  area_code: string
}

export type DbFactoryUser = {
  id: string
  auth_user_id: string | null
  role_id: string
  sector_id: string
  name: string
  badge_uid: string
  registration_number: string
  is_active: boolean
  created_at: string
}

export type DbProductionOrder = {
  id: string
  op_number: string
  product_title: string
  product_type: ProductType
  mva_class: string | null
  kv_class: string | null
  sector_id: string | null
  status: OrderStatus
  started_at: string
  completed_at: string | null
}

export type DbDocument = {
  id: string
  production_order_id: string
  document_type: DocumentType
  title: string
  revision: string
  status: DocumentStatus
  storage_path: string | null
  storage_path_3d: string | null
  uploaded_by: string | null
  released_at: string | null
  created_at: string
}

export type DbAuditLog = {
  id: string
  factory_user_id: string | null
  document_id: string | null
  production_order_id: string | null
  action: AuditAction
  metadata: Json
  created_at: string
}

// -----------------------------------------------------------
// Tipos de JOIN explícitos — usados nos queries com .select()
// Nunca confiar na inferência automática do Supabase para joins;
// sempre usar esses tipos com 'as' nas queries com relações.
// -----------------------------------------------------------
export type FactoryUserProfile = {
  id: string
  name: string
  badge_uid: string
  is_active: boolean
  roles: { name: Role } | null
  sectors: { name: string; area_code: string } | null
}

export type ProductionOrderWithSector = DbProductionOrder & {
  sectors: { name: string; area_code: string } | null
}

// -----------------------------------------------------------
// Database — tipo principal para createClient<Database>
//
// REGRAS DO SUPABASE v2 (GenericSchema constraint):
// - Cada tabela DEVE ter: Row, Insert, Update, Relationships
// - Update NUNCA pode ser 'never' (viola Record<string, unknown>)
// - O schema DEVE ter: Tables, Views, Functions, Enums, CompositeTypes
// -----------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      roles: {
        Row: DbRole
        Insert: Partial<DbRole>
        Update: Partial<DbRole>
        Relationships: []
      }
      sectors: {
        Row: DbSector
        Insert: Partial<DbSector>
        Update: Partial<DbSector>
        Relationships: []
      }
      factory_users: {
        Row: DbFactoryUser
        Insert: Partial<DbFactoryUser>
        Update: Partial<DbFactoryUser>
        Relationships: [
          {
            foreignKeyName: 'factory_users_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'factory_users_sector_id_fkey'
            columns: ['sector_id']
            isOneToOne: false
            referencedRelation: 'sectors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'factory_users_auth_user_id_fkey'
            columns: ['auth_user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      production_orders: {
        Row: DbProductionOrder
        Insert: Partial<DbProductionOrder>
        Update: Partial<DbProductionOrder>
        Relationships: [
          {
            foreignKeyName: 'production_orders_sector_id_fkey'
            columns: ['sector_id']
            isOneToOne: false
            referencedRelation: 'sectors'
            referencedColumns: ['id']
          }
        ]
      }
      documents: {
        Row: DbDocument
        Insert: Partial<DbDocument>
        Update: Partial<DbDocument>
        Relationships: [
          {
            foreignKeyName: 'documents_production_order_id_fkey'
            columns: ['production_order_id']
            isOneToOne: false
            referencedRelation: 'production_orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'factory_users'
            referencedColumns: ['id']
          }
        ]
      }
      audit_log: {
        Row: DbAuditLog
        Insert: Partial<DbAuditLog>
        Update: Partial<DbAuditLog>
        Relationships: [
          {
            foreignKeyName: 'audit_log_factory_user_id_fkey'
            columns: ['factory_user_id']
            isOneToOne: false
            referencedRelation: 'factory_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_log_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_log_production_order_id_fkey'
            columns: ['production_order_id']
            isOneToOne: false
            referencedRelation: 'production_orders'
            referencedColumns: ['id']
          }
        ]
      }
      app_errors: {
        Row: {
          id: string
          factory_user_id: string | null
          error_message: string
          error_stack: string | null
          component_stack: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          factory_user_id?: string | null
          error_message: string
          error_stack?: string | null
          component_stack?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          factory_user_id?: string | null
          error_message?: string
          error_stack?: string | null
          component_stack?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'app_errors_factory_user_id_fkey'
            columns: ['factory_user_id']
            isOneToOne: false
            referencedRelation: 'factory_users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    // Campos obrigatórios para o generic constraint do Supabase v2
    Views: Record<string, never>
    Functions: {
      get_current_factory_user: {
        Args: Record<string, unknown>
        Returns: DbFactoryUser
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
