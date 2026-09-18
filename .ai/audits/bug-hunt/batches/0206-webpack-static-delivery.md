# Batch 0206: Webpack production static delivery

Bounded production repair delivered for BH-0004; complete host coverage remains unfinished. BH-0061 also repaired for Webpack public getter declarations. Counts remain 61 historical / 57 fixed / 4 unresolved and 65 checked / 10 blocked. Goal stays active; prior goal turn was progress.

## Start and implementation

- Start from 0205: 569 source hashes and 471 live artifacts unchanged; HEAD `3b5c98d61c6dc69ee3546d9d4f822e9e835f308e`, empty index. AGENTS/routing/package AI and deeper CSS-output/data-flow/testing references were read before editing.
- Production static classification now uses the existing unflattened graph path in the style loader and plugin. Other modes retain their existing behavior and remain in the unfinished host matrix.
- The plugin's collection composes a complete delivery result, including stylesheets/resources/dependencies. Its private context transports that result to the asset hook.
- The new package-local `utils/build-stylesheet-delivery.ts` uses existing compiler/Rust bundle preparation and rendering. The asset hook publishes all returned fragments/resources beside the host CSS asset before Webpack's final content hashing. CSS semantics stay in the owning compiler; no selector/import semantic fallback.
- Registration records attempted resource dependencies even on failure. Successfully discovered dependencies are added to the active compilation after module processing and during asset publication.
- README describes production static CSS asset deployment. No directive grammar or compiler lowering change; the directive guide and foreign Site files remain untouched.

## Validation

| Check | Result |
|---|---|
| New real-build regressions against old delivered output | 4 FAIL: delivery/qualified-flatten errors |
| Same regressions against implementation and delivered output | 4 PASS each |
| Complete copied package suite, serialized | 78 PASS; repeated with normalized private-source topology, 78 PASS |
| Original bounded imported-entry matrix | 12 builds / 72 browser comparisons PASS |
| Original external-order/ordinary-before/ordinary-after matrix | 8 builds / 48 browser comparisons PASS |
| Nested output paths, relative/absolute/CDN publicPath | 36 builds / 216 browser comparisons PASS |
| Delivered original imported-entry matrix | 12 builds / 72 browser comparisons PASS |
| Package lint and type-check | PASS after final edits |
| Unmodified example in isolated copy, using candidate package | Build PASS; two existing warnings retained |
| Strict external TS6 public entry | Old output 6 errors; first candidate 7 errors; final staged and delivered PASS |
| Invalid public option negative type control | Correctly rejected |
| All public local declaration closures | 0 affected packages |
| Root API census | Existing FAIL; output byte-identical to 0200 |
| Context/source budgets and authored whitespace | PASS in final checks |

Browser checks use Chromium/Firefox/WebKit, screen/print, independently served original CSS and locally intercepted external imports. Staged browser total is 336 observations; repeated delivered controls are reported separately, not as new coverage. No external network service was contacted.

The four new tests exercise actual Webpack native CSS builds with hashed JS/CSS in separate directories. They verify child import publication and file dependencies, stable repeated output, entry hash changes after child CSS edits, resource-dependent hash changes, exact emitted SVG bytes, query/fragment retention and stale resource removal between clean rebuilds. They do not prove watch/HMR behavior.

## BH-0061: public getter declarations

The old Webpack declaration exposed repository `~/packages/tooling/...` type paths. A fresh isolated build instead inferred unexported `@master/css-tooling/scanner/core` and `/options` subpaths. Both fail outside workspace aliases; this was an existing published-type issue, not a new runtime failure.

Seven getters now explicitly return `MasterCSSScanner['property']` through the already public scanner class. No shared build-rule changes or new dependencies. All 29 JS files are byte-identical before/after these annotations. The original binding/tooling/LSP/MCP BH-0061 fixes remain in place; the finding ID is retained.

## Isolation and delivery

- Initial isolated builds bundled private source under relative `dist/Users/...` paths because root TS aliases resolved original workspace sources. They had complete local import closure but differed from normal package layout. These strings were relative internal paths, not absolute runtime imports.
- A second isolated build copied private internal/schema/preset sources and mapped root source aliases to those copies. This restored normal bundled paths and kept all 38 unrelated original Webpack artifacts byte-identical. No shared build configuration was changed.
- One command used a placeholder working directory and failed before process creation; corrected using the recorded directory. This is a harness invocation error, not a build/product failure.
- Full-directory atomic `RENAME_SWAP` delivered 49 Webpack artifacts: 9 existing files changed, 2 helper files added, none removed. The other 424 package/native/Wasm/runtime artifacts stayed unchanged; final inventory totals 473. Old Webpack output remains at the backup path recorded in `0206-promotion.json`.
- **Do not rebuild the recorded second staging directory blindly: after the swap its `dist` contains the old output backup.** Use a fresh isolated copy for further builds.
- Product changes are limited to Webpack sources and README plus one new regression file. Existing tests/fixtures/snapshots, shared build config, dependencies, lockfiles, CI/release and foreign Site changes remain untouched. No commit/push or foreign host restart.

## Evidence and continuation

Use `evidence/0206-final-checks.json` for all results and inherited remaining requirements; `0206-promotion.json` for exact artifact hashes/backup; `0206-source-hashes-final.json` and `0206-artifacts-final.json` for the checkpoint. `0206-build-state.json` and `0206-delivery-build-state.json` describe the two isolated layouts. Original and failed validation logs are retained verbatim.

Reproduce the delivered bounded behavior with:

```sh
node scripts/with-typescript-tooling-compat.mjs pnpm --dir packages/webpack exec vitest run tests/bug-hunt-static-graph-delivery.test.ts
node .ai/audits/bug-hunt/repros/webpack-import-boundaries.mjs
BH_HOST=webpack node .ai/audits/bug-hunt/repros/build-stylesheet-delivery.mjs
BH_ASSET_BASE=/assets/ node .ai/audits/bug-hunt/repros/webpack-import-boundaries.mjs
```

Next: verify real static build-watch changes/deletion/recovery for retained CSS and resources, then multiple/lazy entries, local compose/CSS Modules, source maps, unused-resource pruning, Sass/custom resolvers and additional deployment modes. Resource snapshots during concurrent writes and complete host lifecycle remain unverified. Next loader/static graph publication still needs its own implementation and actual host controls. Do not treat production static browser success as proof for development/runtime/SSR or all assets/maps.

BH-0004 low-level native/Wasm 20 qualified and 39 raw external failures remain; all Vite recovery/shutdown, root gates, compiler optional-Sass environment/Wasm test migration, benchmark/Site/platform requirements and all 10 blocked units are retained. The pure Webpack external-hoisting limitation from 0205 is bypassed for this bounded managed production route, not repaired in Webpack itself. 0038 still awaits explicit user identity confirmation.
