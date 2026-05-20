# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with hot reload (tsx watch)
pnpm db:migrate   # Run Prisma migrations
pnpm db:seed      # Seed the database
pnpm db:studio    # Open Prisma Studio
```

All scripts use `dotenv-cli` to load the root `.env` file (`../../.env`). Environment variables must be defined there.

## Architecture

**Fastify 5 + Zod + Prisma** REST API. Zod is wired as the type provider via `fastify-type-provider-zod`, so all route schemas use Zod directly — no separate JSON Schema.

### Request flow

```
Request → Route (Zod body/response schema) → Handler → Prisma → Reply
                         ↑
              auth middleware (preHandler hook)
```

### Path alias

`@/` resolves to `src/`. Use it for all internal imports.

### Route structure

Routes live in `src/http/routes/<domain>/<action>.ts`. Each file exports a single async function that receives `app: FastifyInstance` and registers one route. Routes are imported and registered individually in `src/server.ts` — no auto-discovery.

### Authentication

Protected routes register the `auth` plugin (`src/http/middlewares/auth.ts`) on a scoped sub-instance via `.register(auth)`. The plugin attaches `request.getCurrentUserId()` as a preHandler hook that verifies the JWT and returns the user's `sub`. Unprotected routes do not use this plugin.

### Error handling

Throw domain error classes from `src/http/routes/_errors/`:
- `BadRequestError` → 400
- `UnauthorizedError` → 401
- `NotFoundError` → 404

All three classes share the same constructor signature:

```typescript
new BadRequestError(title: string | null, code: AppException, description?: string | null)
```

`code` must be a value from one of the exception enums (see below). `title` and `description` are optional backend-supplied strings; pass `null` when not needed.

The central `errorHandler` (`src/http/error-handler.ts`) maps these plus `ZodError` to the correct HTTP responses. All unhandled errors fall through to a 500.

Domain error response shape:

```json
{
  "statusCode": 400,
  "title": "string | null",
  "message": "INVALID_CREDENTIALS",
  "description": "string | null"
}
```

`ZodError` (validation failures) keeps its own shape: `{ message: "Validation error", errors: <tree> }`.

### Exception enums

Machine-readable error codes live in `src/http/_errors/exceptions/`, one file per domain:

| File | Enum | Values |
|------|------|--------|
| `auth.ts` | `AuthException` | `INVALID_CREDENTIALS`, `GITHUB_NO_EMAIL`, `USER_HAS_NO_PASSWORD`, `INVALID_TOKEN`, `UNAUTHORIZED` |
| `user.ts` | `UserException` | `EMAIL_ALREADY_REGISTERED`, `USER_NOT_FOUND` |
| `org.ts` | `OrgException` | `DOMAIN_ALREADY_IN_USE` |

`index.ts` exports `AppException` — a union of all enum types, used as the `code` parameter type in error classes.

**Adding a new exception enum:**
1. Add the value to the relevant file (or create a new file for a new domain)
2. If creating a new file, add its type to the `AppException` union in `index.ts`
3. Throw it: `throw new BadRequestError(null, MyException.MY_CODE)`

### Prisma client

The generated client is at `src/generated/prisma/` (not `node_modules`). Import the singleton from `@/lib/prisma`. The client uses the `@prisma/adapter-pg` driver adapter for PostgreSQL.

### OpenAPI docs

Swagger + Scalar are mounted at `/docs`. Every route schema should include `tags`, `summary`, and `security` (for authenticated routes: `[{ bearerAuth: [] }]`).

## Adding a new route

1. Create `src/http/routes/<domain>/<action>.ts` exporting an async function
2. Use `.withTypeProvider<ZodTypeProvider>()` to get typed request/reply
3. Register `auth` plugin if the route requires authentication
4. Import and register in `src/server.ts`
5. Register the route in `src/test/helpers/build-app.ts` (the test app factory)
6. Create `src/http/routes/<domain>/<action>.test.ts` (see Testing section below)

---

## Testing

### Commands

```bash
pnpm test            # Run all tests once
pnpm test:watch      # Watch mode
pnpm test:coverage   # Run with v8 coverage report
```

### Infrastructure

Tests use **Vitest** with `app.inject()` (no real HTTP server) and a mocked Prisma client (no database required).

| File | Purpose |
|------|---------|
| `src/test/setup.ts` | Stubs env vars before any module loads — satisfies `@repo/env` without a real DB |
| `src/test/mocks/prisma.ts` | Exports `prismaMock` (all delegates as `vi.fn()`) and `resetPrismaMocks()` |
| `src/test/helpers/build-app.ts` | Lightweight Fastify app factory — registers all routes but skips Swagger/Scalar |
| `src/test/helpers/sign-token.ts` | `signToken(app, userId)` — signs a JWT via the app's jwt plugin |
| `src/test/helpers/membership.ts` | `mockMembership(userId, role)` — pre-configures `prismaMock.member.findFirst` for protected routes |

### Test file skeleton

Every test file follows this pattern:

```typescript
import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "@/test/helpers/build-app";
import { prismaMock, resetPrismaMocks } from "../../test/mocks/prisma"; // relative path, no .js
import { signToken } from "@/test/helpers/sign-token"; // for protected routes

