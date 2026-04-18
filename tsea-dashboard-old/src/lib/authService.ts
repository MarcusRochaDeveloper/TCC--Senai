// ============================================================
// src/lib/authService.ts
// Serviço de autenticação local — substitui supabase.auth.*
// Valida crachá RFID contra banco em memória via PBKDF2-SHA256
// ============================================================
import { getDb, derivePasswordFromUid } from './localDb'

// -----------------------------------------------------------
// Tipos de retorno
// -----------------------------------------------------------
export interface LocalUser {
  id: string
  badge_uid: string
  name: string
  registration_number: string
  role: string
  sector: string
  sector_code: string
  is_active: boolean
}

// Sessão em memória (logout = kiosk reiniciável sem estado persistente)
let _currentUser: LocalUser | null = null

// -----------------------------------------------------------
// signInWithBadge — autentica via UID do crachá RFID
// -----------------------------------------------------------
export async function signInWithBadge(
  uid: string
): Promise<{ user: LocalUser; error: null } | { user: null; error: string }> {
  const db = await getDb()
  const hash = await derivePasswordFromUid(uid)

  const found = db.users.find(
    u => u.badge_uid === uid.toUpperCase() && u.password_hash === hash && u.is_active
  )

  if (!found) {
    return { user: null, error: `Crachá "${uid}" não cadastrado no sistema.` }
  }

  const user: LocalUser = {
    id:                  found.id,
    badge_uid:           found.badge_uid,
    name:                found.name,
    registration_number: found.registration_number,
    role:                found.role,
    sector:              found.sector,
    sector_code:         found.sector_code,
    is_active:           found.is_active,
  }

  _currentUser = user
  console.log(`[TSEA LocalAuth] ✅ Login OK: ${user.name} (${user.badge_uid}) — ${user.role}`)
  return { user, error: null }
}

// -----------------------------------------------------------
// signOut — limpa sessão em memória
// -----------------------------------------------------------
export function signOut(): void {
  if (_currentUser) {
    console.log(`[TSEA LocalAuth] 🔒 Logout: ${_currentUser.name}`)
  }
  _currentUser = null
}

// -----------------------------------------------------------
// getCurrentUser — retorna operador logado ou null
// -----------------------------------------------------------
export function getCurrentUser(): LocalUser | null {
  return _currentUser
}

// -----------------------------------------------------------
// insertAuditLog — registra ação no audit_log em memória
// Falha silenciosa para não bloquear o operador
// -----------------------------------------------------------
export async function insertAuditLog(params: {
  factory_user_id: string | null
  document_id?: string | null
  production_order_id?: string | null
  action: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const db = await getDb()
    db.auditLog.push({
      id:                  crypto.randomUUID(),
      factory_user_id:     params.factory_user_id ?? null,
      document_id:         params.document_id ?? null,
      production_order_id: params.production_order_id ?? null,
      action:              params.action,
      metadata:            params.metadata ?? {},
      created_at:          new Date().toISOString(),
    })
  } catch (e) {
    console.warn('[TSEA LocalAuth] audit_log insert silently failed:', e)
  }
}
