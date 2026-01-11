import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import type {
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  GetUserInfoResponse,
  GetUserInfoWithJwtRequest,
  GetUserInfoWithJwtResponse,
} from "./types/manusTypes";
// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

const EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
const GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
const GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;

class OAuthService {
  constructor(private client: ReturnType<typeof axios.create>) {
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }

  private decodeState(state: string): string {
    const redirectUri = atob(state);
    return redirectUri;
  }

  async getTokenByCode(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    const payload: ExchangeTokenRequest = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state),
    };

    const { data } = await this.client.post<ExchangeTokenResponse>(
      EXCHANGE_TOKEN_PATH,
      payload
    );

    return data;
  }

  async getUserInfoByToken(
    token: ExchangeTokenResponse
  ): Promise<GetUserInfoResponse> {
    const { data } = await this.client.post<GetUserInfoResponse>(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken,
      }
    );

    return data;
  }
}

const createOAuthHttpClient = (): AxiosInstance =>
  axios.create({
    baseURL: ENV.oAuthServerUrl,
    timeout: AXIOS_TIMEOUT_MS,
  });

class SDKServer {
  private readonly client: AxiosInstance;
  private readonly oauthService: OAuthService;

  constructor(client: AxiosInstance = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }

  private deriveLoginMethod(
    platforms: unknown,
    fallback: string | null | undefined
  ): string | null {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set<string>(
      platforms.filter((p): p is string => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (
      set.has("REGISTERED_PLATFORM_MICROSOFT") ||
      set.has("REGISTERED_PLATFORM_AZURE")
    )
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }

  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    return this.oauthService.getTokenByCode(code, state);
  }

  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken,
    } as ExchangeTokenResponse);
    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoResponse;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    // DOGMA 2: No silent failures - validate JWT_SECRET
    // DOGMA 10: Auto-initialization - use default if not configured in development
    let secret = ENV.cookieSecret;
    
    if (!secret || secret.trim() === "") {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "JWT_SECRET is required in production. " +
          "Please configure JWT_SECRET in your .env file with at least 32 characters."
        );
      } else {
        // DOGMA 10: Use default secret in development
        secret = "dev-secret-key-change-in-production-min-32-chars";
        console.warn(
          "[Auth] ⚠️ JWT_SECRET not configured, using default development secret. " +
          "Set JWT_SECRET in .env for production."
        );
      }
    }
    
    // Validate minimum length (jose requires at least 32 bytes for HS256)
    if (secret.length < 32) {
      throw new Error(
        `JWT_SECRET must be at least 32 characters long. Current length: ${secret.length}. ` +
        "Please update your .env file with a longer JWT_SECRET."
      );
    }
    
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    // DOGMA 2: No silent failures - validate inputs
    if (!openId || openId.trim() === "") {
      throw new Error("openId is required to create session token");
    }
    
    // DOGMA 10: Use default appId in development if not configured
    let appId = ENV.appId;
    if (!appId || appId.trim() === "") {
      if (process.env.NODE_ENV === "production") {
        throw new Error("VITE_APP_ID is required in production. Configure it in your .env file.");
      } else {
        // Use default in development
        appId = "dev-app-id";
        console.warn(
          "[Auth] ⚠️ VITE_APP_ID not configured, using default development appId. " +
          "Set VITE_APP_ID in .env for production."
        );
      }
    }
    
    return this.signSession(
      {
        openId,
        appId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      // DOGMA 2: Explicit validation - name can be empty but openId and appId cannot
      if (!isNonEmptyString(openId)) {
        console.warn("[Auth] Session payload missing openId");
        return null;
      }
      
      if (!isNonEmptyString(appId)) {
        console.warn("[Auth] Session payload missing appId");
        return null;
      }
      
      // Name is optional (can be empty string)
      const verifiedName = typeof name === "string" ? name : "";

      return {
        openId,
        appId,
        name: verifiedName,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async getUserInfoWithJwt(
    jwtToken: string
  ): Promise<GetUserInfoWithJwtResponse> {
    const payload: GetUserInfoWithJwtRequest = {
      jwtToken,
      projectId: ENV.appId,
    };

    const { data } = await this.client.post<GetUserInfoWithJwtResponse>(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );

    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoWithJwtResponse;
  }

  async authenticateRequest(req: Request): Promise<User> {
    // CANONICAL AUTHENTICATION FLOW
    // DOGMA 2: No Silent Failures - explicit error handling
    // DOGMA 11: Support both OAuth and email/password authentication
    
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    
    // DOGMA 2: Structured logging (no secrets) for debugging
    if (process.env.NODE_ENV === 'development') {
      if (!sessionCookie) {
        console.debug(`[Auth] No session cookie found. Cookie header: ${req.headers.cookie ? 'present' : 'missing'}`);
      } else {
        console.debug(`[Auth] Session cookie found (length: ${sessionCookie.length})`);
      }
    }
    
    // Verify session JWT
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      // DOGMA 2: Explicit error - don't log secrets
      if (process.env.NODE_ENV === 'development') {
        console.debug("[Auth] Session verification failed - invalid or missing session cookie");
      }
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    
    // CANONICAL GUARD: Get user from database
    let user = await db.getUserByOpenId(sessionUserId);

    // CANONICAL GUARD: Handle missing user based on login method
    if (!user) {
      // Check if this is an email/password user (openId format: "email:user@example.com")
      const isEmailPasswordUser = sessionUserId.startsWith("email:");
      
      if (isEmailPasswordUser) {
        // Email/password users should exist in DB - if not found, it's an error
        // DOGMA 2: Explicit error message
        if (process.env.NODE_ENV === 'development') {
          console.error(`[Auth] Email/password user not found in database: ${sessionUserId}`);
        }
        throw ForbiddenError("User account not found. Please register or contact support.");
      } else {
        // OAuth users: try to sync from OAuth server
        try {
          const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
          await db.upsertUser({
            openId: userInfo.openId,
            name: userInfo.name || null,
            email: userInfo.email ?? null,
            loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
            lastSignedIn: signedInAt,
          });
          user = await db.getUserByOpenId(userInfo.openId);
        } catch (error: any) {
          // DOGMA 2: Structured logging (no secrets)
          const errorMessage = error?.message || String(error);
          console.error("[Auth] Failed to sync OAuth user:", {
            errorType: error?.constructor?.name || "Unknown",
            hasMessage: !!errorMessage,
            openId: sessionUserId.substring(0, 10) + "...", // Partial openId for debugging, not full secret
          });
          throw ForbiddenError("Failed to sync user info from authentication provider");
        }
      }
    }

    if (!user) {
      // DOGMA 2: This should never happen after the above checks, but explicit error
      throw ForbiddenError("User not found after authentication");
    }

    // Update last signed in timestamp
    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export const sdk = new SDKServer();
