# Package Responsibility Healthcheck

Date: 2026-07-01

## Summary

This pass checked every package under `packages/*` that has a `package.json` against the package responsibility docs, package-local `AI.md` files, public exports, production dependencies, and source-level workspace imports.

The current production dependency graph has no workspace package cycles. After correcting stale AI-facing package-map entries, the automated boundary check passes and now guards the highest-risk ownership rules.

## Changes Landed

- Added `.ai/scripts/validate-package-boundaries.test.js`, `.ai/scripts/package-boundary-rules.js`, and root script `pnpm test:package-boundaries`.
- Wired `pnpm test:package-boundaries` into root `pnpm check`.
- Updated `.ai/package-map.md` so public entry points match package `exports`, including `@master/css.next`, `@master/css-mcp`, `@master/css-engine/inspect`, `@master/css-project/workspace`, browser/service subpaths, and removal of the obsolete `@master/css-integration/runtime` entry.
- Updated `packages/project/AI.md` to list `./workspace` as an explicit public subpath.

## Findings

- Source-of-truth drift existed in `.ai/package-map.md`.
  Public entry points were missing or stale for `@master/css-engine`, `@master/css-preset`, `@master/css-compiler`, `@master/css-stylesheet`, `@master/css.vite`, `@master/css.next`, `@master/css.astro`, `@master/css-language-service`, `@master/css-language-server`, `@master/css-validator`, `@master/css-project`, and `@master/css-mcp`. `@master/css-integration` also documented an obsolete `./runtime` export. This is fixed in this change and is now covered by automation.

- `@master/css-project/workspace` was a real public API but missing from the package-local public-surface notes.
  It is consumed by MCP, language-server, and VS Code packages. `packages/project/AI.md` now documents the subpath and key file.

- No hard production dependency direction violations were found after normalizing the docs.
  The new check verifies strict low-layer dependency allowlists for schema, lexer, preset, source, engine, compiler, project, integration, runtime, stylesheet, validator, server, scanner, lint, and diagnostics.

- No production workspace dependency cycles were found.
  The automated graph check covers `dependencies` and `peerDependencies`, while ignoring `devDependencies`.

## Watchlist

- `@master/css-stylesheet` still has a `devDependency` on `@master/css-scanner`.
  This is acceptable for tests, but production code must continue to accept structural scanner state instead of importing scanner state directly.

- `@master/css-runtime` has dev-only links to compiler and integration packages.
  Current runtime source value imports stay on engine, preset, and schema. Future runtime changes should keep compiler/integration/tooling helpers out of runtime-covered source.

- `@master/css-integration/src/manifest-facade.ts` generates strings that contain Node imports for Node/universal facade modules.
  The browser-safe package code itself must not import `node:*`, use `Buffer`, or read `process`. The automated check strips generated strings and validates actual browser-safe subpath code.

- `@master/css.figma` and `master-css-vscode` are bundled app/plugin surfaces.
  Their source imports workspace packages through dev-time bundling, so the source-import dependency check explicitly exempts them. If either package stops bundling these imports, move the needed workspace packages to production dependencies and remove the exemption.

## Automated Coverage

`pnpm test:package-boundaries` now checks:

- package-map public entry points against `package.json` exports;
- package-local `AI.md` responsibility section presence;
- strict production dependency allowlists and forbidden edges;
- production workspace dependency cycles;
- source value imports that rely on workspace packages not declared in production dependencies;
- focused runtime and stylesheet source import boundaries;
- browser-safe `@master/css-integration` subpaths for real Node-only imports/globals.

This is intentionally a governance check, not a semantic CSS-output check. CSS output, compiler/runtime behavior, extraction behavior, and integration mode changes still require package-local focused tests.
