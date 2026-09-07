# Package Routing Pack

Use this after `.ai/context/index.md` when a task names files, paths, packages, or a diff. The goal is to choose package-local context without scanning the whole repository.

## Route Order

1. Match changed or referenced paths below.
2. Read each affected workspace `package.json`.
3. For `crates/**`, read root/affected `Cargo.toml` and `.ai/context/rust-routing.md`.
4. Read each affected package/crate-local `AI.md`, if present.
5. Read the task pack from `.ai/context/index.md`.
6. Escalate through `.ai/context/accuracy-guardrails.md` when the path touches high-risk behavior.

When a task spans multiple paths, load the lowest owning package for each path and then read `.ai/context/package-boundaries.md` if behavior crosses package layers.

## Package Paths

For `packages/<name>/**`, read `packages/<name>/package.json` and `packages/<name>/AI.md`.

| Path | Package | Common extra pack |
|---|---|---|
| `packages/schema/**` | `@master/css-schema` | `package-boundaries.md` |
| `packages/preset/**` | `@master/css-preset` | `css-output.md` |
| `packages/binding*/**` | native/Wasm binding delivery | `package-boundaries.md`, `testing.md` |
| `packages/css/**` | `@master/css` | `package-boundaries.md`, `css-output.md`, `performance.md` |
| `packages/compiler/**` | compiler, project, stylesheet, diagnostics | `css-output.md`, `package-boundaries.md` |
| `packages/tooling/**` | lexer, source, scanner, validator, lint, language | `package-boundaries.md`, `testing.md` |
| `packages/internal/**` | `@master/css-internal`, the private official integration kernel | `package-boundaries.md` |
| `packages/runtime/**` | `@master/css-runtime` | `css-output.md`, `performance.md` |
| `packages/server/**` | `@master/css-server` | `css-output.md` |
| `packages/language-service/**`, `packages/language-server/**`, `packages/vscode/**` | editor and LSP tooling | `testing.md` |
| `packages/eslint-*/**` | ESLint tooling | `testing.md` |
| `packages/vite/**`, `packages/webpack/**`, `packages/next/**` | build integrations | `package-boundaries.md`, `css-output.md` |
| `packages/astro/**`, `packages/nuxt/**`, `packages/svelte/**` | framework integrations | `testing.md`, `css-output.md` |
| `packages/cli/**` | CLI | `testing.md`, `package-boundaries.md` |
| `packages/figma/**` | app/plugin surface | `testing.md` |

## Rust Crate Paths

For `crates/<name>/**`, read root `Cargo.toml`, `crates/<name>/Cargo.toml`, the
crate-local `AI.md` when present, and `.ai/context/rust-routing.md`. Pair binding
crates with their matching `packages/binding*` delivery package; pair semantic crates
with the public host named by the Rust routing pack.

## Root And Workspace Paths

| Path | Read | Notes |
|---|---|---|
| `site/**` | `site/package.json`, `site/AI.md`, `docs.md` | Public docs and site behavior. |
| `examples/<framework>/**` | example `package.json`, matching integration package `AI.md` when one exists | Map `astro`, `next.js`, `nuxt.js`, `react`, `svelte`, `vite`, `webpack`, and `eslint*` to their package peers; use `docs.md` for content-only examples. |
| `benchmarks/**` | `benchmarks/package.json`, `benchmarks/AI.md`, `performance.md` | Do not commit benchmark history output. |
| `crates/**`, `Cargo.toml`, `Cargo.lock` | root/affected `Cargo.toml`, `rust-routing.md` | Rust is the semantic source; use crate-local tests first. |
| `parity/**`, `parity-exceptions.json`, `scripts/ts-test-migration/**` | `rust-routing.md`, `testing.md` | Evidence and digests are contracts; do not refresh blindly. |
| `internal/**` | `internal/package.json`, `site/AI.md` when used by site | Root site support workspace; distinct from `packages/internal`. |
| `shared/**` | `shared/package.json`, `package-boundaries.md` | Repo-internal test/build support only. |
| `.github/prompts/**`, `AGENTS.md`, `CLAUDE.md`, `.ai/**` | `docs.md` | AI-facing docs and prompt routing. |
| `.github/workflows/**`, release config, lockfiles | `accuracy-guardrails.md` | Do not modify unless explicitly requested. |
| root `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `eslint.config.js` | `package-boundaries.md`, `testing.md` | Treat as repo-wide changes. |

## Escalate When

- More than one package layer changes: read `.ai/context/package-boundaries.md`.
- CSS output can change: read `.ai/context/css-output.md`.
- Runtime, extraction, language, ESLint, compiler, or parser behavior changes: read `.ai/context/accuracy-guardrails.md`.
- Public docs or examples describe changed behavior: read `.ai/context/docs.md`.
- Rust ABI, generated protocol, or parity evidence changes: read `.ai/context/rust-routing.md` and run codegen/parity checks.
