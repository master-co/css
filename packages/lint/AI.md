# AI Notes For `@master/css-lint`

## Responsibility

`@master/css-lint` exposes the Rust-owned framework-neutral Master CSS lint policy through session and source-range adapters.

## Owns

- Rust-backed class sorting, conflict/partial-conflict, raw-value, validation, and canonicalization policy.
- Rust-backed class-list diagnostics and edit plans.
- Session lifecycle, version checks, and source-range mapping.
- Default lint target settings shared by adapters.
- Framework-neutral source-content lint orchestration that maps class-list diagnostics and fixes onto source ranges.

## Does Not Own

- ESLint rule objects, reports, configs, parser visitors, or autofix ranges.
- Project manifest discovery or filesystem access.
- Source extraction adapters.
- Engine CSS generation semantics.
- Class-list token/range parsing and class semantics outside the Rust lint request.
- Language service lifecycle, scanner, runtime, framework, or site behavior.

## Public Surface

- `createLintSession`
- `createLintSessionSync` under `./node`
- Rust-owned lint request, diagnostic, and edit IR types
- `lintMasterCSSContent`
- `fixMasterCSSContent`
- `resolveMasterCSSLintRules`
- `summarizeMasterCSSLintFiles`
- `defaultClassLintSettings`
- `defaultCanonicalClassNameOptions`

## Key Files

- `src/index.ts`
- `src/rust-session.ts`
- `src/contracts.ts`
- `src/source.ts`
- `src/node.ts`

## Risk Areas

- Ordering, conflict, and canonical suggestion behavior must match generated engine rules.
- Do not duplicate Rust class parsing, value normalization, rule inspection, or lint policy in TypeScript.
- Validation diagnostics must preserve scanner and ESLint expectations.
- This package must not import ESLint, project resolution, filesystem, scanner, language service, or framework packages.
- Native/Wasm absence must be explicit; never build a TypeScript semantic fallback.

## Validation

```sh
pnpm --filter @master/css-lint test
pnpm --filter @master/css-lint lint
pnpm --filter @master/css-lint type-check
pnpm --filter @master/css-lint build
```
