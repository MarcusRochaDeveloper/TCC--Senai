import { useAuthStore } from '../stores/authStore'

// ─── SVG Icons ────────────────────────────────────────────
function IconError() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="var(--color-status-offline)" strokeWidth="1.5" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="var(--color-status-offline)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconSuccess() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="var(--color-status-online)" strokeWidth="1.5" />
      <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="var(--color-status-online)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconKeyboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1.5" y="4.5" width="15" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3.5" y="7" width="2" height="1.5" rx="0.4" fill="currentColor" opacity="0.6" />
      <rect x="7" y="7" width="2" height="1.5" rx="0.4" fill="currentColor" opacity="0.6" />
      <rect x="10.5" y="7" width="2" height="1.5" rx="0.4" fill="currentColor" opacity="0.6" />
      <rect x="14" y="7" width="0.5" height="1.5" rx="0.4" fill="currentColor" opacity="0.6" />
      <rect x="5.5" y="10" width="7" height="1.5" rx="0.4" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

// ─── Buffer Display ───────────────────────────────────────
// Exibe os caracteres digitados como pontos mascarados
function RfidBufferDisplay({ buffer, isAuth }: { buffer: string; isAuth: boolean }) {
  const len = buffer.length
  const isTyping = len > 0 && !isAuth

  return (
    <div
      className={`rfid-buffer-display ${isTyping ? 'rfid-buffer-typing' : ''}`}
      aria-label="Código RFID sendo digitado"
    >
      {/* Dots: um por caractere digitado, máx 12 */}
      <div className="rfid-buffer-dots">
        {Array.from({ length: Math.min(len, 12) }, (_, i) => (
          <span
            key={i}
            className={`rfid-dot ${i === len - 1 && isTyping ? 'rfid-dot-new' : ''}`}
          />
        ))}
        {len === 0 && !isAuth && (
          // Cursor piscante quando vazio
          <span className="rfid-cursor" />
        )}
      </div>

      {/* Contador de caracteres */}
      {isTyping && (
        <span className="rfid-char-count">
          {len} caractere{len !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────
export default function LockScreen() {
  const authenticating = useAuthStore((s) => s.authenticating)
  const authError = useAuthStore((s) => s.authError)
  const rfidBuffer = useAuthStore((s) => s.rfidBuffer)
  const flashFeedback = useAuthStore((s) => s.flashFeedback)

  const isTyping = rfidBuffer.length > 0 && !authenticating

  // Estado visual do card principal
  let cardState = ''
  if (authenticating) cardState = 'state-authenticating'
  else if (flashFeedback === 'error' || authError) cardState = 'state-error'
  else if (flashFeedback === 'success') cardState = 'state-success'
  else if (isTyping) cardState = 'state-typing'

  return (
    <div id="lock-screen" className="lock-screen">
      <div className="lock-bg" />

      <div className="lock-content">
        {/* TSEA Logo */}
        <div className="lock-logo">
          <div className="lock-logo-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="40" height="40" rx="8" stroke="var(--color-accent-blue)" strokeWidth="2.5" />
              <path d="M14 16h20M14 24h14M14 32h17" stroke="var(--color-accent-blue)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="38" cy="32" r="5" fill="var(--color-accent-blue)" opacity="0.4" />
            </svg>
          </div>
          <h1 className="lock-title">TSEA Digital Factory</h1>
          <p className="lock-subtitle">Painel de Chão de Fábrica</p>
        </div>

        {/* Card de autenticação */}
        <div className={`lock-auth-card ${cardState}`}>
          {authenticating ? (
            /* ── Estado: Autenticando ── */
            <div className="lock-auth-state">
              <div className="lock-spinner">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <circle cx="20" cy="20" r="16" stroke="var(--color-border-subtle)" strokeWidth="3" />
                  <path d="M20 4a16 16 0 0116 16" stroke="var(--color-accent-blue)" strokeWidth="3" strokeLinecap="round" className="spin-arc" />
                </svg>
              </div>
              <span className="lock-auth-label">Verificando crachá...</span>
            </div>

          ) : flashFeedback === 'success' ? (
            /* ── Estado: Sucesso ── */
            <div className="lock-auth-state">
              <div className="lock-icon-success">
                <IconSuccess />
              </div>
              <span className="lock-auth-label lock-auth-success">Acesso autorizado</span>
            </div>

          ) : (
            /* ── Estado: Aguardando / Digitando / Erro ── */
            <>
              {/* Ícone do crachá NFC */}
              <div className={`lock-rfid-icon ${isTyping ? 'lock-rfid-active' : ''}`}>
                <svg width="56" height="56" viewBox="0 0 72 72" fill="none" aria-hidden="true">
                  <rect x="16" y="20" width="40" height="28" rx="4" stroke="var(--color-accent-blue)" strokeWidth="2" />
                  <rect x="22" y="26" width="12" height="10" rx="2" fill="var(--color-accent-blue)" opacity="0.2" stroke="var(--color-accent-blue)" strokeWidth="1" />
                  <path d="M38 28h12M38 32h8M38 36h10" stroke="var(--color-text-muted)" strokeWidth="1" strokeLinecap="round" />
                  <path d="M52 16c4 4 4 12 0 16" stroke="var(--color-accent-blue)" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" className="nfc-wave nfc-wave-1" />
                  <path d="M56 12c6 6 6 20 0 26" stroke="var(--color-accent-blue)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" className="nfc-wave nfc-wave-2" />
                  <path d="M60 8c8 8 8 28 0 36" stroke="var(--color-accent-blue)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" className="nfc-wave nfc-wave-3" />
                </svg>
              </div>

              {/* Buffer visual de digitação */}
              <RfidBufferDisplay buffer={rfidBuffer} isAuth={authenticating} />

              {/* Label contextual */}
              <span className="lock-badge-text">
                {isTyping ? 'Confirme com Enter' : 'Aproxime o crachá do leitor'}
              </span>

              {/* Hints */}
              {!isTyping && (
                <span className="lock-badge-hint">
                  O leitor RFID detectará seu crachá automaticamente
                </span>
              )}
              {isTyping && (
                <span className="lock-badge-hint-type">
                  <IconKeyboard />
                  Pressione Enter para autenticar
                </span>
              )}

              {/* Mensagem de erro */}
              {authError && (
                <div className="lock-error" role="alert">
                  <IconError />
                  <span>{authError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Operadores cadastrados */}
        <div className="lock-demo-info">
          <span className="lock-demo-title">Operadores Cadastrados:</span>
          <div className="lock-demo-uids">
            <code>A3F2B1C0</code> Carlos Alvarenga (Operador — Montagem)
            <code>FF01A2B3</code> Mariana Couto (Inspetora — Bobinagem)
            <code>CC9944DD</code> José Ferreira (Engenheiro — Testes)
          </div>
          <span className="lock-demo-hint">
            Aproxime o crachá RFID ou digite o UID e pressione Enter
          </span>
        </div>
      </div>
    </div>
  )
}
