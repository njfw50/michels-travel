import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // const hostname = req.hostname;
  // const shouldSetDomain =
  //   hostname &&
  //   !LOCAL_HOSTS.has(hostname) &&
  //   !isIpAddress(hostname) &&
  //   hostname !== "127.0.0.1" &&
  //   hostname !== "::1";

  // const domain =
  //   shouldSetDomain && !hostname.startsWith(".")
  //     ? `.${hostname}`
  //     : shouldSetDomain
  //       ? hostname
  //       : undefined;

  // DOGMA 2: Explicit configuration - fix cookie settings for localhost
  const isLocalhost = LOCAL_HOSTS.has(req.hostname || '') || isIpAddress(req.hostname || '');
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    path: "/",
    // In development (localhost), use 'lax' instead of 'none' for better compatibility
    // In production, use 'none' for cross-site requests
    sameSite: isLocalhost && !isProduction ? "lax" : "none",
    // In development (localhost), secure can be false
    // In production, secure must be true for sameSite: 'none'
    secure: isProduction ? isSecureRequest(req) : false,
  };
}
