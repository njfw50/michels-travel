import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const buildEndpointUrl = (baseUrl: string): string => {
  const normalizedBase = baseUrl.endsWith("/")
    ? baseUrl
    : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Dispatches a project-owner notification through the Manus Notification Service.
 * Returns `true` if the request was accepted, `false` when the upstream service
 * cannot be reached or is not configured (callers can fall back to email/slack).
 * 
 * CANONICAL BEHAVIOR:
 * - In development: Missing URL/key logs warning and returns false (best-effort)
 * - In production: Missing URL/key logs warning and returns false (best-effort)
 * - Validation errors still bubble up as TRPC errors so callers can fix the payload
 * - Network/HTTP errors are caught and return false (never throw)
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  // CANONICAL: Best-effort notification - missing config should not crash the app
  if (!ENV.forgeApiUrl) {
    if (ENV.isProduction) {
      console.warn(
        "[Notification] ⚠️ Notification service URL is not configured. " +
        "Set BUILT_IN_FORGE_API_URL in your .env file to enable notifications."
      );
    } else {
      console.debug(
        "[Notification] ℹ️ Notification service URL not configured (development mode). " +
        "Notifications will be skipped. Set BUILT_IN_FORGE_API_URL in .env to enable."
      );
    }
    return false;
  }

  if (!ENV.forgeApiKey) {
    if (ENV.isProduction) {
      console.warn(
        "[Notification] ⚠️ Notification service API key is not configured. " +
        "Set BUILT_IN_FORGE_API_KEY in your .env file to enable notifications."
      );
    } else {
      console.debug(
        "[Notification] ℹ️ Notification service API key not configured (development mode). " +
        "Notifications will be skipped. Set BUILT_IN_FORGE_API_KEY in .env to enable."
      );
    }
    return false;
  }

  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}
