/**
 * Input Sanitization Utilities (Req. §6)
 *
 * All payloads from QR Codes must be sanitized to prevent
 * Cross-Site Scripting (XSS) attacks.
 */

/** Characters that could be used in XSS payloads */
const DANGEROUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,    // onclick=, onerror=, etc.
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /data:text\/html/i,
  /vbscript:/i,
]

/**
 * Sanitize a QR Code payload string.
 * Strips HTML tags, checks for XSS patterns, and validates format.
 *
 * @returns Sanitized string or null if the input is malicious.
 */
export function sanitizeQrPayload(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null

  // Trim whitespace and control characters
  let sanitized = raw.trim().replace(/[\x00-\x1F\x7F]/g, '')

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.error(`[TSEA QR] ⚠ XSS attempt detected in QR payload: "${raw.substring(0, 50)}"`)
      return null
    }
  }

  // Strip any HTML tags (defense in depth)
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Limit length (GS1 codes are typically < 256 chars)
  if (sanitized.length > 512) {
    console.warn('[TSEA QR] Payload exceeds 512 characters, truncating.')
    sanitized = sanitized.substring(0, 512)
  }

  return sanitized
}

/**
 * Parse a GS1 Application Identifier from a barcode payload.
 * Common AIs used in manufacturing:
 * - (01) GTIN (Part Number)
 * - (10) Batch/Lot Number
 * - (21) Serial Number
 * - (240) Additional Product ID (OP Number)
 */
export interface GS1ParsedData {
  gtin?: string       // (01) Part Number
  batch?: string      // (10) Batch/Lot
  serial?: string     // (21) Serial Number
  opNumber?: string   // (240) OP Number or custom field
  raw: string
}

const GS1_AI_PATTERNS: { ai: string; key: keyof Omit<GS1ParsedData, 'raw'>; length?: number }[] = [
  { ai: '01', key: 'gtin', length: 14 },
  { ai: '10', key: 'batch' },
  { ai: '21', key: 'serial' },
  { ai: '240', key: 'opNumber' },
]

export function parseGS1(payload: string): GS1ParsedData {
  const result: GS1ParsedData = { raw: payload }

  // GS1 uses ASCII Group Separator (GS, 0x1D) or FNC1 as delimiter
  // After sanitization, GS chars are removed so we try regex matching
  let remaining = payload

  for (const { ai, key, length } of GS1_AI_PATTERNS) {
    const regex = length
      ? new RegExp(`\\(?${ai}\\)?([\\d]{${length}})`)
      : new RegExp(`\\(?${ai}\\)?(\\S+?)(?:\\(|$)`)

    const match = remaining.match(regex)
    if (match) {
      result[key] = match[1]
      remaining = remaining.replace(match[0], '')
    }
  }

  return result
}
