/**
 * CLIENT-SIDE SECURITY UTILITIES
 * 
 * DOGMA 1: Security First - Client-side data protection
 * 
 * This module provides:
 * - Data masking for UI display
 * - Input sanitization
 * - Secure data handling
 */

/**
 * Mask sensitive data for display
 * DOGMA 1: Security First - Never expose full sensitive data in UI
 */
export function maskSensitiveData(
  text: string,
  showFirst: number = 4,
  showLast: number = 4,
  maskChar: string = "•"
): string {
  if (!text || text.length === 0) {
    return "";
  }

  if (text.length <= showFirst + showLast) {
    // If text is too short, mask all but first character
    return text[0] + maskChar.repeat(Math.max(0, text.length - 1));
  }

  const first = text.substring(0, showFirst);
  const last = text.substring(text.length - showLast);
  const masked = maskChar.repeat(Math.max(0, text.length - showFirst - showLast));
  
  return `${first}${masked}${last}`;
}

/**
 * Mask API key specifically (shows prefix and last 4 chars)
 * DOGMA 1: Security First - API keys are highly sensitive
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length === 0) {
    return "Não configurado";
  }

  // If already masked (contains •), return as is
  if (apiKey.includes("•") || apiKey.includes("*")) {
    return apiKey;
  }

  // Detect prefix (duffel_test_, duffel_live_, sandbox-sq0idb-, sq0idp-, etc.)
  const prefixMatch = apiKey.match(/^([a-z0-9_-]+[_-])/i);
  if (prefixMatch) {
    const prefix = prefixMatch[1];
    const remaining = apiKey.substring(prefix.length);
    if (remaining.length > 4) {
      return `${prefix}${maskSensitiveData(remaining, 0, 4)}`;
    }
  }

  // Fallback: show first 8 and last 4
  return maskSensitiveData(apiKey, 8, 4);
}

/**
 * Sanitize input to prevent XSS
 * DOGMA 1: Security First - All inputs sanitized
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Validate API key format client-side
 */
export function validateApiKeyFormat(apiKey: string, type: "duffel" | "square"): boolean {
  if (!apiKey || apiKey.trim() === "") {
    return false;
  }

  const trimmed = apiKey.trim();

  if (type === "duffel") {
    // Duffel keys: duffel_test_... or duffel_live_...
    return /^duffel_(test|live)_[a-zA-Z0-9_-]+$/.test(trimmed);
  }

  if (type === "square") {
    // Square keys: sandbox-sq0idb-... or sq0idp-... or EAAA...
    return /^(sandbox-)?sq0id[bp]-[a-zA-Z0-9_-]+$|^EAAA[a-zA-Z0-9_-]+$/.test(trimmed);
  }

  return false;
}

/**
 * Check if data appears to be masked
 */
export function isMasked(data: string): boolean {
  if (!data) return false;
  return data.includes("•") || data.includes("*") || data.includes("...");
}

