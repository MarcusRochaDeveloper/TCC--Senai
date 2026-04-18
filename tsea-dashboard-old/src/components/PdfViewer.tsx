import { useRef, useEffect, useState, useCallback } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { usePdfDocument } from '../hooks/usePdfDocument'

// ─── Props ───
interface PdfViewerProps {
  /** URL or path to the PDF file */
  src: string | null
  /** Display title override */
  title?: string
}

// ─── Zoom presets ───
const ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0]
const DEFAULT_ZOOM_INDEX = 2 // 1.0 = 100%

export default function PdfViewer({ src, title }: PdfViewerProps) {
  const { document: pdfDoc, numPages, loading, progress, error, reload } =
    usePdfDocument(src)

  const [currentPage, setCurrentPage] = useState(1)
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const [rendering, setRendering] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<ReturnType<
    Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']
  > | null>(null)

  const scale = ZOOM_LEVELS[zoomIndex]

  // ─── Render current page to canvas ───
  const renderPage = useCallback(
    async (pageNum: number, zoom: number) => {
      if (!pdfDoc || !canvasRef.current) return

      // Cancel pending render
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {
          /* noop */
        }
        renderTaskRef.current = null
      }

      setRendering(true)

      try {
        const page = await pdfDoc.getPage(pageNum)

        // Use device pixel ratio for crisp rendering on HiDPI panels
        const dpr = window.devicePixelRatio || 1
        const viewport = page.getViewport({ scale: zoom * dpr })

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas dimensions at native resolution
        canvas.width = viewport.width
        canvas.height = viewport.height

        // Display dimensions (CSS)
        canvas.style.width = `${viewport.width / dpr}px`
        canvas.style.height = `${viewport.height / dpr}px`

        const renderContext = {
          canvas,
          canvasContext: ctx,
          viewport,
        }

        const renderTask = page.render(renderContext)
        renderTaskRef.current = renderTask

        await renderTask.promise
        setRendering(false)
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException') {
          // Expected when navigating quickly
          return
        }
        console.error('[TSEA PDF] Render error:', err)
        setRendering(false)
      }
    },
    [pdfDoc],
  )

  // Re-render when page or zoom changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage, scale)
    }
  }, [pdfDoc, currentPage, scale, renderPage])

  // Reset page when document changes
  useEffect(() => {
    setCurrentPage(1)
    setZoomIndex(DEFAULT_ZOOM_INDEX)
  }, [src])

  // ─── Navigation handlers ───
  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1))
  const goToNext = () => setCurrentPage((p) => Math.min(numPages, p + 1))
  const zoomIn = () => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))
  const zoomOut = () => setZoomIndex((i) => Math.max(0, i - 1))
  const zoomReset = () => setZoomIndex(DEFAULT_ZOOM_INDEX)

  // ─── Keyboard navigation ───
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        goToNext()
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomIn()
      } else if (e.key === '-') {
        e.preventDefault()
        zoomOut()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  // ─── Render states ───
  // No source provided
  if (!src) {
    return (
      <section id="pdf-viewer-panel" className="panel-placeholder pdf-panel animate-fade-in">
        <PanelHeader title={title} />
        <div className="placeholder-body">
          <EmptyStateIcon />
          <h2 className="placeholder-title">Nenhum Documento Selecionado</h2>
          <p className="placeholder-desc">
            Escaneie o <strong>QR Code</strong> da peça ou selecione uma OP para carregar o documento técnico.
          </p>
        </div>
        <PanelFooter page={0} total={0} />
      </section>
    )
  }

  // Loading state
  if (loading) {
    return (
      <section id="pdf-viewer-panel" className="panel-placeholder pdf-panel animate-fade-in">
        <PanelHeader title={title} />
        <div className="placeholder-body">
          <div className="pdf-loading-area">
            <div className="pdf-spinner" />
            <h2 className="placeholder-title">Carregando Documento...</h2>
            <div className="pdf-progress-bar-track">
              <div
                className="pdf-progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="pdf-progress-text">{progress}%</span>
          </div>
        </div>
        <PanelFooter page={0} total={0} />
      </section>
    )
  }

  // Error state
  if (error) {
    return (
      <section id="pdf-viewer-panel" className="panel-placeholder pdf-panel animate-fade-in">
        <PanelHeader title={title} />
        <div className="placeholder-body">
          <div className="pdf-error-area">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              className="pdf-error-icon"
            >
              <circle cx="24" cy="24" r="20" stroke="var(--color-status-offline)" strokeWidth="2" />
              <path d="M17 17l14 14M31 17l-14 14" stroke="var(--color-status-offline)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h2 className="placeholder-title pdf-error-title">Erro ao Carregar</h2>
            <p className="placeholder-desc">{error}</p>
            <button
              id="pdf-reload-btn"
              className="industrial-btn btn-primary"
              onClick={reload}
            >
              ↻ Tentar Novamente
            </button>
          </div>
        </div>
        <PanelFooter page={0} total={0} />
      </section>
    )
  }

  // ─── Main viewer ───
  return (
    <section id="pdf-viewer-panel" className="panel-placeholder pdf-panel animate-fade-in">
      <PanelHeader title={title} rendering={rendering} numPages={numPages} />

      {/* Canvas area */}
      <div className="pdf-canvas-container" ref={containerRef}>
        <canvas ref={canvasRef} className="pdf-canvas" />
        {rendering && <div className="pdf-render-overlay"><div className="pdf-spinner pdf-spinner-sm" /></div>}
      </div>

      {/* Toolbar — navigation + zoom */}
      <div className="panel-footer pdf-toolbar">
        <div className="pdf-nav-group">
          <button
            id="pdf-prev-btn"
            className="industrial-btn btn-secondary"
            onClick={goToPrev}
            disabled={currentPage <= 1}
            title="Página Anterior (←)"
          >
            ◀ Anterior
          </button>
          <span className="page-indicator">
            Pág. <strong>{currentPage}</strong> / {numPages}
          </span>
          <button
            id="pdf-next-btn"
            className="industrial-btn btn-secondary"
            onClick={goToNext}
            disabled={currentPage >= numPages}
            title="Próxima Página (→)"
          >
            Próxima ▶
          </button>
        </div>

        <div className="pdf-zoom-group">
          <button
            id="pdf-zoom-out-btn"
            className="industrial-btn btn-secondary btn-icon"
            onClick={zoomOut}
            disabled={zoomIndex <= 0}
            title="Reduzir Zoom (−)"
          >
            −
          </button>
          <button
            id="pdf-zoom-reset-btn"
            className="industrial-btn btn-secondary btn-zoom-label"
            onClick={zoomReset}
            title="Resetar Zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            id="pdf-zoom-in-btn"
            className="industrial-btn btn-secondary btn-icon"
            onClick={zoomIn}
            disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
            title="Aumentar Zoom (+)"
          >
            +
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── Sub-components ───

function PanelHeader({
  title,
  rendering,
  numPages,
}: {
  title?: string
  rendering?: boolean
  numPages?: number
}) {
  return (
    <div className="panel-header">
      <div className="panel-header-left">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="3" y="2" width="14" height="16" rx="2" stroke="var(--color-accent-blue)" strokeWidth="1.5" />
          <path d="M7 6h6M7 9h6M7 12h4" stroke="var(--color-text-muted)" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <span className="panel-title">{title || 'Documento Técnico'}</span>
        {rendering && <span className="panel-badge badge-rendering">Renderizando…</span>}
      </div>
      <div className="panel-header-right">
        <span className="panel-badge">PDF.js</span>
        {numPages !== undefined && numPages > 0 && (
          <span className="panel-badge badge-rev">{numPages} págs</span>
        )}
      </div>
    </div>
  )
}

function PanelFooter({ page, total }: { page: number; total: number }) {
  return (
    <div className="panel-footer">
      <button className="industrial-btn btn-secondary" disabled>
        ◀ Anterior
      </button>
      <span className="page-indicator">
        {total > 0 ? `Pág. ${page} / ${total}` : 'Sem documento'}
      </span>
      <button className="industrial-btn btn-secondary" disabled>
        Próxima ▶
      </button>
    </div>
  )
}

function EmptyStateIcon() {
  return (
    <div className="placeholder-icon-area">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="placeholder-icon"
      >
        <rect x="12" y="6" width="40" height="52" rx="4" stroke="var(--color-border-default)" strokeWidth="2" />
        <rect x="12" y="6" width="40" height="12" rx="4" fill="var(--color-accent-blue)" opacity="0.1" />
        <path d="M20 14h24" stroke="var(--color-accent-blue)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 26h24M20 32h24M20 38h18M20 44h20" stroke="var(--color-border-default)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        <circle cx="44" cy="48" r="8" fill="var(--color-bg-secondary)" stroke="var(--color-accent-blue)" strokeWidth="1.5" />
        <text x="44" y="52" textAnchor="middle" fill="var(--color-accent-blue)" fontSize="8" fontWeight="600">
          PDF
        </text>
      </svg>
    </div>
  )
}
