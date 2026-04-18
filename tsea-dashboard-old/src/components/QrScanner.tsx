import { useRef, useState, useCallback, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { sanitizeQrPayload, parseGS1, type GS1ParsedData } from '../utils/sanitize'

interface QrScannerProps {
  /** Called when a valid QR/barcode is decoded */
  onScan?: (data: GS1ParsedData) => void
  /** Called when a QR code yields a string OP */
  onScanSuccess?: (decodedOp: string) => void
  /** Show/hide the scanner */
  open: boolean
  /** Close the scanner */
  onClose: () => void
}

export default function QrScanner({ onScan, onScanSuccess, open, onClose }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<GS1ParsedData | null>(null)

  const startScanner = useCallback(async () => {
    if (!containerRef.current || scanning) return

    setError(null)
    setLastResult(null)

    try {
      const scanner = new Html5Qrcode('qr-reader-container')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' }, // Rear camera (Req. §4)
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Sanitize input (Req. §6: XSS prevention)
          const sanitized = sanitizeQrPayload(decodedText)
          if (!sanitized) {
            setError('QR Code contém conteúdo inválido ou potencialmente malicioso.')
            return
          }

          // Parse GS1 Application Identifiers
          const parsed = parseGS1(sanitized)
          setLastResult(parsed)
          onScan?.(parsed)
          
          if (onScanSuccess) {
            onScanSuccess(parsed.opNumber || parsed.raw)
          }

          // Stop scanning after successful read
          scanner.stop().catch(() => {})
          setScanning(false)
        },
        () => {
          // Scan failure (no QR detected in frame) — expected, no action needed
        },
      )

      setScanning(true)
    } catch (err) {
      console.error('[TSEA QR] Scanner error:', err)
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
      setScanning(false)
    }
  }, [scanning, onScan])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
      } catch {
        /* scanner may already be stopped */
      }
      scannerRef.current = null
    }
    setScanning(false)
  }, [])

  // Auto-start when opened
  useEffect(() => {
    if (open) {
      // Small delay to let DOM mount
      const timer = setTimeout(startScanner, 300)
      return () => clearTimeout(timer)
    } else {
      stopScanner()
    }
  }, [open, startScanner, stopScanner])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  if (!open) return null

  return (
    <div className="qr-overlay" role="dialog" aria-modal="true" aria-label="Leitor QR Code">
      <div className="qr-panel">
        {/* Header */}
        <div className="qr-header">
          <h2 className="qr-title">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="12" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="2" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <rect x="14" y="14" width="2" height="2" fill="currentColor" />
              <rect x="12" y="12" width="2" height="2" fill="currentColor" opacity="0.5" />
            </svg>
            Leitor de QR Code / Código de Barras
          </h2>
          <button
            id="qr-close-btn"
            className="industrial-btn btn-secondary"
            onClick={() => {
              stopScanner()
              onClose()
            }}
          >
            ✕ Fechar
          </button>
        </div>

        {/* Camera view */}
        <div className="qr-camera-area">
          <div id="qr-reader-container" ref={containerRef} className="qr-reader" />
          {!scanning && !error && !lastResult && (
            <div className="qr-placeholder">
              <div className="pdf-spinner" />
              <span>Inicializando câmera...</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="qr-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="var(--color-status-offline)" strokeWidth="1.5" />
              <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="var(--color-status-offline)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* Result */}
        {lastResult && (
          <div className="qr-result">
            <h3 className="qr-result-title">✅ Código Detectado</h3>
            <div className="qr-result-fields">
              {lastResult.gtin && (
                <div className="qr-field"><span className="qr-field-label">Part Number:</span> <code>{lastResult.gtin}</code></div>
              )}
              {lastResult.opNumber && (
                <div className="qr-field"><span className="qr-field-label">OP:</span> <code>{lastResult.opNumber}</code></div>
              )}
              {lastResult.serial && (
                <div className="qr-field"><span className="qr-field-label">Serial:</span> <code>{lastResult.serial}</code></div>
              )}
              {lastResult.batch && (
                <div className="qr-field"><span className="qr-field-label">Lote:</span> <code>{lastResult.batch}</code></div>
              )}
              <div className="qr-field qr-field-raw"><span className="qr-field-label">Raw:</span> <code>{lastResult.raw}</code></div>
            </div>
            <button
              id="qr-scan-again-btn"
              className="industrial-btn btn-primary"
              onClick={startScanner}
            >
              ↻ Escanear Novamente
            </button>
          </div>
        )}

        <div className="qr-footer">
          <span>Aponte a câmera para o QR Code ou código de barras GS1 da peça</span>
        </div>
      </div>
    </div>
  )
}
