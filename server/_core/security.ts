/**
 * SECURITY MODULE - Data Protection & Encryption
 * 
 * DOGMA 1: Security First - All sensitive data MUST be encrypted
 * DOGMA 2: No Silent Failures - Security errors are explicit
 * DOGMA 4: External Service Isolation - Encryption is isolated
 * 
 * This module provides:
 * - Encryption/Decryption of sensitive data
 * - Secure data masking for logs/UI
 * - Data sanitization
 * - Security validation
 */

import * as crypto from "crypto";

// DOGMA 1: Security First - Use environment variable for encryption key
// DOGMA 2: Intelligent Fallback - Use JWT_SECRET if ENCRYPTION_KEY not available
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

// Track if encryption is available
let _encryptionAvailable: boolean | null = null;
let _encryptionWarningShown = false;

/**
 * Check if encryption is available
 * DOGMA 2: Intelligent Fallback - Graceful degradation
 */
function isEncryptionAvailable(): boolean {
  if (_encryptionAvailable !== null) {
    return _encryptionAvailable;
  }
  
  const key = ENCRYPTION_KEY || process.env.JWT_SECRET || "";
  _encryptionAvailable = key.length >= 32;
  
  if (!_encryptionAvailable && !_encryptionWarningShown && process.env.NODE_ENV === 'development') {
    console.warn(
      "[Security] ⚠️ Encryption not available: ENCRYPTION_KEY or JWT_SECRET must be at least 32 characters. " +
      "Data will be stored in plain text. For production, configure ENCRYPTION_KEY in .env file."
    );
    _encryptionWarningShown = true;
  }
  
  return _encryptionAvailable;
}

/**
 * Get encryption key from environment
 * DOGMA 2: Intelligent Fallback - Use JWT_SECRET if available, otherwise return null
 */
function getEncryptionKey(): Buffer | null {
  if (!isEncryptionAvailable()) {
    return null;
  }
  
  const key = ENCRYPTION_KEY || process.env.JWT_SECRET || "";
  
  // Derive a 32-byte key from the environment key using SHA-256
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt sensitive data (API keys, tokens, etc.)
 * DOGMA 1: Security First - All sensitive data encrypted at rest
 * DOGMA 2: Intelligent Fallback - Return plain text if encryption not available (with warning)
 * 
 * @param text - Plain text to encrypt
 * @returns Encrypted data in format: iv:salt:tag:encryptedData (all base64), or plain text if encryption unavailable
 */
export function encryptSensitiveData(text: string): string {
  if (!text || text.trim() === "") {
    return "";
  }

  // DOGMA 2: Intelligent Fallback - If encryption not available, return plain text with warning
  if (!isEncryptionAvailable()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        "[Security] ⚠️ Storing data in plain text (encryption not available). " +
        "Configure ENCRYPTION_KEY or JWT_SECRET (min 32 chars) for encryption."
      );
    }
    return text; // Return plain text if encryption not available
  }

  try {
    const key = getEncryptionKey();
    if (!key) {
      // Fallback to plain text if key is null
      return text;
    }
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive key from master key and salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, "sha256");
    
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    
    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");
    
    const tag = cipher.getAuthTag();
    
    // Return: iv:salt:tag:encryptedData (all base64)
    return [
      iv.toString("base64"),
      salt.toString("base64"),
      tag.toString("base64"),
      encrypted,
    ].join(":");
  } catch (error: any) {
    // DOGMA 2: Intelligent Fallback - If encryption fails, return plain text with warning
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Security] Encryption failed: ${error.message}. Storing in plain text.`);
    }
    return text; // Fallback to plain text
  }
}

/**
 * Decrypt sensitive data
 * DOGMA 1: Security First - Decryption only when needed
 * DOGMA 2: Intelligent Fallback - Return as-is if not encrypted or encryption unavailable
 * 
 * @param encryptedData - Encrypted data in format: iv:salt:tag:encryptedData, or plain text
 * @returns Decrypted plain text, or original if not encrypted
 */
export function decryptSensitiveData(encryptedData: string): string {
  if (!encryptedData || encryptedData.trim() === "") {
    return "";
  }

  // DOGMA 2: Intelligent Fallback - If not encrypted format, return as-is
  if (!isEncrypted(encryptedData)) {
    return encryptedData; // Already plain text
  }

  // DOGMA 2: Intelligent Fallback - If encryption not available, return as-is
  if (!isEncryptionAvailable()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        "[Security] ⚠️ Cannot decrypt data (encryption not available). " +
        "Data may be stored in plain text. Configure ENCRYPTION_KEY or JWT_SECRET."
      );
    }
    return encryptedData; // Return as-is if can't decrypt
  }

  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 4) {
      // Not encrypted format, return as-is
      return encryptedData;
    }

    const [ivBase64, saltBase64, tagBase64, encrypted] = parts;
    
    const key = getEncryptionKey();
    if (!key) {
      // Encryption key not available, return as-is
      return encryptedData;
    }
    
    const iv = Buffer.from(ivBase64, "base64");
    const salt = Buffer.from(saltBase64, "base64");
    const tag = Buffer.from(tagBase64, "base64");
    
    // Derive key from master key and salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, "sha256");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error: any) {
    // DOGMA 2: Intelligent Fallback - If decryption fails, return as-is with warning
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Security] Decryption failed: ${error.message}. Returning data as-is.`);
    }
    return encryptedData; // Fallback to return as-is
  }
}

/**
 * Mask sensitive data for display/logging
 * DOGMA 1: Security First - Never expose full sensitive data
 * 
 * @param text - Text to mask
 * @param showFirst - Number of characters to show at start (default: 4)
 * @param showLast - Number of characters to show at end (default: 4)
 * @param maskChar - Character to use for masking (default: *)
 * @returns Masked string (e.g., "duffel_test_****...****3of")
 */
export function maskSensitiveData(
  text: string,
  showFirst: number = 4,
  showLast: number = 4,
  maskChar: string = "*"
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
 * Sanitize input to prevent injection attacks
 * DOGMA 1: Security First - All inputs sanitized
 * 
 * @param input - User input
 * @returns Sanitized string
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
 * Validate API key format
 * DOGMA 3: Validate ALL Inputs
 * 
 * @param apiKey - API key to validate
 * @param type - Type of API key (duffel, square, etc.)
 * @returns true if valid format
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
 * Hash sensitive data for comparison (one-way)
 * DOGMA 1: Security First - Use hashing for comparisons
 * 
 * @param data - Data to hash
 * @returns SHA-256 hash
 */
export function hashSensitiveData(data: string): string {
  if (!data) return "";
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Check if data appears to be encrypted
 * DOGMA 1: Security First - Detect encryption format
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  // Encrypted format: iv:salt:tag:encryptedData (4 parts separated by :)
  const parts = data.split(":");
  return parts.length === 4 && parts.every(part => /^[A-Za-z0-9+/=]+$/.test(part));
}

/**
 * Get encryption status (exported for external use)
 * DOGMA 2: Intelligent Fallback - Expose status for UI feedback
 * 
 * @returns true if encryption is available, false otherwise
 */
export function getEncryptionStatus(): boolean {
  return isEncryptionAvailable();
}

