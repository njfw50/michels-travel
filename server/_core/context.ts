import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error: any) {
    // CANONICAL ERROR HANDLING
    // DOGMA 2: Authentication is optional for public procedures
    // DOGMA 2: Structured logging (no secrets) for debugging
    
    // Only log non-expected errors (not missing cookies for unauthenticated requests)
    const errorMessage = error?.message || String(error);
    const isExpectedError = 
      errorMessage.includes("Invalid session cookie") ||
      errorMessage.includes("Missing session cookie") ||
      errorMessage.includes("No session cookie");
    
    if (!isExpectedError && process.env.NODE_ENV === 'development') {
      // DOGMA 2: Log error details for debugging (no secrets)
      console.warn("[Context] Authentication error (non-fatal):", {
        errorType: error?.constructor?.name || "Unknown",
        hasMessage: !!errorMessage,
        messagePreview: errorMessage.substring(0, 100), // Limit message length
      });
    }
    
    // Authentication failed - set user to null (allows public procedures to continue)
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
