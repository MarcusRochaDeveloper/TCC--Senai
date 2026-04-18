import { useAuthStore } from '../stores/authStore'

interface HeaderProps {
  opTitle?: string
  opNumber?: string
  onOpenQrScanner?: () => void
}

export default function Header({
  opTitle = 'Transformador 500MVA',
  opNumber = '9982',
  onOpenQrScanner,
}: HeaderProps) {
  const operator = useAuthStore((s) => s.operator)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => { void logout() }

  const roleLabels: Record<string, string> = {
    operador: 'Operador',
    inspetor: 'Inspetor QC',
    engenheiro: 'Engenheiro',
    supervisor: 'Supervisor',
  }

  return (
    <header id="industrial-header" className="header-bar">
      {/* Left: TSEA branding */}
      <div className="header-brand">
        <div className="brand-icon">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="2"
              y="2"
              width="24"
              height="24"
              rx="4"
              stroke="var(--color-accent-blue)"
              strokeWidth="2"
            />
            <path
              d="M8 10h12M8 14h8M8 18h10"
              stroke="var(--color-accent-blue)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="22" cy="18" r="3" fill="var(--color-accent-blue)" opacity="0.6" />
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-name">TSEA</span>
          <span className="brand-subtitle">Digital Factory</span>
        </div>
      </div>

      {/* Center: OP Info */}
      <div className="header-op-info">
        <div className="op-badge">
          <span className="op-label">OP:</span>
          <span className="op-number">{opNumber}</span>
        </div>
        <div className="op-divider" />
        <h1 className="op-title">{opTitle}</h1>
      </div>

      {/* Right: Operator info + logout */}
      <div className="header-rfid-area">
        {operator ? (
          <>
            {onOpenQrScanner && (
              <button
                className="industrial-btn btn-secondary"
                onClick={onOpenQrScanner}
                title="Escanear QR Code/Código de Barras"
                style={{ marginRight: 16 }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: 6, display: 'inline' }}>
                  <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="13" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="2" y="13" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="13" y="13" width="5" height="5" fill="currentColor" opacity="0.6" />
                </svg>
                Scanner
              </button>
            )}
            <div className="rfid-status rfid-online">
              <span className="rfid-dot" />
              <div className="operator-info">
                <span className="operator-name">{operator.name}</span>
                <span className="operator-role">
                  {roleLabels[operator.role] || operator.role} — {operator.sector}
                </span>
              </div>
            </div>
            <button
              id="rfid-logout-btn"
              className="rfid-test-btn"
              onClick={handleLogout}
              title="Encerrar sessão (ou aproxime outro crachá)"
            >
              🔒
              <span className="rfid-test-label">Sair</span>
            </button>
          </>
        ) : (
          <div className="rfid-status rfid-offline">
            <span className="rfid-dot status-blink" />
            <span className="rfid-text">Aguardando Crachá...</span>
          </div>
        )}
      </div>
    </header>
  )
}
