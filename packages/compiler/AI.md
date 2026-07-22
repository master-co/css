# AI Notes For `@master/css-compiler`

## Responsibility

`@master/css-compiler` is the TypeScript session/provider shell for the canonical Rust CSS source compiler. Rust parses directives and native CSS, consumes provider-neutral import graphs, detects entry markers, handles extraction directives, and lowers CSS-first authoring into `MasterCSSManifest` values.

## Owns

- CSS directive parsing and lowering for `@settings`, `@theme`, `@custom-variant`, managed `@defaults`, `@components`, and `@utilities`.
- Provider-neutral CSS import graph semantics; TypeScript supplies Node package exports and file contents.
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

- Root async session and Node file/provider helpers.
- Native-only `./node` session.
- Compiler-Wasm-only `./browser` session.
- Manifest APIs used by project loading and integrations.

## Key Files

- `src/index.ts`
- `src/session.ts`
- `src/node.ts`
- `src/browser.ts`
- `crates/mastercss-compiler/src/lib.rs`
- `crates/mastercss-compiler/src/lower.rs`

## Risk Areas

- `@master entry;` and `@import "@master/css"` are equivalent user project entry markers; package CSS files must not contain `@master entry;`.
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
- Adding a TypeScript directive/parser/lowering/CSS transform fallback.

## Validation

```sh
pnpm --filter @master/css-compiler test
pnpm --filter @master/css-compiler lint
pnpm --filter @master/css-compiler type-check
pnpm --filter @master/css-compiler build
```

## Directive Notes

Managed definition directives use first-level bare names, not selectors. Put selector states and descendants in nested selectors inside the named block. `@compose` is allowed in managed class definitions and native style rules, including inside `@variant`. If directive syntax, semantics, lowering, or extraction changes, update `site/app/[locale]/guide/directives/content.mdx`.
