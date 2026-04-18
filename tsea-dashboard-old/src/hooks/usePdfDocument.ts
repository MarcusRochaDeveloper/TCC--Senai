import { useState, useEffect, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { db } from '../db/db'

// Configure worker — use the copied min file from public/
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

/** Cached PDFDocumentProxy keyed by source URL/path */
const documentCache = new Map<string, pdfjsLib.PDFDocumentProxy>()

export interface PdfDocumentState {
  /** The loaded document proxy (null while loading or on error) */
  document: pdfjsLib.PDFDocumentProxy | null
  /** Total page count */
  numPages: number
  /** True while the document is being fetched/parsed */
  loading: boolean
  /** Loading progress 0..100 */
  progress: number
  /** Human-readable error message */
  error: string | null
  /** Reload the current document (bypasses cache) */
  reload: () => void
}

/**
 * React hook for loading a PDF document with pdfjs-dist.
 * Features: progress tracking, error handling, caching, reload capability.
 */
export function usePdfDocument(source: string | null): PdfDocumentState {
  const [document, setDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const loadingTaskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null)
  const cacheKeyRef = useRef<string | null>(null)

  const loadDocument = useCallback(
    (bypassCache = false) => {
      if (!source) {
        setDocument(null)
        setNumPages(0)
        setLoading(false)
        setProgress(0)
        setError(null)
        return
      }

      const run = async () => {
        // Clear old in-flight
        if (loadingTaskRef.current) {
          loadingTaskRef.current.destroy()
          loadingTaskRef.current = null
        }

        setLoading(true)
        setProgress(0)
        setError(null)
        setDocument(null)
        setNumPages(0)
        cacheKeyRef.current = source

        try {
          let bufferToLoad: Uint8Array | null = null

          // Se a URL contém query params (Signed URL), geramos uma chave estável (só o path)
          // Isso garante cache hit mesmo quando o token expira
          let cacheKey = source
          try {
            const u = new URL(source, window.location.origin)
            cacheKey = u.pathname
          } catch {
            /* ignore invalid urls */
          }

          if (!bypassCache) {
            // Check IndexedDB
            const cachedAsset = await db.cachedAssets
              .where({ opNumber: cacheKey, assetType: 'pdf' })
              .first()

            if (cachedAsset) {
              const arrayBuffer = await cachedAsset.data.arrayBuffer()
              bufferToLoad = new Uint8Array(arrayBuffer)
              setProgress(100)
              console.log('[TSEA Dexie] 🌩️ Cache hit para offline-first:', cacheKey)
            }
          }

          // If not in DB or bypassCache requested, fetch via network
          if (!bufferToLoad) {
            setProgress(10)
            const response = await fetch(source)
            if (!response.ok) throw new Error(`HTTP error ${response.status}`)
            
            const blob = await response.blob()
            setProgress(60)
            
            // Save to DB (Background)
            db.cachedAssets.put({
              opNumber: cacheKey, // Chave estável sem os tokens de tempo
              assetType: 'pdf',
              fileName: cacheKey.split('/').pop() || 'document.pdf',
              data: blob,
              timestamp: Date.now()
            }).catch((e: Error) => console.error('[TSEA PDF] Failed to cache PDF in DB', e))

            const arrayBuffer = await blob.arrayBuffer()
            bufferToLoad = new Uint8Array(arrayBuffer)
            setProgress(100)
            console.log('[TSEA Dexie] ☁️ PDF baixado da nuvem e salvo no cache offline.')
          }

          const loadingTask = pdfjsLib.getDocument({
            data: bufferToLoad,
            cMapUrl: '/cmaps/',
            cMapPacked: true,
          })

          loadingTaskRef.current = loadingTask

          const pdfDoc = await loadingTask.promise
          documentCache.set(source, pdfDoc)
          setDocument(pdfDoc)
          setNumPages(pdfDoc.numPages)
          setLoading(false)

        } catch (err: any) {
          if (err?.name === 'AbortException') return
          if (err?.message?.includes('Worker was destroyed')) return

          console.error('[TSEA PDF] Load error:', err)
          let message = 'Falha ao carregar o documento PDF.'
          if (err?.message?.includes('Missing PDF')) {
            message = 'Arquivo PDF não encontrado no caminho especificado.'
          } else if (err?.message?.includes('Invalid PDF')) {
            message = 'O arquivo não é um PDF válido.'
          } else if (err?.message?.includes('password')) {
            message = 'O PDF está protegido por senha.'
          }
          setError(message)
          setLoading(false)
        }
      }

      run()
    },
    [source],
  )

  useEffect(() => {
    loadDocument(false)

    return () => {
      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy()
        loadingTaskRef.current = null
      }
    }
  }, [loadDocument])

  const reload = useCallback(() => {
    if (source) {
      documentCache.delete(source)
    }
    loadDocument(true)
  }, [source, loadDocument])

  return { document, numPages, loading, progress, error, reload }
}
