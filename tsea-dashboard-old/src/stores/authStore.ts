// ============================================================
// src/stores/authStore.ts
// Store Zustand de autenticação — baseado em SQLite local
// Sem Supabase — sessão em memória (kiosk reiniciável)
// ============================================================
import { create } from 'zustand'
import { signOut, insertAuditLog } from '../lib/authService'
import type { LocalUser } from '../lib/authService'

// -----------------------------------------------------------
// Tipo público do operador autenticado — usado em toda a app
// -----------------------------------------------------------
export type Role = 'operador' | 'inspetor' | 'engenheiro' | 'supervisor'

export interface Operator {
  uid: string        // factory_users.id
  name: string
  badge: string      // badge_uid do crachá RFID
  role: Role
  sector: string
  sectorCode: string
}

// -----------------------------------------------------------
// Interface do store
// -----------------------------------------------------------
export interface AuthState {
  operator: Operator | null
  authenticating: boolean
  authError: string | null
  lastActivity: number
  flashFeedback: 'success' | 'error' | null
  rfidBuffer: string   // buffer de digitação em tempo real

  setOperatorFromBadge: (user: LocalUser) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string) => void
  setRfidBuffer: (buf: string) => void
  logout: () => Promise<void>
  touchActivity: () => void
  clearFlash: () => void
}

// -----------------------------------------------------------
// Store Zustand
// -----------------------------------------------------------
export const useAuthStore = create<AuthState>((set, get) => ({
  operator: null,
  authenticating: false,
  authError: null,
  lastActivity: Date.now(),
  flashFeedback: null,
  rfidBuffer: '',

  // --------------------------------------------------------
  // setOperatorFromBadge — chamado pelo useRfidReader após login OK
  // Recebe o LocalUser do authService e monta o Operator
  // --------------------------------------------------------
  setOperatorFromBadge: (user: LocalUser) => {
    const operator: Operator = {
      uid:        user.id,
      name:       user.name,
      badge:      user.badge_uid,
      role:       user.role as Role,
      sector:     user.sector,
      sectorCode: user.sector_code,
    }

    console.log(`[TSEA Auth] ✅ Sessão iniciada: ${operator.name} (${operator.badge}) — ${operator.role}`)

    set({
      operator,
      authenticating: false,
      authError: null,
      lastActivity: Date.now(),
      flashFeedback: 'success',
    })

    setTimeout(() => set({ flashFeedback: null }), 1500)

    // Registrar login no audit_log local (fire-and-forget)
    void insertAuditLog({
      factory_user_id: operator.uid,
      action: 'login',
      metadata: { badge_uid: operator.badge, role: operator.role },
    })
  },

  // --------------------------------------------------------
  // setLoading — chamado pelo useRfidReader enquanto autentica
  // --------------------------------------------------------
  setLoading: (isLoading: boolean) => {
    set({ authenticating: isLoading, authError: null })
  },

  // --------------------------------------------------------
  // setError — chamado pelo useRfidReader em caso de falha
  // --------------------------------------------------------
  setError: (error: string) => {
    set({
      authenticating: false,
      authError: error,
      flashFeedback: 'error',
      rfidBuffer: '',
    })
    setTimeout(() => set({ flashFeedback: null }), 1500)
  },

  setRfidBuffer: (buf: string) => {
    set({ rfidBuffer: buf })
  },

  // --------------------------------------------------------
  // logout — encerra sessão local + limpa store
  // --------------------------------------------------------
  logout: async () => {
    const { operator } = get()
    if (operator) {
      void insertAuditLog({
        factory_user_id: operator.uid,
        action: 'logout',
        metadata: { badge_uid: operator.badge },
      })
    }

    signOut()

    set({
      operator: null,
      authenticating: false,
      authError: null,
      lastActivity: Date.now(),
      flashFeedback: null,
    })
  },

  // --------------------------------------------------------
  // touchActivity — atualiza timestamp de última atividade
  // --------------------------------------------------------
  touchActivity: () => {
    set({ lastActivity: Date.now() })
  },

  // --------------------------------------------------------
  // clearFlash — limpa o feedback visual de sucesso/erro
  // --------------------------------------------------------
  clearFlash: () => {
    set({ flashFeedback: null })
  },
}))

// initAuthListener é mantido como no-op para compatibilidade com main.tsx
export function initAuthListener() {
  // SQLite local: sem sessão remota — nada a escutar
  return () => {}
}
