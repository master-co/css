# AI Notes For `@master/css-stylesheet`

## Responsibility

`@master/css-stylesheet` owns the stylesheet entry pipeline for static rendering.

## Owns

- Master CSS stylesheet entry detection.
- Stylesheet import graph handling through compiler results.
- CSS-first directive compilation for stylesheet entries.
- Local CSS transforms, native CSS pruning, generated CSS composition, and emittedGlobals output.
- Extraction directive helpers from `./directives`.

## Does Not Own

- Source scanner state; accept structural scanner state instead of depending on `@master/css-scanner`.
- Raw source adapters or class candidate extraction; use `@master/css-source` when needed.
- Project CSS manifest discovery; callers should use `@master/css-project`.
- Engine CSS output semantics.

## Public Surface

- Style request and entry helpers.
- Local CSS directive lowering helpers.
- Static rendering helpers such as `createExtractedCSSResult` and `createExtractedCSS`.
- `./browser`
- `./directives`

## Key Files

- `src/index.ts`
- `src/browser.ts`
- `src/directives.ts`
- `src/render.ts`
- `src/class-exclusion.ts`

## Risk Areas

- Native CSS pruning and source directives.
- Generated CSS ordering and emittedGlobals counts.
- Local `@compose` and `@reference` lowering.
- Entry detection and import graph dependencies.
- Cross-package consumers in Vite, Webpack, Next, and CLI.

## Safe Changes

- Focused stylesheet entry or transform fixes with tests.
- Extraction directive tests.
- Native CSS pruning and generated CSS composition fixtures.

## Dangerous Changes

- Depending directly on `@master/css-scanner`.
- Scanning arbitrary source files directly outside supplied `@source` options.
- Changing engine CSS output here without focused tests and explanation.
- Duplicating project manifest discovery.

## Validation

```sh
pnpm --filter @master/css-stylesheet test
pnpm --filter @master/css-stylesheet lint
pnpm --filter @master/css-stylesheet type-check
pnpm --filter @master/css-stylesheet build
```
