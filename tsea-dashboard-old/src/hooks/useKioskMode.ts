import { useCallback, useEffect, useRef } from 'react'

/**
 * Kiosk Mode Hook (Req. §5)
 *
 * Requests the native Fullscreen API after the first user touch
 * to suppress the browser's OS navigation bar.
 *
 * Also configures behaviors needed for industrial kiosk operation:
 * - Prevents right-click context menu
 * - Prevents text selection on non-input elements
 * - Prevents default drag behavior
 */
export function useKioskMode() {
  const hasRequestedFullscreen = useRef(false)

  const requestFullscreen = useCallback(async () => {
    if (hasRequestedFullscreen.current) return
    if (document.fullscreenElement) return

    try {
      await document.documentElement.requestFullscreen()
      hasRequestedFullscreen.current = true
      console.log('[TSEA Kiosk] Fullscreen mode activated')
    } catch (err) {
      // Fullscreen may be blocked by browser policy — non-critical
      console.warn('[TSEA Kiosk] Fullscreen request denied:', err)
    }
  }, [])

  useEffect(() => {
    // Request fullscreen on first user touch (Req. §5)
    const handleFirstTouch = () => {
      requestFullscreen()
      // Remove listener after first activation
      window.removeEventListener('pointerdown', handleFirstTouch)
    }

    window.addEventListener('pointerdown', handleFirstTouch, { once: true })

    // Prevent right-click context menu in kiosk mode
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    // Prevent text selection drag in kiosk mode
    const preventDrag = (e: DragEvent) => {
      e.preventDefault()
    }

    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('dragstart', preventDrag)

    return () => {
      window.removeEventListener('pointerdown', handleFirstTouch)
      document.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('dragstart', preventDrag)
    }
  }, [requestFullscreen])
}
