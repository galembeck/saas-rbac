# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

`@repo/rbac` is the shared RBAC (Role-Based Access Control) library consumed by all apps in the monorepo. It defines roles, subjects, models, and permission rules using **CASL** (`@casl/ability`) and **Zod** for schema validation.

## Architecture

### Entry point: `src/index.ts`

Exports:
- `AppAbility` — the typed CASL ability union built from all subjects
- `createAppAbility` — factory for creating ability instances
- `defineAbilityFor(user: User): AppAbility` — the main function consumers call to get an ability instance for a given user

### Data flow

```
Role (types/role.ts)
  └─ User model (models/user.model.ts)   — { id, role }
       └─ defineAbilityFor()             — dispatches to permissions[user.role]
            └─ permissions.ts            — per-role can/cannot rules

Subject schemas (subjects/*.subject.ts)  — [action, subject] tuples via Zod
  └─ appAbilitiesSchema (index.ts)       — z.union of all subjects
       └─ AppAbility type                — MongoAbility<AppAbilities>

Models (models/*.model.ts)               — Zod schemas with __typename field
  └─ Used by subjects for field-level conditions (e.g. ownerId)
```

### Adding a new subject

1. Create `src/subjects/<name>.subject.ts` — export a `z.tuple([actions, subjects])` schema
2. Add the model to `src/models/<name>.model.ts` if it needs field-level conditions — include `__typename: z.literal("<Name>").default("<Name>")`
3. Import and add the subject to `appAbilitiesSchema` in `src/index.ts`
4. Add permission rules in `src/permissions.ts` for each relevant role

### Adding a new role

1. Add the literal to `roleSchema` in `src/types/role.ts`
2. Add a matching key to the `permissions` record in `src/permissions.ts`

## Key design constraints

- **`__typename`** must be present on any model used as a CASL subject — `detectSubjectType` reads it to dispatch conditions correctly
- Models referenced in subject schemas must use `z.union([z.literal("<Name>"), <schema>])` so CASL can match both the string shorthand and the full object
- This package has no build step — `main` and `types` both point directly to `src/index.ts`; consumers import source TypeScript
