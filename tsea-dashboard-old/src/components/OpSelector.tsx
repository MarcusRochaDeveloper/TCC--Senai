import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listSectorOrders, type OrderSummary } from '../api/mes'
import { useAuthStore } from '../stores/authStore'

interface OpSelectorProps {
  open: boolean
  currentOp: string
  onSelect: (opNumber: string) => void
  onClose: () => void
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconDoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="var(--color-status-online)" strokeWidth="1.2" />
      <path d="M5.5 5h5M5.5 7.5h5M5.5 10h3" stroke="var(--color-status-online)" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  )
}

function IconNoDoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="var(--color-text-muted)" strokeWidth="1.2" opacity="0.5" />
      <path d="M5 5l6 6" stroke="var(--color-text-muted)" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function IconTransformer() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="7" cy="10" r="2.5" stroke="currentColor" strokeWidth="1" />
      <circle cx="13" cy="10" r="2.5" stroke="currentColor" strokeWidth="1" />
      <path d="M9.5 10h1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  in_progress: { label: 'Em Produção', color: 'var(--color-status-online)' },
  on_hold:     { label: 'Em Espera',   color: 'var(--color-accent-amber)' },
  completed:   { label: 'Concluída',   color: 'var(--color-text-muted)' },
  cancelled:   { label: 'Cancelada',   color: 'var(--color-status-offline)' },
}

export default function OpSelector({ open, currentOp, onSelect, onClose }: OpSelectorProps) {
  const operator = useAuthStore((s) => s.operator)
  const [showAll, setShowAll] = useState(false)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['sectorOrders', showAll ? 'all' : operator?.sector],
    queryFn: () => listSectorOrders(showAll ? undefined : operator?.sector ?? undefined),
    enabled: open,
  })

  if (!open) return null

  return (
    <>
      <div className="op-selector-backdrop" onClick={onClose} />

      <aside className="op-selector-drawer" role="dialog" aria-label="Selecionar Ordem de Produção">
        <div className="op-selector-header">
          <div className="op-selector-title-row">
            <IconTransformer />
            <h2 className="op-selector-title">Ordens de Produção</h2>
          </div>
          <button className="op-selector-close" onClick={onClose} title="Fechar" aria-label="Fechar">
            <IconClose />
          </button>
        </div>

        <div className="op-selector-filter">
          <button
            className={`op-filter-btn ${!showAll ? 'op-filter-active' : ''}`}
            onClick={() => setShowAll(false)}
          >
            Meu Setor
          </button>
          <button
            className={`op-filter-btn ${showAll ? 'op-filter-active' : ''}`}
            onClick={() => setShowAll(true)}
          >
            Todas
          </button>
          {operator && !showAll && (
            <span className="op-filter-sector">{operator.sector}</span>
          )}
        </div>

        <div className="op-selector-list">
          {isLoading ? (
            <div className="op-selector-loading">
              <div className="pdf-spinner pdf-spinner-sm" />
              <span>Carregando OPs...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="op-selector-empty">
              Nenhuma OP encontrada para este setor.
            </div>
          ) : (
            orders.map((op: OrderSummary) => {
              const isActive = op.op_number === currentOp
              const st = STATUS_LABELS[op.status] ?? STATUS_LABELS.in_progress

              return (
                <button
                  key={op.id}
                  className={`op-card ${isActive ? 'op-card-active' : ''}`}
                  onClick={() => {
                    onSelect(op.op_number)
                    onClose()
                  }}
                >
                  <div className="op-card-top">
                    <span className="op-card-number">{op.op_number}</span>
                    <span className="op-card-status" style={{ color: st.color, borderColor: st.color }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="op-card-title">{op.product_title}</div>
                  <div className="op-card-meta">
                    {op.mva_class && <span className="op-card-tag">{op.mva_class}</span>}
                    {op.kv_class && <span className="op-card-tag">{op.kv_class}</span>}
                    <span className="op-card-tag op-card-sector">{op.sector}</span>
                    <span className="op-card-doc-status" title={op.hasDocument ? 'Documento Released disponível' : 'Sem documento'}>
                      {op.hasDocument ? <IconDoc /> : <IconNoDoc />}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>
    </>
  )
}
