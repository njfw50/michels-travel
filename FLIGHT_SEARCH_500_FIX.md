# Flight Search 500 Error - Canonical Fix

## Root Cause Analysis

### Problem
The `flights.search` tRPC procedure was returning HTTP 500 (Internal Server Error) with the message "Unable to search flights at this time" for various failure scenarios that should have been categorized differently.

### Root Causes Identified

1. **Missing Environment Variable Validation at Procedure Entry**
   - `DUFFEL_API_KEY` was checked inside `searchFlights()`, but errors were generic
   - No canonical guard at the procedure level to fail fast with BAD_REQUEST

2. **Uncategorized External API Errors**
   - HTTP 401/403 (authentication) → treated as INTERNAL_SERVER_ERROR
   - HTTP 429 (rate limit) → treated as INTERNAL_SERVER_ERROR
   - HTTP 400/422 (bad request) → treated as INTERNAL_SERVER_ERROR
   - Network errors (ECONNREFUSED, ETIMEDOUT) → treated as INTERNAL_SERVER_ERROR

3. **Missing Response Shape Validation**
   - Code assumed `response.data` exists and is an array
   - Accessing `offer.slices[0]` without validation caused runtime exceptions
   - No null checks for nested properties

4. **Insufficient Error Context Preservation**
   - Errors from `duffel.ts` lost HTTP status codes and error details
   - Router couldn't categorize errors properly

5. **Unsafe Response Mapping**
   - Direct access to nested properties without null checks
   - No filtering of malformed offers

## Canonical Fix Implementation

### Files Changed

1. **`server/routers.ts`** - `flights.search` procedure
2. **`server/duffel.ts`** - `searchFlights` function

### Changes Applied

#### 1. Canonical Guard at Procedure Entry (`routers.ts`)

```typescript
// CANONICAL GUARD 1: Validate environment variable at procedure entry
const duffelApiKey = process.env.DUFFEL_API_KEY;
if (!duffelApiKey || duffelApiKey.trim() === "") {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Flight search service is not configured. Please set DUFFEL_API_KEY in your .env file.",
  });
}
```

**Why Canonical:**
- DOGMA 2: No silent failures - explicit validation at entry point
- Fails fast with correct error code (BAD_REQUEST, not INTERNAL_SERVER_ERROR)
- Actionable error message

#### 2. Response Shape Validation (`routers.ts`)

```typescript
// CANONICAL GUARD 4: Validate response shape before processing
if (!response || typeof response !== "object") {
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Invalid response from flight search service. Please try again later.",
  });
}

if (!Array.isArray(response.data)) {
  console.error("[Flight Search] Invalid response shape:", {
    hasData: !!response.data,
    dataType: typeof response.data,
    responseKeys: response ? Object.keys(response) : [],
  });
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Flight search service returned invalid data format. Please try again later.",
  });
}
```

**Why Canonical:**
- Prevents runtime exceptions from undefined access
- Validates contract before processing
- Structured logging for diagnostics

#### 3. Error Categorization by Root Cause (`routers.ts`)

```typescript
// Categorize error by HTTP status code or error type
if (error.response?.status === 401 || error.response?.status === 403) {
  throw new TRPCError({
    code: "UNAUTHORIZED",
    message: "Flight search service authentication failed. Please check DUFFEL_API_KEY configuration.",
  });
}

if (error.response?.status === 429) {
  throw new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message: "Flight search service rate limit exceeded. Please try again in a moment.",
  });
}

if (error.response?.status === 400 || error.response?.status === 422) {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: errorDetail,
  });
}
```

**Why Canonical:**
- Proper HTTP status code mapping to tRPC error codes
- User-friendly, actionable error messages
- Follows RESTful error handling principles

#### 4. Safe Response Mapping with Null Checks (`routers.ts`)

```typescript
const flights = response.data.map((offer) => {
  // Validate offer structure
  if (!offer || !offer.slices || !Array.isArray(offer.slices) || offer.slices.length === 0) {
    console.warn("[Flight Search] Skipping malformed offer:", {
      offerId: offer?.id,
      hasSlices: !!offer?.slices,
      slicesType: typeof offer?.slices,
    });
    return null;
  }
  // ... safe property access with null coalescing
}).filter((flight): flight is NonNullable<typeof flight> => flight !== null);
```

**Why Canonical:**
- Prevents runtime exceptions from undefined access
- Gracefully handles malformed data
- Filters out invalid offers instead of crashing

#### 5. Structured Logging (`routers.ts` & `duffel.ts`)

```typescript
const errorDetails = {
  errorType: error.constructor?.name || "Unknown",
  message: error.message || "Unknown error",
  statusCode: error.response?.status || error.statusCode,
  hasResponse: !!error.response,
  responseKeys: error.response?.data ? Object.keys(error.response.data) : [],
};

console.error("[Flight Search] Error occurred:", errorDetails);
```

**Why Canonical:**
- DOGMA 2: No silent failures - all errors logged
- Safe diagnostics (no secrets in logs)
- Actionable information for debugging

#### 6. Error Context Preservation (`duffel.ts`)

```typescript
const enhancedError = new Error(...) as Error & { response?: any; statusCode?: number; code?: string };
enhancedError.response = error.response;
enhancedError.statusCode = error.response?.status;
enhancedError.code = error.code;
throw enhancedError;
```

**Why Canonical:**
- Preserves error context for proper categorization in router
- Maintains HTTP status codes and network error codes
- Enables proper error handling upstream

## Acceptance Criteria Verification

✅ **`flights.search` no longer returns 500 in normal invalid conditions**
- Missing `DUFFEL_API_KEY` → BAD_REQUEST (400)
- Invalid API key → UNAUTHORIZED (401)
- Rate limit → TOO_MANY_REQUESTS (429)
- Invalid parameters → BAD_REQUEST (400)
- Network errors → INTERNAL_SERVER_ERROR (500) with clear message

✅ **Successful requests return a stable, typed payload**
- Response shape validated before mapping
- Null checks prevent undefined access
- Malformed offers filtered out
- Consistent return structure

✅ **Logs show root cause clearly and safely**
- Structured logging with error type, status code, message
- No secrets (API keys) in logs
- Actionable diagnostics for debugging

✅ **No unrelated refactors; no architectural shortcuts**
- Only error handling improved
- No changes to business logic
- Preserves existing architecture
- Follows canonical laws (DOGMA 2, DOGMA 11)

## Testing

### Manual Test Cases

1. **Missing DUFFEL_API_KEY**
   - Expected: BAD_REQUEST with message about configuration
   - Actual: ✅ BAD_REQUEST

2. **Invalid API Key (401)**
   - Expected: UNAUTHORIZED with authentication message
   - Actual: ✅ UNAUTHORIZED

3. **Rate Limit (429)**
   - Expected: TOO_MANY_REQUESTS with retry message
   - Actual: ✅ TOO_MANY_REQUESTS

4. **Invalid Search Parameters (400)**
   - Expected: BAD_REQUEST with validation message
   - Actual: ✅ BAD_REQUEST

5. **Successful Search**
   - Expected: Array of flights with consistent structure
   - Actual: ✅ Stable payload with null-safe mapping

## Summary

The fix implements canonical error handling that:
- Validates environment variables at procedure entry
- Categorizes errors by root cause (not all as 500)
- Validates response shapes before processing
- Uses safe property access with null checks
- Provides structured logging without secrets
- Preserves error context for proper categorization

This ensures the API returns appropriate HTTP/tRPC error codes and actionable error messages, making debugging easier and providing better user experience.

