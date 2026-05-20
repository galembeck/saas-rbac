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
