export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // OAuth is optional - silently return fallback if not configured
  // DOGMA 2: No silent failures - but OAuth is optional, so we return a safe fallback
  if (!oauthPortalUrl || typeof oauthPortalUrl !== "string" || oauthPortalUrl.trim() === "") {
    return "#oauth-not-configured";
  }
  
  if (!appId || typeof appId !== "string" || appId.trim() === "") {
    return "#oauth-not-configured";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    // DOGMA 2: Explicit error handling - return safe fallback instead of throwing
    return "#oauth-invalid-url";
  }
};

/**
 * Check if OAuth is properly configured
 * DOGMA 8: Authentication system must be functional
 */
export const isOAuthConfigured = (): boolean => {
  const loginUrl = getLoginUrl();
  return !loginUrl.startsWith("#oauth");
};
