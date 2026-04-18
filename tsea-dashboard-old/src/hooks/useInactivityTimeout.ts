import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { insertAuditLog } from '../lib/authService'

/**
 * Inactivity Timeout Hook (Req. §6)
 *
 * After VITE_INACTIVITY_TIMEOUT_MS (default: 300_000ms = 5 min)
 * without mechanical interaction, the frontend auto-logs out via
 * authService.signOut() (called internally by store.logout())
 * and registers 'session_timeout' in the audit_log.
 *
 * Activity events tracked: pointerdown, pointermove, keydown, wheel, scroll
 */

const INACTIVITY_TIMEOUT_MS = Number(
  import.meta.env.VITE_INACTIVITY_TIMEOUT_MS ?? 300_000
)
const CHECK_INTERVAL_MS = 10_000 // verifica a cada 10 segundos

export function useInactivityTimeout() {
  const operator = useAuthStore((s) => s.operator)
  const lastActivity = useAuthStore((s) => s.lastActivity)
  const logout = useAuthStore((s) => s.logout)
  const touchActivity = useAuthStore((s) => s.touchActivity)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // -- Atualiza timestamp de última atividade --
  const handleActivity = useCallback(() => {
    touchActivity()
  }, [touchActivity])

  // -- Escuta eventos de interação (apenas com operador logado) --
  useEffect(() => {
    if (!operator) return
    const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll'] as const
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }))
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity))
    }
  }, [operator, handleActivity])

  // -- Verificação periódica de inatividade --
  useEffect(() => {
    if (!operator) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(async () => {
      const elapsed = Date.now() - lastActivity
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        console.warn(`[TSEA] ⏱ Timeout de inatividade (${Math.round(elapsed / 1000)}s). Encerrando sessão.`)

        // Registra o timeout no audit_log antes de sair
        await insertAuditLog({
          factory_user_id: operator.uid,
          action: 'session_timeout',
          metadata: {
            elapsed_seconds: Math.round(elapsed / 1000),
            badge_uid: operator.badge,
          },
        })

        // Chama logout() do store → internamente chama authService.signOut()
        await logout()
      }
    }, CHECK_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [operator, lastActivity, logout])
}
