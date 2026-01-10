// DOGMA 10: Auto-initialization with defaults for development
// DOGMA 2: No silent failures - validate critical environment variables
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// Validate JWT_SECRET on module load (DOGMA 2: Explicit validation)
if (ENV.isProduction && (!ENV.cookieSecret || ENV.cookieSecret.trim() === "")) {
  throw new Error(
    "JWT_SECRET is required in production. " +
    "Please configure JWT_SECRET in your .env file with at least 32 characters."
  );
}
