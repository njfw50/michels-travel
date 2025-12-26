# ENOENT Error Fix Summary

## Problem Diagnosed

The server was trying to access a non-existent file at:
```
C:\Users\njfw2\michels-travel\michels-travel\server\_core\public\index.html
```

This caused an unhandled ENOENT error that crashed the server with a raw stack trace.

## Root Cause

1. **Path Resolution Issue**: The `serveStatic` function was trying to serve `index.html` without checking if it exists first
2. **Missing Error Handling**: No proper error handling for missing files
3. **Wrong Path in Production**: The production static serving logic had incorrect path resolution

## Changes Applied

### File: `server/_core/vite.ts`

#### 1. Fixed `serveStatic()` function (Production mode)
- **Before**: Attempted to serve `index.html` without checking existence, causing ENOENT
- **After**: 
  - Checks if `dist/public` directory exists before attempting to serve
  - Checks if `index.html` exists before calling `res.sendFile()`
  - Returns friendly HTML error pages instead of crashing
  - API routes (`/api/*`) still return JSON errors

#### 2. Improved `setupVite()` error handling (Development mode)
- **Before**: Returned JSON error for missing `index.html` (inappropriate for browser)
- **After**:
  - Returns friendly HTML error page when `index.html` is not found
  - Better error messages with path information
  - Proper error handling in catch block that distinguishes API vs non-API routes

## Key Improvements

### 1. Safe File Serving
```typescript
// Now checks existence before serving
if (fs.existsSync(indexPath)) {
  res.sendFile(indexPath, (err) => {
    // Error handling
  });
} else {
  // Friendly 404 response
}
```

### 2. API Route Protection
- All `/api/*` routes return JSON errors (never HTML)
- Non-API routes return HTML error pages when appropriate
- No raw stack traces exposed to clients

### 3. Development vs Production Behavior

**Development Mode:**
- Uses Vite dev server with HMR
- Looks for `client/index.html` in project root
- Returns friendly HTML error if file not found
- Logs helpful path information

**Production Mode:**
- Serves from `dist/public` (build output)
- Checks if build directory exists
- Returns helpful error page if build not found
- Only serves `index.html` if it exists

## Compliance with Canonical Laws

✅ **DOGMA 1**: All `/api/*` endpoints return JSON ONLY
✅ **DOGMA 2**: No silent failures - all errors are explicit
✅ **LAW 3.3**: Errors use canonical error schema (for API routes)
✅ **Safe Error Handling**: No unhandled filesystem errors

## Testing

To verify the fix:

1. **Development Mode**:
   ```bash
   cd michels-travel
   pnpm dev
   ```
   - Server should start without ENOENT errors
   - Accessing `http://localhost:3000` should either:
     - Show the React app (if `client/index.html` exists)
     - Show a friendly error page (if file not found)
   - Accessing `/api/trpc` should return JSON (never HTML)

2. **Production Mode**:
   ```bash
   cd michels-travel
   pnpm build
   NODE_ENV=production pnpm start
   ```
   - Server should serve from `dist/public`
   - If build doesn't exist, shows helpful error page
   - No ENOENT crashes

## Current Status

✅ **ENOENT Error Fixed**: Server no longer crashes with unhandled filesystem errors
✅ **Error Handling Improved**: All file operations check existence first
✅ **User-Friendly Errors**: HTML error pages for non-API routes, JSON for API routes
✅ **Canonical Compliance**: Respects all architectural principles

## Next Steps

If you're still seeing 404 errors:

1. **Verify you're running from the correct directory**:
   ```bash
   cd "C:\Users\njfw2\OneDrive\Área de Trabalho\Project\michels-travel"
   pnpm dev
   ```

2. **Check that `client/index.html` exists**:
   ```bash
   ls client/index.html
   ```

3. **Check server logs** for path resolution information

4. **If file exists but still 404**: The server logs will show which paths it tried, helping diagnose the issue

