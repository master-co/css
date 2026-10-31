# Architecture simplification

Audit and refactor record, 2026-11-01. Baseline: `0e8e81af8`.

The audit traced how a stylesheet becomes CSS: per-file directive compilation, graph
lowering, Manifest v6, the runtime program, engine sessions, and the TypeScript hosts
that deliver the result. It looked for abstractions that only re-express data, work
repeated for no new result, and mechanisms whose cost exceeds the problem they solve.

## Findings

### 1. Native keyframe slots (removed)

Every native `@keyframes`, preserved or pruned, was extracted into the manifest and
replaced in delivered CSS by an always-true wrapper:

```css
@media only all,(master-css-keyframe-k457…-00000000){:not(*){--master-css-slot:0}@keyframes spin{…}}
```

The mechanism existed to let the runtime insert pruned keyframes back at their
authored CSSOM position. It required:

- placeholder at-rules, slot IDs, occurrences and owner IDs in the manifest;
- `url()` values copied into dummy custom properties so bundlers rewrite them, then
  read back from the CSSOM;
- engine state for slots, stylesheet templates and suppressed definitions, mirrored in
  the JavaScript engine;
- a `.master-css.json` sidecar for every runtime CSS asset, a runtime that fetched
  them, replaced `<link>` elements with writable `<style>` elements and blob URLs, and
  walked every stylesheet's CSSOM;
- per-page CSS publishing in the server (`stylesheetImportSource`) and Next, Vite,
  Webpack, Astro and Nuxt delivery plumbing, plus a Turbopack selector workaround and
  a minifier workaround.

Measured: unused keyframes still left wrappers in production CSS, URLs of unused
keyframes were still bundled, and preserved keyframes were duplicated into every
manifest with absolute source paths. The original change grew runtime JavaScript by
19%.

Keyframes are now modelled like tokens:

- Without a pruning policy they are native CSS, in place and verbatim, and engines
  never emit them. They stay in the manifest (`native: true`) for references and
  tooling; a use roots the tokens their frames read.
- `@prune native` makes them on-demand definitions: they leave native output and the
  engine whose output uses one emits it with the generated CSS, wrapped in the
  conditional and layer rules it was declared in.
- Definitions from a base or reference manifest are on demand in a stylesheet that
  does not deliver them. Emitted globals list keyframes an output already delivers, by
  definition ID; native ones are detected by their verbatim text, so no marker is
  needed.
- An anonymous layer cannot be re-entered and relative URLs only resolve beside their
  stylesheet, so on-demand keyframes in either are compilation errors.

### 2. Repeated manifest compilation and engine sessions (removed)

| Path | Manifest compilations | Engine sessions |
|---|---|---|
| Graph compile, before | `2 + Ref + 2S` | `2 + S + K·(1 + S + R)` |
| Graph compile, after | `1 + Ref` | `1`, plus `1` when a sheet may declare animations |
| Single-file lowering, before | up to 4 | up to 6 |
| Single-file lowering, after | `1 + Ref` | `1` |

`S` counts native rules with `@apply`, `R` reachable sheets, `K` whether keyframes
exist. Each per-slot lowering recompiled the same manifests and discarded its notices
and warnings; the graph also recompiled the resolution manifest it already had. Engine
expansion takes `&EngineSession`, so one session serves every slot.

### 3. Intermediate representations that only re-expressed data (removed)

- Style definitions carried conditions twice (`conditions` and a single-variant
  `condition_path` enum); they now carry one ordered `conditions` list.
- `Native.name` and `Native.layer` were always absent, which made the graph's
  "managed definition" pass always empty and its layer parameter unused.
- Branch resolution returned a vector of exactly one branch.
- `diagnostic_counts` was a constant, consumed by a TypeScript recorder nobody passed.
- `assemble_native_output` copied `output_edits` mapping arithmetic verbatim.

### 4. Runtime program carried the retired registry (removed)

Registered utilities encoded `keys`, `alias_groups`, `variable_aliases` (always
empty), `layer` (always utilities), `order` (always 0), `native_fallback` (always
false) and a `Key` matcher no registration produced. The program encoding, both
engines and the decoder verifier now omit them.

### 5. Duplicated or dead orchestration (removed)

- `xtask codegen` copied two hand-written TypeScript templates verbatim; they are
  ordinary sources now. Generated protocol files remain generated.
- The compiler duplicated workspace discovery that `@master/css-internal` owns, kept
  never-called helpers, nine unused session forwarders and an identity wrapper.

## Behavior and API changes

- CSS output: no slot wrappers or resource carriers. On-demand keyframes move from
  native output into the generated CSS of the output that uses them. Preserved native
  keyframes are printed verbatim, unchanged in position.
- Errors: on-demand keyframes in an anonymous layer, or with relative `url()`.
- `preserveNativeCSS: false` no longer suppresses on-demand keyframes.
- Manifest keyframes: `ownerId`, `slotId`, `occurrence`, `resources` and `retained`
  are removed; `native` and `safelisted` are added.
- Emitted globals: `keyframeSlots` and `suppressedKeyframes` are removed.
- Engine snapshot: `stylesheets` and keyframe `anchored` are removed; server render IR
  loses `stylesheetEdits`; compile results lose `suppressedKeyframes`.
- Runtime options `stylesheets` and `stylesheetDelivery` are removed. Server option
  `stylesheetImportSource` is removed; `stylesheets` take `{ href, css, imports }`.
- `@master/css-compiler/stylesheet`: `createRuntimeStylesheetAsset` is replaced by
  `describeLinkedStylesheet`. `@master/css-schema/runtime-style` keeps only
  `MASTER_CSS_RUNTIME_STYLE_ID`.
- Program version 2 and binding ABI 30. Manifests and hydration data compiled with
  the removed keyframe fields are rejected as unknown fields.

## Size

| Artifact | Before | After |
|---|---:|---:|
| `global.min.js` raw / brotli | 124,500 / 34,407 | 116,590 / 32,404 |
| Progressive critical path raw / brotli | 46,200 / 11,582 | 39,325 / 9,793 |
| `default-program.bin` raw / brotli | 59,888 / 12,239 | 59,501 / 12,194 |

Before values are the checked-in budget; after values are measured.

## Not changed

- Manifest assembly still manipulates `serde_json::Value`: variables are flattened and
  grouped by hand, name derivation is repeated, and `MasterCssManifest` validates by
  deserializing each section and discarding it. A typed manifest model in
  `mastercss-schema`, shared by compiler and engine, is the next refactor; it is a
  representation change with byte-identical output and belongs in its own change.
- Two parallel lowering finishers remain (single-file `NativeCssOutput` and graph
  slot edits), now sharing one renderer and engine.
- `@master/css-internal` barrel subpaths stay, as package exports need an explicit
  request.
- `site/tests/css-contract.snapshot.json` records the old wrappers. Updating it
  requires a reviewed `--qa-reference`.

## Validation

Rust workspace tests, Clippy, `cargo fmt --check`, `cargo xtask codegen --check` and
`cargo xtask parity` pass. The engine differential reports zero differences for the
default and a second seed. Package tests, lint and project-reference type checks pass;
runtime e2e passes in Chromium, Firefox and WebKit. Vite, Webpack, Next and Astro
on-demand keyframe tests cover runtime insertion, HMR, progressive pre-rendering and
hydration, and referenced definitions.
