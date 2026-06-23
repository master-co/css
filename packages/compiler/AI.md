# AI Notes For `@master/css-compiler`

## Responsibility

`@master/css-compiler` is the canonical CSS source compiler for Master CSS. It parses Master CSS stylesheet directives and native CSS, resolves CSS import graphs, detects project entry markers, parses standalone extraction directives, and lowers CSS-first authoring into `MasterCSSManifest` values.

## Owns

- CSS directive parsing and lowering for `@settings`, `@theme`, `@custom-variant`, managed `@defaults`, `@components`, and `@utilities`.
- CSS import graph resolution through `compileCSSFile()`.
- `compileProjectManifest()` for project entry CSS files.
- Native CSS output with consumed Master directives removed.
- Shared directive data and dependency reporting for lower-level consumers.

## Does Not Own

- Runtime class execution; use the manifest-driven engine.
- Project entry discovery; use `@master/css-project`.
- Build or framework lifecycle behavior.
- PostCSS reintroduction.
- Unrelated `.css` source scanning for class usage.

## Public Surface

- Root compiler APIs.
- `./browser` APIs.
- Manifest APIs used by project loading and integrations.

## Key Files

- `src/core.ts`
- `src/index.ts`
- `src/master-css-manifest.ts`
- `src/lower-css-directives.ts`
- `src/css-transform.ts`
- `src/native-declaration.ts`

## Risk Areas

- `@master;` and `@import "@master/css"` are equivalent user project entry markers; package CSS files must not contain `@master;`.
- Defining components, utilities, variables, variants, or animations does not emit CSS by itself; classes still need use or extraction.
- Directive syntax changes may require language token updates and docs updates.
- Native `@layer` blocks are not compiler-managed; use managed directives for generated definitions.
- Top-level native `@keyframes` remain native CSS unless placed inside an appropriate `@theme` block.

## Safe Changes

- Focused directive parsing or lowering fixes with compiler tests.
- CSS import dependency reporting fixes.
- CSS-first migration coverage for former core behavior.

## Dangerous Changes

- Recreating old JS Config behavior in the compiler.
- Moving engine matching or runtime behavior here.
- Expanding directive syntax without tests and directive guide updates.
- Scanning unrelated CSS files for class usage in this package.

## Validation

```sh
pnpm --filter @master/css-compiler test
pnpm --filter @master/css-compiler lint
pnpm --filter @master/css-compiler type-check
pnpm --filter @master/css-compiler build
```

## Directive Notes

Managed definition directives use first-level bare names, not selectors. Put selector states and descendants in nested selectors inside the named block. `@compose` is allowed in managed class definitions and native style rules, including inside `@variant`. If directive syntax, semantics, lowering, or extraction changes, update `site/app/[locale]/guide/directives/content.mdx`.
