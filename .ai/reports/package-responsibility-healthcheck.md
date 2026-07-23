# Package Responsibility Healthcheck

Date: 2026-07-23

## Outcome

The post-Rust package graph has one public owner for each responsibility and no
published compatibility packages for the retired TypeScript boundaries. The
canonical package map is `.ai/package-map.md`; this report records the decisions
that the automated package checks enforce.

## Public ownership

| Responsibility | Owner |
| --- | --- |
| Runtime class-to-CSS engine and public CSS facade | `@master/css` |
| Default CSS source and compiled preset manifest | `@master/css-preset` |
| Directives, stylesheet rendering, project/workspace compilation, compiler diagnostics | `@master/css-compiler` |
| Lexing, source extraction, scanning, validation, lint primitives, language IR, tooling diagnostics | `@master/css-tooling` |
| Browser runtime | `@master/css-runtime` |
| Server rendering | `@master/css-server` |
| Editor features and Shiki/TextMate presentation | `@master/css-language-service` |
| LSP transport and workspace lifecycle | `@master/css-language-server` |
| ESLint rules and flat config | `@master/eslint-plugin-css` |
| Official build/framework adapters | `@master/css-vite`, `@master/css-webpack`, `@master/css-next`, `@master/css-nuxt`, `@master/css-astro`, `@master/css-svelte` |
| Host applications | `@master/css-cli`, `@master/css-mcp`, `@master/create-css`, `@master/css-figma`, `@master/css-vscode` |
| Public contracts, backend broker, native/Wasm artifacts | `@master/css-schema`, `@master/css-backend`, `@master/css-wasm-*` |

## Retired boundaries

The former diagnostics, engine, facade, language, lexer, lint, project, scanner,
source, stylesheet, and validator package directories are retired. Their public
responsibilities moved to the owners above; their package names, directories,
dependency edges, and compatibility exports must not return.

The adapter-neutral integration implementation is now the repository-private
`@master/css-internal`. Official build, framework, editor, and tooling hosts bundle
it. It is not a published dependency, third-party adapter SPI, or generic shared
utility package.

## Standardized contracts

- Official adapters use hyphenated npm names; dotted package identities are retired.
- The npm package is `@master/css-vscode`; the VS Code Marketplace extension ID
  remains `master-css-vscode` because that ID is controlled by the marketplace.
- First-party workspace dependencies use `workspace:*`, producing exact lockstep
  published versions.
- Public JavaScript packages are ESM with the Node 24 baseline. Native target
  artifacts remain CommonJS because they are platform loader payloads.
- Every public package declares explicit `exports`, a publish allowlist,
  provenance, side-effect metadata where applicable, and TypeScript declarations
  where the surface has a TypeScript API.
- Pure re-export modules are limited to intentional facades, public subpaths,
  generated loaders, CSS entrypoints, and configuration presets.

## Enforcement

- `pnpm check:packages` validates package identities, retired directories,
  lockstep dependency ranges, module/engine/export metadata, the consolidated
  ESLint config, and private integration bundling.
- `pnpm check:boundaries` validates the Rust semantic core and package dependency
  direction.
- `pnpm build` materializes public artifacts.
- `pnpm check:artifacts` verifies every concrete export target and scans publish
  allowlists for private or retired package specifiers.

## Watchlist

- Syntax, directive, and emitted CSS bytes remain compatibility constraints even
  though JavaScript APIs may break.
- Browser/runtime entrypoints must not absorb build-only or editor-only helpers.
- New shared behavior belongs in the lowest dependency-light owner rather than a
  new one-function package.
- New framework adapters are first-party products; do not expose a public generic
  adapter registration protocol.
