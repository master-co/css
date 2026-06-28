# Package Routing Pack

Use this after `.ai/context/index.md` when a task names files, paths, packages, or a diff. The goal is to choose package-local context without scanning the whole repository.

## Route Order

1. Match changed or referenced paths below.
2. Read each affected workspace `package.json`.
3. Read each affected package-local `AI.md`, if present.
4. Read the task pack from `.ai/context/index.md`.
5. Escalate through `.ai/context/accuracy-guardrails.md` when the path touches high-risk behavior.

When a task spans multiple paths, load the lowest owning package for each path and then read `.ai/context/package-boundaries.md` if behavior crosses package layers.

## Package Paths

For `packages/<name>/**`, read `packages/<name>/package.json` and `packages/<name>/AI.md`.

| Path | Package | Common extra pack |
|---|---|---|
| `packages/schema/**` | `@master/css-schema` | `package-boundaries.md` |
| `packages/lexer/**` | `@master/css-lexer` | `package-boundaries.md` |
| `packages/source/**` | `@master/css-source` | `package-boundaries.md`, `testing.md` |
| `packages/engine/**` | `@master/css-engine` | `css-output.md`, `performance.md` |
| `packages/preset/**` | `@master/css-preset` | `css-output.md` |
| `packages/facade/**` | `@master/css` | `package-boundaries.md`, `css-output.md` |
| `packages/compiler/**` | `@master/css-compiler` | `css-output.md`, `package-boundaries.md` |
| `packages/project/**` | `@master/css-project` | `package-boundaries.md` |
| `packages/integration/**` | `@master/css-integration` | `package-boundaries.md` |
| `packages/stylesheet/**` | `@master/css-stylesheet` | `css-output.md`, `package-boundaries.md` |
| `packages/runtime/**` | `@master/css-runtime` | `css-output.md`, `performance.md` |
| `packages/server/**` | `@master/css-server` | `css-output.md` |
| `packages/scanner/**` | `@master/css-scanner` | `testing.md`, `css-output.md` |
| `packages/validator/**` | `@master/css-validator` | `testing.md`, `css-output.md` |
| `packages/lint/**` | `@master/css-lint` | `testing.md`, `package-boundaries.md` |
| `packages/language*/**`, `packages/vscode/**` | language tooling | `testing.md` |
| `packages/eslint-*/**` | ESLint tooling | `testing.md` |
| `packages/vite/**`, `packages/webpack/**`, `packages/next/**` | build integrations | `package-boundaries.md`, `css-output.md` |
| `packages/astro/**`, `packages/nuxt/**`, `packages/react/**`, `packages/vue/**`, `packages/svelte/**` | framework integrations | `testing.md`, `css-output.md` |
| `packages/cli/**` | CLI | `testing.md`, `package-boundaries.md` |
| `packages/devtools-hook/**`, `packages/figma/**` | app/plugin surfaces | `testing.md` |

## Root And Workspace Paths

| Path | Read | Notes |
|---|---|---|
| `site/**` | `site/package.json`, `site/AI.md`, `docs.md` | Public docs and site behavior. |
| `examples/<framework>/**` | example `package.json`, matching integration package `AI.md` when one exists | Map `astro`, `next.js`, `nuxt.js`, `react`, `svelte`, `vite`, `vue.js`, `webpack`, and `eslint*` to their package peers; use `docs.md` for content-only examples. |
| `benchmarks/**` | `benchmarks/package.json`, `performance.md` | Do not commit benchmark history output. |
| `internal/**` | `internal/package.json`, `site/AI.md` when used by site | Internal site support, not public package API. |
| `shared/**` | `shared/package.json`, `package-boundaries.md` | Repo-internal test/build support only. |
| `.github/prompts/**`, `AGENTS.md`, `CLAUDE.md`, `.ai/**` | `docs.md` | AI-facing docs and prompt routing. |
| `.github/workflows/**`, release config, lockfiles | `accuracy-guardrails.md` | Do not modify unless explicitly requested. |
| root `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `eslint.config.js` | `package-boundaries.md`, `testing.md` | Treat as repo-wide changes. |

## Escalate When

- More than one package layer changes: read `.ai/context/package-boundaries.md`.
- CSS output can change: read `.ai/context/css-output.md`.
- Runtime, extraction, language, ESLint, compiler, or parser behavior changes: read `.ai/context/accuracy-guardrails.md`.
- Public docs or examples describe changed behavior: read `.ai/context/docs.md`.
