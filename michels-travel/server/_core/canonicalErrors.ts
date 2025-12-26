/**
 * CANONICAL ERROR SYSTEM (P0.6)
 * 
 * This module defines a standardized error structure for all API responses,
 * ensuring consistency across the entire application.
 * 
 * DOGMA 1: All `/api/*` endpoints return JSON ONLY
 * LAW 3.3: Canonical error schema for all API errors
 * 
 * @see CODEX_TECHNICUS.md for architectural principles
 */

/**
 * Standardized API error response structure
 */
export interface APIError {
  error: true;
  code: ErrorCode;
  message: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Error codes following HTTP status code conventions
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INVALID_INPUT = "INVALID_INPUT", // Specific to domain validation

  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR", // For upstream provider failures
  DATABASE_ERROR = "DATABASE_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE", // Generic for internal service issues
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true,
    public code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, true, ErrorCode.VALIDATION_ERROR, details);
  }
}

/**
 * Authentication error - user is not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(401, message, true, ErrorCode.AUTHENTICATION_ERROR);
  }
}

/**
 * Authorization error - user is authenticated but lacks permission
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(403, message, true, ErrorCode.AUTHORIZATION_ERROR);
  }
}

/**
 * Not found error - resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(404, message, true, ErrorCode.NOT_FOUND);
  }
}

/**
 * Conflict error - resource state conflict
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, message, true, ErrorCode.CONFLICT, details);
  }
}

/**
 * Rate limit error - too many requests
 */
export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(429, message, true, ErrorCode.RATE_LIMIT_EXCEEDED);
  }
}

/**
 * External API error - upstream provider failure
 * Use this for Duffel, Square, Amadeus, etc. failures
 */
export class ExternalAPIError extends AppError {
  constructor(
    public provider: string,
    message: string,
    public originalError?: unknown
  ) {
    super(502, `${provider}: ${message}`, true, ErrorCode.EXTERNAL_API_ERROR, originalError);
  }
}

/**
 * Database error - database operation failure
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super(500, message, true, ErrorCode.DATABASE_ERROR, details);
  }
}

/**
 * Create a canonical error response object
 * 
 * @param code - Error code from ErrorCode enum
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @param requestId - Optional request ID for correlation
 * @returns APIError object
 */
export function createCanonicalError(
  code: ErrorCode,
  message: string,
  details?: unknown,
  requestId?: string
): APIError {
  return {
    error: true,
    code,
    message,
    ...(details && { details }),
    ...(requestId && { requestId }),
  };
}

/**
 * Map HTTP status code to ErrorCode
 */
export function statusCodeToErrorCode(statusCode: number): ErrorCode {
  if (statusCode >= 400 && statusCode < 500) {
    if (statusCode === 400) return ErrorCode.BAD_REQUEST;
    if (statusCode === 401) return ErrorCode.AUTHENTICATION_ERROR;
    if (statusCode === 403) return ErrorCode.AUTHORIZATION_ERROR;
    if (statusCode === 404) return ErrorCode.NOT_FOUND;
    if (statusCode === 409) return ErrorCode.CONFLICT;
    if (statusCode === 429) return ErrorCode.RATE_LIMIT_EXCEEDED;
    return ErrorCode.VALIDATION_ERROR;
  }
  if (statusCode >= 500) {
    if (statusCode === 502 || statusCode === 503) return ErrorCode.EXTERNAL_API_ERROR;
    if (statusCode === 500) return ErrorCode.INTERNAL_SERVER_ERROR;
    return ErrorCode.SERVICE_UNAVAILABLE;
  }
  return ErrorCode.UNKNOWN_ERROR;
}

