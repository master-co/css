# AI Notes For `@master/css-scanner`

## Responsibility

`@master/css-scanner` statically scans source files, validates possible Master CSS classes, inserts valid rules through engine layers, and maintains scanner state for build integrations.

## Owns

- `CSSScanner` state and options.
- Valid, invalid, and latent class caches.
- Generated CSS scanner state events.
- Integration-facing scanner reset and insertion behavior.

## Does Not Own

- Source-format-aware adapters or raw candidate extraction; use `@master/css-source`.
- File watching, output writing, and build lifecycle orchestration.
- Stylesheet entry handling, CSS-first stylesheet compilation, native CSS pruning, extraction directives, generated CSS composition, or emittedGlobals manifest output; use `@master/css-stylesheet`.
- Project manifest discovery, workspace detection, or manifest loading; callers should use `@master/css-project`.

## Public Surface

- `CSSScanner`
- `scannerOptions`
- `ScannerOptions`
- `./options`

## Key Files

- `src/core.ts`
- `src/options/index.ts`
- `src/index.ts`

## Risk Areas

- Built-in source adapter behavior from `@master/css-source`.
- `extractClassCandidates()` false positives and false negatives in `@master/css-source`.
- `invalidClasses` and `validClasses` cache behavior.
- Reset loops from integration-managed dependencies.
- Module exclude matching.
- Vite/Webpack/Next virtual-module consumers.

## Safe Changes

- Focused scanning heuristic fixes.
- Manifest reset and option handling fixes with tests.
- Scanner state behavior fixes used by Vite, Webpack, Next, stylesheet, and CLI integrations.

## Dangerous Changes

- Assuming dynamically concatenated classes are statically knowable.
- Broadly loosening extraction filters without false-positive tests.
- Scanning CSS files by default.
- Treating every quoted string as a valid class without validator filtering.
- Adding independent CSS import graph parsing here.

## Validation

```sh
pnpm --filter @master/css-scanner test
pnpm --filter @master/css-scanner lint
pnpm --filter @master/css-scanner type-check
pnpm --filter @master/css-scanner build
```

Use or extend `tests/extract.test.ts`, `tests/syntax.test.ts`, and `tests/source`.
