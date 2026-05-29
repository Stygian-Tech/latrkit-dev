# LatrKit Developer Console

Next.js app for **latrkit.dev** — ATProto OAuth login, developer client/API key management via `services/latr-gateway` HTTP APIs in the [latr-link](https://github.com/Stygian-Tech/latr-link) monorepo.

## Stack

- Next.js 16 App Router, React 19, Tailwind CSS v4
- `@atproto/oauth-client-browser` (loopback on `127.0.0.1`, hosted metadata on latrkit.dev)
- `latr-packages` git dependency for shared gateway types/constants

## Conventions

- Management API calls use OAuth + DPoP only (no app API key in the browser).
- Gateway URL: `NEXT_PUBLIC_LATR_GATEWAY_URL` + hostname heuristics in `src/lib/gatewayConfig.ts`.
- Official client provisioning UI appears only when `NEXT_PUBLIC_OFFICIAL_CLIENT_DID` matches the signed-in DID (gateway enforces the same via `OFFICIAL_CLIENT_DID`).

## Commands

```bash
bun install
bun run dev      # http://127.0.0.1:3001
bun run typecheck
bun run lint
bun run build
```

Pin Bun **1.3.14** (`packageManager` in `package.json`).
