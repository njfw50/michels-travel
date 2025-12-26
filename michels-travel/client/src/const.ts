export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // Validate required environment variables
  if (!oauthPortalUrl || typeof oauthPortalUrl !== "string" || oauthPortalUrl.trim() === "") {
    console.error(
      "[Auth] VITE_OAUTH_PORTAL_URL is not configured. " +
      "Please set VITE_OAUTH_PORTAL_URL in your .env file."
    );
    // Return a fallback URL that will show an error message
    // In production, you might want to throw an error instead
    return "#oauth-not-configured";
  }
  
  if (!appId || typeof appId !== "string" || appId.trim() === "") {
    console.error(
      "[Auth] VITE_APP_ID is not configured. " +
      "Please set VITE_APP_ID in your .env file."
    );
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
    console.error("[Auth] Invalid OAuth portal URL:", oauthPortalUrl, error);
    // Return a safe fallback instead of crashing
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
 * Handle login click - navigates to OAuth if configured, shows error otherwise
 */
export const handleLoginClick = (e?: React.MouseEvent) => {
  if (e) {
    e.preventDefault();
  }
  
  const loginUrl = getLoginUrl();
  
  if (!isOAuthConfigured()) {
    // Show error message to user
    if (typeof window !== "undefined" && (window as any).toast) {
      (window as any).toast.error(
        "OAuth não está configurado. Por favor, configure VITE_OAUTH_PORTAL_URL e VITE_APP_ID no arquivo .env",
        { duration: 5000 }
      );
    } else {
      alert(
        "OAuth não está configurado.\n\n" +
        "Por favor, configure as seguintes variáveis de ambiente no arquivo .env:\n" +
        "- VITE_OAUTH_PORTAL_URL\n" +
        "- VITE_APP_ID"
      );
    }
    return false;
  }
  
  // Navigate to OAuth login
  window.location.href = loginUrl;
  return true;
};
