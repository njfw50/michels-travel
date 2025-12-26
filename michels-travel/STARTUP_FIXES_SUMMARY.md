# Startup Fixes Summary

## Problems Fixed

### 1. ✅ OAUTH_SERVER_URL - ERROR → WARNING in Development

**Problem:**
```
[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable.
```

**Solution:**
- **Development**: Changed to WARNING (not ERROR), server starts successfully
- **Production**: Still throws ERROR and prevents server startup (required)
- OAuth methods check if service is available before use

**Files Modified:**
- `server/_core/sdk.ts`:
  - OAuthService: WARNING in dev, ERROR in prod
  - SDKServer: Handles OAuthService errors gracefully
  - OAuth methods: Check for null oauthService

### 2. ✅ Missing Build Directory - No More False Errors

**Problem:**
```
Could not find the build directory: server/_core/public
Error: ENOENT: no such file or directory, stat 'server/_core/public/index.html'
```

**Solution:**
- **Development**: `serveStatic()` detects dev mode and provides helpful message instead of error
- **Production**: Only checks `dist/public` (correct path), returns friendly error if missing
- Never tries to access `server/_core/public` (which doesn't exist)

**Files Modified:**
- `server/_core/vite.ts`:
  - `serveStatic()`: Detects dev vs prod, handles gracefully
  - `setupVite()`: Improved path resolution with multiple fallback strategies

## Current Behavior

### Development Mode (`NODE_ENV=development`):

**OAuth:**
- ✅ Server starts even if OAUTH_SERVER_URL is not set
- ✅ Logs WARNING (not ERROR) about missing OAuth
- ✅ OAuth routes return errors if called (expected)
- ✅ Other API routes work normally

**Frontend:**
- ✅ Uses Vite dev server (setupVite)
- ✅ Serves from `client/index.html`
- ✅ No errors about missing build directory
- ✅ Multiple path resolution strategies to find index.html

### Production Mode (`NODE_ENV=production`):

**OAuth:**
- ✅ Server **refuses to start** if OAUTH_SERVER_URL is missing
- ✅ Clear error message: "OAUTH_SERVER_URL is required in production"

**Frontend:**
- ✅ Serves from `dist/public` (Vite build output)
- ✅ Checks if build exists before serving
- ✅ Returns friendly error page if build not found
- ✅ API routes always return JSON

## Files Changed

1. `server/_core/sdk.ts`:
   - OAuthService constructor: Dev=WARNING, Prod=ERROR
   - SDKServer constructor: Try-catch for OAuthService
   - OAuth methods: Null checks

2. `server/_core/vite.ts`:
   - serveStatic(): Dev/prod detection
   - setupVite(): Improved path resolution
   - Better error messages

## Testing

Run `pnpm dev` and you should see:
- ✅ Server starts successfully
- ✅ WARNING (not ERROR) about OAuth if not configured
- ✅ No errors about missing build directory
- ✅ Frontend loads at http://localhost:3000

## Compliance

✅ **DOGMA 1**: All `/api/*` return JSON ONLY
✅ **DOGMA 2**: No silent failures - all errors explicit
✅ **DOGMA 5**: Contract-first - config is explicit
✅ **LAW 3.3**: Canonical error schema