vi.mock("@/lib/prisma", async () => {
  const { prismaMock } = await import("../../test/mocks/prisma"); // must use dynamic import
  return { prisma: prismaMock };
});

describe("METHOD /path", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(() => { resetPrismaMocks(); });

  it("happy path description", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ /* ... */ });
    const response = await app.inject({ method: "GET", url: "/path" });
    expect(response.statusCode).toBe(200);
  });
});
```

> **Important — `vi.mock` factory must use `async` + dynamic `import()`.**
> The factory is hoisted before static imports, so referencing an imported variable directly (e.g. `() => ({ prisma: prismaMock })`) causes a "Cannot access before initialization" error. Always use `async () => { const { prismaMock } = await import(...); return { prisma: prismaMock }; }`.

> **Important — relative path for prisma mock imports.**
> The Biome linter rewrites `@/test/mocks/prisma` to a relative path with a `.js` extension. Use the relative path without `.js` (e.g. `../../test/mocks/prisma` from `src/http/routes/auth/`). For files inside `src/test/helpers/`, import as `../mocks/prisma` and add `// biome-ignore lint/style/useImportExtensions: vitest resolves .ts directly` to prevent the linter from generating a broken path.

### Testing protected routes

Protected routes require both a valid JWT and a mocked membership. Use `mockMembership` which configures `prismaMock.member.findFirst` with the correct shape that `auth.ts`'s `getUserMembership` expects:

```typescript
const userId = faker.string.uuid();
const { organization, membership } = mockMembership(userId, "ADMIN"); // role: ADMIN | MEMBER | BILLING
const token = signToken(app, userId);

const response = await app.inject({
  method: "GET",
  url: `/organizations/${organization.slug}/something`,
  headers: { Authorization: `Bearer ${token}` },
});
```

To simulate a non-owner ADMIN (for RBAC update/transfer_ownership tests), override `member.findFirst` after calling `mockMembership`:

```typescript
const { organization } = mockMembership(userId, "ADMIN");
prismaMock.member.findFirst.mockResolvedValue({
  id: faker.string.uuid(),
  role: "ADMIN",
  organizationId: organization.id,
  userId,
  organization: { ...organization, ownerId: faker.string.uuid() }, // different owner
});
```

### RBAC permission matrix

| Role | Organization | Project |
|------|-------------|---------|
| ADMIN | manage all; update/transfer_ownership only if `ownerId === userId` | manage all |
| MEMBER | — | create, get; update/delete own (`ownerId === userId`) |
| BILLING | — | — |

### Adding a new exception enum

1. Add the value to the relevant file in `src/http/_errors/exceptions/`
2. If it's a new domain file, add its type to `AppException` in `index.ts`
3. Add the new Prisma mock delegates to `src/test/mocks/prisma.ts` if needed
4. Write test cases for both the success path and the new error code
