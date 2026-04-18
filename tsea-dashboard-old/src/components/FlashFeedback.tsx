import { useAuthStore } from '../stores/authStore'

/**
 * FlashFeedback (Req. §2)
 *
 * Full-screen visual feedback on RFID login success/error.
 * Renders as a border flash overlay covering the entire viewport.
 * Uses CSS-only transitions (no JS animations).
 */
export default function FlashFeedback() {
  const flashFeedback = useAuthStore((s) => s.flashFeedback)

  if (!flashFeedback) return null

  return (
    <div
      id="flash-feedback"
      className={`flash-overlay flash-${flashFeedback}`}
      aria-hidden="true"
    />
  )
}
