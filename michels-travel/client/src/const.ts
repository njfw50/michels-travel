export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // OAuth is optional - silently return fallback if not configured
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
    // Silently return fallback instead of logging error
    return "#oauth-invalid-url";
  }
};

/**
 * Check if OAuth is properly configured
 */
export const isOAuthConfigured = (): boolean => {
  const loginUrl = getLoginUrl();
  return !loginUrl.startsWith("#oauth");
};

/**
 * Handle login click - navigates to OAuth if configured, or to /login page otherwise
 */
export const handleLoginClick = (e?: React.MouseEvent) => {
  if (e) {
    e.preventDefault();
  }
  
  const loginUrl = getLoginUrl();
  
  if (!isOAuthConfigured()) {
    // OAuth not configured - redirect to email/password login page
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return false;
  }
  
  // Navigate to OAuth login
  window.location.href = loginUrl;
  return true;
};
