import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from './stores/authStore'
import { useRfidReader } from './hooks/useRfidReader'
import { useInactivityTimeout } from './hooks/useInactivityTimeout'
import { useKioskMode } from './hooks/useKioskMode'
import { getProductionOrder } from './api/mes'
import Header from './components/Header'
import LockScreen from './components/LockScreen'
import FlashFeedback from './components/FlashFeedback'
import QrScanner from './components/QrScanner'
import OpSelector from './components/OpSelector'
import PdfViewer from './components/PdfViewer'
import ThreeDViewer from './components/ThreeDViewer'
import './App.css'

function App() {
  useRfidReader()
  useInactivityTimeout()
  useKioskMode()

  const operator = useAuthStore((s) => s.operator)
  const isAuthEnabled = !!operator
  const [showQr, setShowQr] = useState(false)
  const [showOpSelector, setShowOpSelector] = useState(false)
  const [currentOpNumber, setCurrentOpNumber] = useState<string>('OP-2025-9982')

  const { data: activeOrder, isLoading, error } = useQuery({
    queryKey: ['productionOrder', currentOpNumber],
    queryFn: () => getProductionOrder(currentOpNumber),
    enabled: isAuthEnabled && !!currentOpNumber,
  })

  const pdfSource = activeOrder?.pdfUrl || null
  const opTitleText = activeOrder?.title || 'Nenhuma OP Carregada'

  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div id="app-shell" className="app-shell">
      <FlashFeedback />

      {!operator ? (
        <LockScreen />
      ) : (
        <>
          <Header
            opNumber={currentOpNumber}
            opTitle={opTitleText}
            onOpenQrScanner={() => setShowQr(true)}
            onOpenOpSelector={() => setShowOpSelector(true)}
          />

          {/* Barra de metadata da OP ativa */}
          {activeOrder && (
            <div className="op-meta-bar">
              <div className="op-meta-left">
                <span className="op-meta-chip">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1" />
                    <path d="M4 4h4M4 6h3M4 8h2" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
                  </svg>
                  {activeOrder.documentTitle || 'Sem documento'}
                </span>
                {activeOrder.revision && (
                  <span className="op-meta-chip op-meta-rev">{activeOrder.revision}</span>
                )}
                <span className="op-meta-chip op-meta-status-released">Released</span>
              </div>
              <div className="op-meta-right">
                {activeOrder.mvaClass && (
                  <span className="op-meta-chip">{activeOrder.mvaClass}</span>
                )}
                {activeOrder.kvClass && (
                  <span className="op-meta-chip">{activeOrder.kvClass}</span>
                )}
                <span className="op-meta-chip">
                  {activeOrder.productType === 'power_transformer' ? 'Transformador de Potência' : 'Regulador de Tensão'}
                </span>
              </div>
            </div>
          )}

          <QrScanner
            open={showQr}
            onClose={() => setShowQr(false)}
            onScanSuccess={(decodedOp) => {
               setCurrentOpNumber(decodedOp)
               setShowQr(false)
            }}
          />

          <OpSelector
            open={showOpSelector}
            currentOp={currentOpNumber}
            onSelect={setCurrentOpNumber}
            onClose={() => setShowOpSelector(false)}
          />

          <main id="main-content" className="main-grid">
            <div className="panel-left">
              {isLoading ? (
                <div className="loading-card">Buscando documentos no MES...</div>
              ) : error ? (
                <div className="error-card">{(error as Error).message}</div>
              ) : (
                <PdfViewer
                  src={pdfSource}
                  title="Documento Técnico"
                />
              )}
            </div>

            <div className="panel-divider" aria-hidden="true">
              <div className="divider-handle" />
            </div>

            <div className="panel-right">
              <ThreeDViewer modelUrl={activeOrder?.glbUrl || null} />
            </div>
          </main>

          <footer id="status-bar" className="status-bar">
            <div className="status-left">
              <span className={`status-dot ${error ? 'status-dot-offline' : 'status-dot-online'}`} />
              <span>Conexão PDM: {error ? 'Offline' : 'Online'}</span>
            </div>
            <div className="status-center">
              <span>MES PC-Factory v2.1 — Célula: {operator.sector}</span>
            </div>
            <div className="status-right">
              <span className="status-clock" id="status-clock">
                {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

export default App
