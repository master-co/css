# AI Notes For `@master/css-extractor`

## Responsibility

`@master/css-extractor` statically scans source files, extracts possible Master CSS classes, validates them, inserts valid rules into core layers, exports CSS, and provides extraction-specific stylesheet helpers for build integrations.

## Inputs And Outputs

- Input: extractor options, source globs, source text, resolved Master CSS config, stylesheet sources that import the Master CSS virtual module.
- Output: `css.text`, exported CSS file, valid/invalid/latent class caches, compiled native CSS, stylesheet-local Master CSS config, watch events.

## Public APIs

- `CSSExtractor`
- `options`
- `style`
- `extractLatentClasses`
- option types

## Core Files

- `src/core.ts`
- `src/style.ts`
- `src/functions/extract-latent-classes.ts`
- `src/options/index.ts`

## Allowed Changes

- Focused extraction heuristic fixes.
- Watch/config reset fixes.
- Option handling fixes with tests.
- Shared stylesheet extraction behavior used by Vite, Webpack, and Next integrations.

## Forbidden Without Explicit Request

- Assuming dynamically concatenated classes are statically knowable.
- Broadly loosening extraction filters without false-positive tests.
- Changing default include/exclude patterns casually.

## Risk Areas

- `extractLatentClasses()` false positives and false negatives.
- `invalidClasses` and `validClasses` cache behavior.
- Watch reset loops.
- Source allow/exclude matching.
- Vite/Webpack/Next virtual-module consumers.
- Stylesheet native CSS merging, shake/source directives, and generated CSS ordering.
- Do not add project config discovery, workspace detection, or config loading here; use `@master/css-configer` in the calling CLI/build/tooling package.

## Required Tests

```sh
pnpm --filter @master/css-extractor test
pnpm --filter @master/css-extractor type-check
pnpm --filter @master/css-extractor build
```

Use or extend:

- `tests/extract.test.ts`
- `tests/style.test.ts`
- `tests/syntax.test.ts`
- `tests/source`

## Good Changes

- Add a failing source snippet and assert extracted latent classes.
- Fix an exclusion case without reducing valid class detection.

## Dangerous Changes

- Scanning CSS files by default.
- Treating every quoted string as a valid class without validator filtering.
- Removing validation before insertion.
