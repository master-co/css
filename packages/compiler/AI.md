# AI Notes For `@master/css-compiler`

## Responsibility

`@master/css-compiler` is the consolidated TypeScript host for the canonical Rust compiler and project crates. It owns compiler sessions, project resolution, managed stylesheet composition, and complete project inspection orchestration.

## Owns

- CSS directive parsing and lowering for `@theme`, `@custom-media`, `@utility`, `@mixin`, `@apply` and `@contents`.
- Provider-neutral CSS import graph semantics; TypeScript supplies Node package exports and file contents.
- `compileProjectManifest()` for project entry CSS files.
- Native CSS output with consumed Master directives removed.
- Shared directive data and dependency reporting for lower-level consumers.
- Project entry discovery, manifest loading, sync loading, and workspace package resolution under `./project`.
- Managed stylesheet registration, extraction policy, native CSS pruning, and generated CSS composition under `./stylesheet`.
- Complete project inspection reports under `./diagnostics`.

## Does Not Own

- Runtime class execution; use the manifest-driven engine.
- Build or framework lifecycle behavior.
- PostCSS reintroduction.
- Unrelated `.css` source scanning for class usage.

## Public Surface

- Universal root async compiler sessions.
- Native-only `./node` sync session, including `resolveStylesheetDependenciesSync`
  for immutable complete import edges and files without CSS lowering or flattening.
  Use this for build-cache evidence; classification-only resolution omits package CSS.
- Async Node project APIs under `./project` and sync variants under `./project/sync`.
- Node stylesheet orchestration under `./stylesheet`.
- Wasm-only stylesheet compilation under `./stylesheet/browser`.
- Node project inspection under `./diagnostics`.

## Key Files

- `src/index.ts`
- `src/session.ts`
- `src/node.ts`
- `src/browser.ts`
- `src/project/*`
- `src/stylesheet/*`
- `src/stylesheet/types.ts`
- `src/diagnostics/index.ts`
- `crates/mastercss-compiler/src/directives.rs`
- `crates/mastercss-compiler/src/manifest/*`
- `crates/mastercss-compiler/src/lower/*`

## Risk Areas

- `@import "@master/css"` is the only project entry form and loads the full native preset; `@master entry` is rejected.
- Native defaults/components use CSS layers and ship by default. Utilities require use or extraction; theme tokens retain ordered defaults and transitive references; static tokens are unconditional roots. Keyframes follow the declaring file’s native preservation/pruning policy.
- Directive syntax changes may require language token updates and docs updates.
- Native `@layer` blocks are not compiler-managed; use managed directives for generated definitions.
- `@theme` accepts only direct tokens, with optional static/inline modifiers. Tokens use `:root,:host`; native selectors and conditions stay outside the block and do not register utility tokens. Preserve repeated declarations and track dependencies after one-pass inline substitution. Static roots survive class removal; reference-only static definitions are not output roots.
- Native keyframes retain containers, layers, order and each import occurrence. Preserve every same-name definition by ID. `@safelist keyframes` retains exact decoded names. Dynamic names retain all candidate definitions. Metadata-only compilation must keep definitions; delivery suppression is separate. Pruned rules, reference-only styles and unused mixins are not roots.

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
- Reintroducing separate public project, stylesheet, or diagnostics packages.

## Validation

```sh
pnpm --filter @master/css-compiler test
pnpm --filter @master/css-compiler lint
pnpm --filter @master/css-compiler type-check
pnpm --filter @master/css-compiler build
```

## Directive Notes

Top-level unconditional `@utility name`, `@utility prefix-(--namespace)` and `@utility name(...)` independently register static, token and functional classes. Token registrations use form, decoded prefix and namespace as identity; later definitions replace the entire same branch. Static and function registrations use form and name. Shared prefixes select a unique namespace by token key before modifier checks; ambiguous keys report AMBIGUOUS_TOKEN without CSS. Native `@mixin --name(...)` definitions form a separate registry and do not register classes. `@apply --name(...)` calls only mixins, never class lists. Rust engine expansion is shared by class generation and native CSS lowering. Contents blocks retain caller parameter bindings; fallbacks use the defining mixin scope. Preserve ordered declarations, duplicates, source positions and URL owners. Supported types are untyped, `<integer>`, `<number>`, `<string>` and `<custom-ident>`; typed numbers are literals. Fold static `ident()` after lexical parameter binding; apply one-pass inline theme substitution to generated values while preserving handwritten native `var()` references. Reject dynamic arguments, cross-element parameter uses, prelude interpolation, recursive calls, `@private` and nested registration. `from()`, `--master-value()`, `@defaults`, `@components` and `@compose` are removed. Native defaults/components use `@layer`. Changes must update `site/app/[locale]/guide/directives/contract.mdx`.

Named conditions use `@custom-media`; selector and other conditional wrappers use the same mixin IR with optional `Apply.contents` and `Contents.fallback`. Omitted and empty contents differ. Class `@apply(--name(...))` wraps a single utility class once, leftmost suffix outermost. `@starting-style` and `@layer(base|defaults|components|utilities)` are engine built-ins. Layer placement stays at the call site. Removed variant directives and executable manifest indexes are rejected.
