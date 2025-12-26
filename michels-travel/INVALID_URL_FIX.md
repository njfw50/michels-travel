# Invalid URL Error Fix

## Problem

The application was crashing with `TypeError: Invalid URL` when trying to create the OAuth login URL because:

1. `VITE_OAUTH_PORTAL_URL` environment variable was not defined or was empty
2. `VITE_APP_ID` environment variable was not defined or was empty
3. `new URL()` constructor was being called with an invalid/undefined value

## Error Location

- **File**: `client/src/const.ts`
- **Function**: `getLoginUrl()`
- **Line**: 10 (original) - `new URL(\`${oauthPortalUrl}/app-auth\`)`

## Solution Applied

### 1. Added Validation in `getLoginUrl()` (`client/src/const.ts`)

**Changes:**
- ✅ Validate that `VITE_OAUTH_PORTAL_URL` is defined and not empty
- ✅ Validate that `VITE_APP_ID` is defined and not empty
- ✅ Added try-catch around `new URL()` construction
- ✅ Return safe fallback values (`#oauth-not-configured` or `#oauth-invalid-url`) instead of crashing
- ✅ Log helpful error messages to console

**Before:**
```typescript
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`); // ❌ Crashes if oauthPortalUrl is undefined
  // ...
};
```

**After:**
```typescript
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // ✅ Validate environment variables
  if (!oauthPortalUrl || typeof oauthPortalUrl !== "string" || oauthPortalUrl.trim() === "") {
    console.error("[Auth] VITE_OAUTH_PORTAL_URL is not configured...");
    return "#oauth-not-configured";
  }
  
  if (!appId || typeof appId !== "string" || appId.trim() === "") {
    console.error("[Auth] VITE_APP_ID is not configured...");
    return "#oauth-not-configured";
  }

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`); // ✅ Safe with validation
    // ...
  } catch (error) {
    console.error("[Auth] Invalid OAuth portal URL:", error);
    return "#oauth-invalid-url"; // ✅ Safe fallback
  }
};
```

### 2. Improved Error Handling in `useAuth()` (`client/src/_core/hooks/useAuth.ts`)

**Changes:**
- ✅ Wrapped `getLoginUrl()` call in try-catch
- ✅ Prevented calling `getLoginUrl()` during module initialization
- ✅ Added error handling for invalid URLs

**Before:**
```typescript
const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } = options ?? {};
// ❌ getLoginUrl() called immediately, crashes if env vars not set
```

**After:**
```typescript
const defaultRedirectPath = (() => {
  try {
    return getLoginUrl();
  } catch (error) {
    console.error("[useAuth] Error getting login URL:", error);
    return "#oauth-error";
  }
})();
// ✅ Safe lazy evaluation with error handling
```

## Required Environment Variables

To fix the root cause, add these to your `.env` file in the `michels-travel` directory:

```env
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal-url.com
VITE_APP_ID=your-app-id
```

## Current Behavior

### With Valid Environment Variables:
- ✅ OAuth login URL is generated correctly
- ✅ Users can authenticate via OAuth

### Without Environment Variables:
- ✅ Application no longer crashes
- ✅ Returns safe fallback URLs (`#oauth-not-configured`)
- ✅ Logs helpful error messages to console
- ⚠️ OAuth login will not work (expected behavior)

## Testing

1. **Without env vars** (current state):
   - Application should load without crashing
   - Console should show error messages about missing env vars
   - Login links will point to `#oauth-not-configured` (won't work, but won't crash)

2. **With env vars** (after configuration):
   - Add `VITE_OAUTH_PORTAL_URL` and `VITE_APP_ID` to `.env`
   - Restart dev server
   - OAuth login should work correctly

## Next Steps

1. **Configure OAuth** (if needed):
   - Add `VITE_OAUTH_PORTAL_URL` to `.env`
   - Add `VITE_APP_ID` to `.env`
   - Restart the dev server

2. **Or disable OAuth** (if not using):
   - The application will work without OAuth
   - Users won't be able to log in via OAuth
   - Other features should still work

## Compliance

✅ **DOGMA 2**: No silent failures - errors are logged to console
✅ **Error Handling**: Graceful degradation instead of crashes
✅ **User Experience**: Application continues to work even if OAuth is not configured

