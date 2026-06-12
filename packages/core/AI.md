# AI Notes For `@master/css`

## Responsibility

`@master/css` is the public facade. It re-exports the plan-driven engine API and the default preset plan/CSS entrypoints. It must not own Config resolution, utility matcher construction, declarers, transformers, or runtime authoring adapters.

## Inputs And Outputs

- Input: `MasterCSSPlan` for engine APIs, CSS files for CSS-first authoring.
- Output: `MasterCSS` engine instances, generated rules, CSS text, and preset CSS subpaths.

## Public APIs

The root export should stay narrow:

- `MasterCSS`
- `createCSS(plan, preloaded?)`
- `MasterCSSPlan` and runtime-safe engine types
- `defaultPlan`

Do not re-export `Config`, `UtilityDefinition`, `extendConfig`, old utility classes as public API, or `@master/css/config` / `@master/css/utils` subpaths.

## Tests

Core tests should only verify facade wiring. CSS output parity belongs in `@master/css-engine`; CSS directive and preset lowering belongs in `@master/css-compiler` or `@master/css-preset`.
