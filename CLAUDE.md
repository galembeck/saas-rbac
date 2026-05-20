# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This is a **Turborepo + pnpm** monorepo. Workspace roots are declared in `pnpm-workspace.yaml`:

- `apps/*` — application packages (Next.js apps)
- `packages/*` — shared library packages
- `config/*` — shared tooling configs (not published)
  - `config/eslint-config` — exports `./base`, `./next-js`, `./node`
  - `config/prettier-config` — Prettier config with `prettier-plugin-tailwindcss`
  - `config/typescript-config` — exports `base.json`, `nextjs.json`

Internal packages reference each other via `workspace:*` protocol (e.g., `"@repo/prettier-config": "workspace:*"`).

## Commands

```bash
pnpm dev           # Run all apps in dev mode (via Turbo)
pnpm build         # Build all packages (respects Turbo dependency order)
pnpm check-types   # Run TypeScript type checking across all packages
pnpm check         # Lint/format check via Ultracite (Biome)
pnpm fix           # Auto-fix lint/format issues via Ultracite
```

Run a single Turbo task for a specific package:
```bash
pnpm turbo run build --filter=@repo/<package-name>
pnpm turbo run dev --filter=@repo/<app-name>
```

## Linting & Formatting

**Biome** is the formatter and linter (configured in `biome.json`), driven by **Ultracite** presets (`ultracite/biome/core` + `ultracite/biome/react`). Key style rules: tabs for indentation, double quotes for JS/TS.

A pre-commit hook (`/.husky/pre-commit`) auto-runs `pnpm dlx ultracite fix` and re-stages changed files. This also runs `pnpm test` before commits.

A PostToolUse hook in `.claude/settings.json` runs `pnpm fix --skip=correctness/noUnusedImports` after every file Write or Edit — files are auto-fixed on save.

ESLint config (in `config/eslint-config`) is still present for framework-level rules (Next.js, React hooks) and Turbo env-var checks, but Biome handles most linting.

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `pnpm dlx ultracite fix` before committing to ensure compliance.

## TypeScript

Base tsconfig (`config/typescript-config/base.json`) enforces strict mode with `noUncheckedIndexedAccess` enabled. Array index access always returns `T | undefined` — handle accordingly.

Module resolution uses `NodeNext` — imports must include explicit `.js` extensions in TypeScript source files.

## Adding a New Package

1. Create directory under `apps/` or `packages/`
2. Add a `package.json` with `"name": "@repo/<name>"` and `"private": true`
3. Extend the appropriate tsconfig: `{ "extends": "@repo/typescript-config/base.json" }`
4. Reference shared ESLint config: `import { config } from "@repo/eslint-config/base"`
5. No need to update `pnpm-workspace.yaml` — the globs already cover new packages
