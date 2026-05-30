import {
  configureLatrGateway,
  DEFAULT_TESTING_LATR_GATEWAY_URL,
  type LatrAppEnv,
} from "@/lib/gatewayConfig";

export function syncLatrGatewayFromBrowser(): void {
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV?.trim() ?? "local") as LatrAppEnv;
  configureLatrGateway({
    gatewayUrl: process.env.NEXT_PUBLIC_LATR_GATEWAY_URL,
    appEnv,
    testingHostname:
      typeof window !== "undefined" ? window.location.hostname : undefined,
  });
}

function testingGatewayUrl(): string {
  const configured = process.env.NEXT_PUBLIC_LATR_GATEWAY_URL?.trim();
  return configured?.replace(/\/$/, "") ?? DEFAULT_TESTING_LATR_GATEWAY_URL;
}

/** Gateway API base for OAuth metadata when the SPA host maps to a hosted gateway. */
export function inferGatewayApiBase(origin?: string): string | null {
  if (!origin) return null;
  try {
    const { hostname } = new URL(origin);
    if (hostname === "testing.latrkit.dev") {
      return testingGatewayUrl();
    }
  } catch {
    //
  }
  return null;
}
