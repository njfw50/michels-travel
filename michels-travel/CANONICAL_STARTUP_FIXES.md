# Canonical Startup Fixes

## Problems Fixed

### 1. OAUTH_SERVER_URL Configuration

**Problem:**
- Server was logging `[OAuth] ERROR: OAUTH_SERVER_URL is not configured!` even in development
- This made it seem like a critical error when it's optional in development

**Solution Applied:**

#### File: `server/_core/sdk.ts`

**Changes:**
1. **OAuthService Constructor**:
   - **Development**: Logs WARNING (not ERROR) if OAUTH_SERVER_URL is missing
   - **Production**: Throws error to prevent server startup if OAUTH_SERVER_URL is missing
   - Server can start in development without OAuth configured

2. **SDKServer Constructor**:
   - Wraps OAuthService creation in try-catch
   - In development: Allows server to start even if OAuthService fails
   - In production: Re-throws error to prevent server startup
   - Sets `oauthService` to `null` in development if OAuth is not configured

3. **OAuth Methods**:
   - `exchangeCodeForToken()` and `getUserInfo()` now check if `oauthService` is null
   - Throw clear error messages if OAuth is not configured when these methods are called

**Behavior:**

**Development Mode:**
- ✅ Server starts even if OAUTH_SERVER_URL is not set
- ✅ Logs WARNING (not ERROR) about missing OAuth config
- ✅ OAuth routes will return errors if called (expected behavior)
- ✅ Other API routes work normally

**Production Mode:**
- ✅ Server **refuses to start** if OAUTH_SERVER_URL is missing
- ✅ Throws clear error: "OAUTH_SERVER_URL is required in production but is not configured"
- ✅ Prevents deployment with misconfiguration

**Code Changes:**
```typescript
// Before:
if (!ENV.oAuthServerUrl) {
  console.error("[OAuth] ERROR: OAUTH_SERVER_URL is not configured!");
}

// After:
if (isProduction) {
  if (!hasOAuthUrl) {
    throw new Error("OAUTH_SERVER_URL is required in production...");
  }
} else {
  if (!hasOAuthUrl) {
    console.warn("[OAuth] WARNING: OAUTH_SERVER_URL is not configured...");
  }
}
```

### 2. Missing Build Directory

**Problem:**
- Server was logging: "Could not find the build directory: server/_core/public"
- This path doesn't exist and shouldn't be checked in development
- Error was confusing and made it seem like something was broken

**Solution Applied:**

#### File: `server/_core/vite.ts`

**Changes:**
1. **serveStatic() Function**:
   - **Development Mode**: 
     - Detects if called in development (shouldn't happen, but handles gracefully)
     - Logs warning and provides helpful message at root URL
     - Does NOT try to serve static files
     - API routes continue to work
   - **Production Mode**:
     - Only serves from `dist/public` (correct build output path)
     - Checks file existence before serving
     - Returns friendly error pages if build not found
     - API routes always return JSON

2. **Path Resolution**:
   - Uses correct path: `dist/public` (from Vite build output)
   - Never tries to access `server/_core/public` (which doesn't exist)
   - Checks `fs.existsSync()` before any file operations

**Behavior:**

**Development Mode:**
- ✅ Uses `setupVite()` which serves from `client/index.html` via Vite dev server
- ✅ `serveStatic()` should never be called, but if it is, handles gracefully
- ✅ No errors about missing build directory
- ✅ API routes work normally

**Production Mode:**
- ✅ Only serves from `dist/public` (Vite build output)
- ✅ Checks if build exists before attempting to serve
- ✅ Returns friendly error page if build not found
- ✅ API routes always return JSON (never HTML)

**Code Changes:**
```typescript
// Before:
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "../..", "dist", "public");
  // ... tries to serve even if doesn't exist
}

// After:
export function serveStatic(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  
  if (!isProduction) {
    // Handle gracefully in development
    // Provide helpful message, don't try to serve static files
  }
  
  // Production: check existence, serve safely
  if (!fs.existsSync(distPath)) {
    // Return friendly error, don't crash
  }
}
```

## Compliance with Canonical Laws

✅ **DOGMA 1**: All `/api/*` endpoints return JSON ONLY
✅ **DOGMA 2**: No silent failures - all errors are explicit
✅ **DOGMA 5**: Contract-first - configuration is explicit
✅ **LAW 3.3**: Canonical error schema for API errors

## Files Modified

1. `server/_core/sdk.ts`:
   - OAuthService constructor: WARNING in dev, ERROR in prod
   - SDKServer constructor: Handles OAuthService errors gracefully
   - OAuth methods: Check for null oauthService

2. `server/_core/vite.ts`:
   - serveStatic(): Detects dev vs prod, handles gracefully
   - Never tries to access non-existent paths
   - Checks file existence before serving

## Testing

### Development Mode:
```bash
cd michels-travel
pnpm dev
```

**Expected:**
- ✅ Server starts successfully
- ✅ WARNING (not ERROR) about OAuth if not configured
- ✅ No errors about missing build directory
- ✅ Frontend served via Vite dev server
- ✅ API routes work: `/api/trpc`

### Production Mode:
```bash
cd michels-travel
pnpm build
NODE_ENV=production pnpm start
```

**Expected:**
- ✅ If OAUTH_SERVER_URL missing: Server refuses to start with clear error
- ✅ If build missing: Server starts but shows friendly error page
- ✅ API routes work: `/api/trpc` returns JSON

## Summary

- **OAuth**: Optional in development, required in production
- **Build Directory**: Not required in development (uses Vite), required in production
- **Error Handling**: All errors are explicit and user-friendly
- **API Routes**: Always return JSON, never HTML

The server now starts cleanly in development without OAuth configured and without build directory errors.

