import { useAuthStore } from '../stores/authStore'

interface HeaderProps {
  opTitle?: string
  opNumber?: string
  onOpenQrScanner?: () => void
  onOpenOpSelector?: () => void
  onToggleAdmin?: () => void
  isAdminView?: boolean
}

export default function Header({
  opTitle = 'Transformador 500MVA',
  opNumber = '9982',
  onOpenQrScanner,
  onOpenOpSelector,
  onToggleAdmin,
  isAdminView = false,
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
            {onOpenOpSelector && (
              <button
                className="industrial-btn btn-secondary"
                onClick={onOpenOpSelector}
                title="Selecionar Ordem de Produção"
                style={{ marginRight: 8 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginRight: 4, display: 'inline' }}>
                  <rect x="2" y="3" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="2" y="8" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
                  <rect x="2" y="13" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
                </svg>
                OPs
              </button>
            )}
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
            
            {(operator.role === 'engenheiro' || operator.role === 'supervisor') && onToggleAdmin && (
              <button
                className={`industrial-btn btn-secondary ${isAdminView ? 'op-filter-active' : ''}`}
                onClick={onToggleAdmin}
                title="Painel de Administração"
                style={{ marginRight: 16 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginRight: 6, display: 'inline' }}>
                  <path d="M8.5 2 L10 5 L13 5.5 L11 8 L11.5 11 L9 10 L6.5 11 L7 8 L5 5.5 L8 5 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  <circle cx="9" cy="8" r="1.5" stroke="currentColor" strokeWidth="1" />
                </svg>
                {isAdminView ? 'Dashboard' : 'Admin'}
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
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
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
