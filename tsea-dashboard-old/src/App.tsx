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
  const [currentOpNumber, setCurrentOpNumber] = useState<string>('OP-2025-9982')

  const { data: activeOrder, isLoading, error } = useQuery({
    queryKey: ['productionOrder', currentOpNumber],
    queryFn: () => getProductionOrder(currentOpNumber),
    enabled: isAuthEnabled && !!currentOpNumber,
  })

  // Provide initial states to avoid crash when loading
  const pdfSource = activeOrder?.pdfUrl || null
  const opTitleText = activeOrder?.title || 'Nenhuma OP Carregada'

  // Handling time display safely
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000)
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
          />

          <QrScanner 
            open={showQr} 
            onClose={() => setShowQr(false)} 
            onScanSuccess={(decodedOp) => {
               setCurrentOpNumber(decodedOp)
               setShowQr(false)
            }}
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
                {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

export default App
