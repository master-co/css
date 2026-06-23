# AI Notes For `@master/css-stylesheet`

## Responsibility

`@master/css-stylesheet` owns the stylesheet entry pipeline for static rendering. It detects Master CSS stylesheet entries, resolves stylesheet import graphs, compiles CSS-first directives, registers stylesheet sources, prunes native CSS using scanner state, and composes final CSS plus runtime emittedGlobals variable/keyframe counts.

## Inputs And Outputs

- Input: stylesheet ids/source text, project root, optional compile options, `StyleCSSSources`, and structural scanner state from packages such as `@master/css-scanner`.
- Output: transformed local CSS, stylesheet source records, stylesheet-local manifests, final CSS text, emittedGlobals data, and stylesheet dependencies.

## Public APIs

- Style request and entry helpers such as `isStyleCSSRequest`, `resolveMasterStyleSource`, and `createStyleCSSHostSource`.
- Local CSS directive lowering helpers such as `transformLocalStyleCSS`.
- Static rendering helpers such as `registerStyleCSSSource`, `createStyleCSSManifest`, `createExtractedCSSResult`, and `createExtractedCSS`.
- Extraction directive helpers from `./directives`.

## Boundaries

- Do not depend on `@master/css-scanner`; accept structural state instead.
- Do not scan source files directly except when resolving stylesheet `@source` directives through supplied include/exclude options.
- Do not own source adapters or source candidate extraction; use `@master/css-source` when stylesheet source directives need source file candidates.
- Do not own project CSS manifest discovery; callers should use `@master/css-project`.
- Do not change engine CSS output here without focused tests and an explicit CSS output explanation.

## Required Tests

```sh
pnpm --filter @master/css-stylesheet test
pnpm --filter @master/css-stylesheet type-check
pnpm --filter @master/css-stylesheet build
pnpm --filter @master/css-stylesheet lint
```

Add focused tests for stylesheet entry detection, import graph handling, local `@compose`/`@reference` lowering, extraction directives, native CSS pruning, generated CSS composition, and emittedGlobals manifest output.
