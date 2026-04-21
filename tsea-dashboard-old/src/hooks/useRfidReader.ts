// ============================================================
// src/hooks/useRfidReader.ts
// Intercepta eventos de teclado do Keyboard Wedge (leitor RFID)
// Autentica via PBKDF2-SHA256 contra banco local
// ============================================================
import { useEffect, useRef, useCallback } from 'react'
import { signInWithBadge } from '../lib/authService'
import { useAuthStore } from '../stores/authStore'

export function useRfidReader() {
  const bufferRef = useRef('')
  const lastKeystrokeRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isProcessingRef = useRef(false)

  const { setLoading, setError, setOperatorFromBadge, setRfidBuffer, operator, logout } = useAuthStore()

  const clearBuffer = useCallback(() => {
    bufferRef.current = ''
    setRfidBuffer('')
  }, [setRfidBuffer])

  // --------------------------------------------------------
  // processBuffer — chamado quando o leitor envia Enter ou timeout
  // UID mínimo de 6 caracteres para evitar toques acidentais
  // --------------------------------------------------------
  const processBuffer = useCallback(async () => {
    const uid = bufferRef.current.trim().toUpperCase()
    clearBuffer()

    if (uid.length < 6) return
    if (isProcessingRef.current) return

    console.log(`[TSEA RFID] 📡 Crachá detectado: ${uid}`)

    // Fast User Switch: se já tem alguém logado, faz logout primeiro
    if (operator) {
      console.log('[TSEA RFID] Troca de operador detectada — efetuando logout')
      await logout()
    }

    isProcessingRef.current = true
    setLoading(true)

    try {
      // Autentica via SQLite local + PBKDF2
      const { user, error } = await signInWithBadge(uid)

      if (error || !user) {
        console.warn(`[TSEA RFID] ❌ Badge rejeitado (${uid}):`, error)
        setError(error ?? 'Crachá não reconhecido. Contate o supervisor.')
        return
      }

      // Atualiza o store com o perfil retornado
      setOperatorFromBadge(user)
      setRfidBuffer('')

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      console.error('[TSEA RFID] ❌ Erro crítico:', message)
      setRfidBuffer('')
      setError('Falha na autenticação local. Tente novamente.')
    } finally {
      isProcessingRef.current = false
    }
  }, [operator, logout, clearBuffer, setLoading, setError, setOperatorFromBadge, setRfidBuffer])

  // --------------------------------------------------------
  // Listener de teclado — detecta o stream do Keyboard Wedge
  // Heurística: intervalo <500ms entre teclas reinicia o buffer
  // --------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o usuário está digitando em um input formal
      const target = e.target as HTMLElement
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return
      }

      const now = Date.now()

      if (now - lastKeystrokeRef.current > 500) {
        clearBuffer()
      }
      lastKeystrokeRef.current = now

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        processBuffer()
        return
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key
        setRfidBuffer(bufferRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        if (bufferRef.current.length >= 6) {
          processBuffer()
        } else {
          clearBuffer()
        }
      }, 500)
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [clearBuffer, processBuffer])
}
