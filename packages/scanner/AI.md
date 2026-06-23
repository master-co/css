# AI Notes For `@master/css-scanner`

## Responsibility

`@master/css-scanner` statically scans source files, validates possible Master CSS classes, inserts valid rules through the manifest-driven engine layers, exports CSS, and maintains scanner state for build integrations. Source-format-aware class adapters and raw class candidate extraction belong to `@master/css-source`. Stylesheet entry handling, CSS-first stylesheet compilation, native CSS pruning, extraction directives, generated CSS composition, and emittedGlobals manifest output belong to `@master/css-stylesheet`.

## Inputs And Outputs

- Input: scanner options, source globs, source text, source adapters, and resolved Master CSS manifest.
- Output: `css.text`, exported CSS file, valid/invalid/latent class caches, native class usage state, and watch events.

## Public APIs

- `CSSScanner`
- `scannerOptions`
- `ScannerOptions`

## Core Files

- `src/core.ts`
- `src/options/index.ts`

## Allowed Changes

- Focused scanning heuristic fixes.
- Watch/manifest reset fixes.
- Option handling fixes with tests.
- Focused scanner state behavior used by Vite, Webpack, Next, stylesheet, and CLI integrations.

## Forbidden Without Explicit Request

- Assuming dynamically concatenated classes are statically knowable.
- Broadly loosening extraction filters without false-positive tests.
- Changing default include/exclude patterns casually.

## Risk Areas

- Built-in source adapter behavior from `@master/css-source`.
- `extractClassCandidates()` false positives and false negatives in `@master/css-source`.
- `invalidClasses` and `validClasses` cache behavior.
- Watch reset loops.
- Source allow/exclude matching.
- Vite/Webpack/Next virtual-module consumers.
- Stylesheet native CSS merging, pruning/source directives, and generated CSS ordering belong in `@master/css-stylesheet`.
- Do not add project manifest discovery, workspace detection, or manifest loading here; use `@master/css-project` in the calling CLI/build/tooling package.
- Do not add independent CSS import graph parsing here; use compiler results and keep extraction-specific decisions local.

## Required Tests

```sh
pnpm --filter @master/css-scanner test
pnpm --filter @master/css-scanner type-check
pnpm --filter @master/css-scanner build
```

Use or extend:

- `tests/extract.test.ts`
- `tests/syntax.test.ts`
- `tests/source`

## Good Changes

- Add a failing source snippet and assert extracted latent classes.
- Fix an exclusion case without reducing valid class detection.

## Dangerous Changes

- Scanning CSS files by default.
- Treating every quoted string as a valid class without validator filtering.
- Removing validation before insertion.
