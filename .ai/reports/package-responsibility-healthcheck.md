# Package Responsibility Healthcheck

Date: 2026-07-01

## Summary

This pass checked every package under `packages/*` that has a `package.json` against the package responsibility docs, package-local `AI.md` files, public exports, production dependencies, and source-level workspace imports.

The current production dependency graph has no workspace package cycles. This report records the package responsibility review and the stale AI-facing package-map corrections from that pass.

## Changes Landed

- Updated `.ai/package-map.md` so public entry points match package `exports`, including `@master/css.next`, `@master/css-mcp`, `@master/css-engine/inspect`, `@master/css-project/workspace`, browser/service subpaths, and removal of the obsolete `@master/css-integration/runtime` entry.
- Updated `packages/project/AI.md` to list `./workspace` as an explicit public subpath.

## Findings

- Source-of-truth drift existed in `.ai/package-map.md`.
  Public entry points were missing or stale for `@master/css-engine`, `@master/css-preset`, `@master/css-compiler`, `@master/css-stylesheet`, `@master/css.vite`, `@master/css.next`, `@master/css.astro`, `@master/css-language-service`, `@master/css-language-server`, `@master/css-validator`, `@master/css-project`, and `@master/css-mcp`. `@master/css-integration` also documented an obsolete `./runtime` export.

- `@master/css-project/workspace` was a real public API but missing from the package-local public-surface notes.
  It is consumed by MCP, language-server, and VS Code packages. `packages/project/AI.md` now documents the subpath and key file.

- No hard production dependency direction violations were found after normalizing the docs.

- No production workspace dependency cycles were found.
  The review covered `dependencies` and `peerDependencies`, while ignoring `devDependencies`.

## Watchlist

- `@master/css-stylesheet` still has a `devDependency` on `@master/css-scanner`.
  This is acceptable for tests, but production code must continue to accept structural scanner state instead of importing scanner state directly.

- `@master/css-runtime` has dev-only links to compiler and integration packages.
  Current runtime source value imports stay on engine, preset, and schema. Future runtime changes should keep compiler/integration/tooling helpers out of runtime-covered source.

- `@master/css-integration/src/manifest-facade.ts` generates strings that contain Node imports for Node/universal facade modules.
  The browser-safe package code itself must not import `node:*`, use `Buffer`, or read `process`; generated strings should be reviewed separately from actual browser-safe subpath code.

- `@master/css.figma` and `master-css-vscode` are bundled app/plugin surfaces.
  Their source imports workspace packages through dev-time bundling, so the source-import dependency check explicitly exempts them. If either package stops bundling these imports, move the needed workspace packages to production dependencies and remove the exemption.

## Coverage Note

This report is historical. CI no longer runs the AI governance checks described in the original review; package ownership expectations remain documented in `AGENTS.md`, `.ai/context/package-boundaries.md`, and package-local `AI.md` files.
