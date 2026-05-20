# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Purpose

`@repo/env` is the shared environment variable validation package for the monorepo. It uses [`@t3-oss/env-nextjs`](https://env.t3.gg/) with Zod to parse and validate all environment variables at startup — any missing or malformed variable throws at import time.

All apps import `env` from this package instead of accessing `process.env` directly:

```ts
import { env } from "@repo/env";
env.DATABASE_URL; // fully typed, validated
```

## Adding a New Variable

1. Add the Zod schema to the appropriate section in `index.ts` — `server` for server-only vars, `client` (prefixed `NEXT_PUBLIC_`) for browser-safe vars, `shared` for both.
2. Add the corresponding `process.env.VAR_NAME` mapping to `runtimeEnv`.
3. Update any `.env.example` files in consumer apps.

Both `server` schema key and `runtimeEnv` key must match exactly, or `@t3-oss/env-nextjs` will throw a type error.

## Current Variables

| Variable | Validation | Default |
|---|---|---|
| `PORT` | `number` | `3333` |
| `DATABASE_URL` | URL string | — |
| `JWT_SECRET` | string | — |
| `GITHUB_OAUTH_CLIENT_ID` | string | — |
| `GITHUB_OAUTH_CLIENT_SECRET` | string | — |
| `GITHUB_OAUTH_REDIRECT_URI` | URL string | — |

## Package Entry Point

`package.json` sets `"main": "index.ts"` — consumers import the raw TypeScript file directly (no build step). The consuming app's bundler/ts-node resolves it.
