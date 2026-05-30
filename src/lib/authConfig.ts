import { buildAtprotoLoopbackClientId } from "@atproto/oauth-types";

import { LATRKIT_DEV_OAUTH_SCOPES } from "@/lib/atprotoOAuthScopes";
export function resolveOAuthResponseMode(): "fragment" | "query" {
  return process.env.NEXT_PUBLIC_OAUTH_RESPONSE_MODE === "query"
    ? "query"
    : "fragment";
}

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

export function isLocalOAuthMode(): boolean {
  if (process.env.NEXT_PUBLIC_ATPROTO_LOCAL === "true") {
    return true;
  }
  return (
    typeof window !== "undefined" &&
    isLoopbackHostname(window.location.hostname)
  );
}

function clientIdOrigin(clientId: string): string | null {
  try {
    return new URL(clientId).origin;
  } catch {
    return null;
  }
}

export function resolveHostedRedirectUri(): string {
  if (typeof window === "undefined") {
    throw new Error("resolveHostedRedirectUri requires the browser");
  }
  return `${window.location.origin}/callback`;
}

export function resolveClientId(): string {
  const manual = process.env.NEXT_PUBLIC_LOCAL_OAUTH_CLIENT_ID?.trim();
  if (manual) return manual;

  if (!isLocalOAuthMode()) {
    const fromOrigin =
      typeof window !== "undefined"
        ? `${window.location.origin}/client-metadata.json`
        : null;
    const explicit = process.env.NEXT_PUBLIC_ATPROTO_CLIENT_ID?.trim();
    if (fromOrigin) {
      if (explicit) {
        const explicitOrigin = clientIdOrigin(explicit);
        if (explicitOrigin === window.location.origin) return explicit;
      }
      return fromOrigin;
    }
    if (explicit) return explicit;
    return "https://latrkit.dev/client-metadata.json";
  }

  if (typeof window === "undefined") {
    throw new Error("resolveClientId requires the browser in local OAuth mode");
  }

  const redirectUri =
    process.env.NEXT_PUBLIC_LOCAL_REDIRECT_URI?.trim() ??
    buildDefaultLocalCallbackUrl();

  return buildAtprotoLoopbackClientId({
    scope: LATRKIT_DEV_OAUTH_SCOPES,
    redirect_uris: [redirectUri],
  });
}

export function buildDefaultLocalCallbackUrl(): string {
  const u = new URL(window.location.href);
  if (u.hostname === "localhost") u.hostname = "127.0.0.1";
  u.pathname = "/callback";
  u.search = "";
  u.hash = "";
  return u.toString();
}

export function readOAuthCallbackParamsFromWindow(): URLSearchParams | null {
  if (typeof window === "undefined") return null;
  const mode = resolveOAuthResponseMode();
  if (mode === "query") {
    return new URLSearchParams(window.location.search);
  }
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return hash ? new URLSearchParams(hash) : null;
}

export function hasPendingOAuthBrowserCallback(): boolean {
  const params = readOAuthCallbackParamsFromWindow();
  if (!params) return false;
  return params.has("code") || params.has("error");
}

/** Fail fast when Bluesky would reject PAR (metadata unreachable or redirect mismatch). */
export async function assertHostedOAuthClientReady(): Promise<void> {
  if (isLocalOAuthMode() || typeof window === "undefined") return;

  const clientId = resolveClientId();
  const redirectUri = resolveHostedRedirectUri();

  let res: Response;
  try {
    res = await fetch(clientId, { redirect: "error" });
  } catch {
    throw new Error(`Could not fetch OAuth client metadata at ${clientId}.`);
  }

  if (!res.ok) {
    throw new Error(
      `OAuth client metadata at ${clientId} returned HTTP ${res.status}. Bluesky must fetch this URL publicly — Vercel preview deploys need Deployment Protection disabled, or test on latrkit.dev / latrkit-dev.vercel.app.`
    );
  }

  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim();
  if (contentType !== "application/json") {
    throw new Error(
      `OAuth client metadata at ${clientId} must be application/json (got ${contentType ?? "unknown"}).`
    );
  }

  const metadata = (await res.json()) as { redirect_uris?: string[] };
  if (!metadata.redirect_uris?.includes(redirectUri)) {
    const allowed = metadata.redirect_uris?.join(", ") ?? "(none)";
    throw new Error(
      `OAuth redirect mismatch: this page uses ${redirectUri}, but client metadata only allows ${allowed}. Unset NEXT_PUBLIC_ATPROTO_CLIENT_ID unless it matches the URL in your browser.`
    );
  }
}
