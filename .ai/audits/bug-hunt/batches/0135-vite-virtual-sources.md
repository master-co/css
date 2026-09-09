# 0135 Vite virtual stylesheet sources

- Previous goal turn made progress:0134 repaired alias-native pruning and established virtual/Sass failures. Revalidated all134 source/preservation hashes before this batch. HEAD remains `ef7887f76`; no new commit/push.0038 additional verification remains paused without explicit identity confirmation.
- Scope: loader-supplied virtual CSS source identity, collection registration, conditional graph publication and bounded real build-watch controls. Sass and the rest of BH-0004 remain unfinished.

## Implementation

1. The compiler async import resolver additionally accepts `{ id, source, baseFile? }`; `MasterCSSStylesheetImportSource` is the intentional new public type. IDs are absolute filesystem IDs or null-prefixed virtual IDs. Supplied CSS is not read from disk. Prepared graphs retain virtual IDs, source text, repeated import edges and optional real source owners.
2. Virtual query suffixes are part of identity, rather than file request suffixes to strip. A focused regression first proved that classification removed the suffix; `cleanStyleRequest` now preserves opaque null-prefixed IDs, including collection deletion and snapshots. Ordinary filesystem request cleaning remains unchanged.
3. Supplied `baseFile` maps relative resources and source patterns to a declared filesystem owner. Composition carries it through variant IDs; resource query strings/fragments survive delivery. Virtual relative resources with no owner produce an explicit error, and no partial collection source is registered. This is not completion of automatic Vite virtual-resource resolution.
4. Vite captures loader CSS in the pre-transform local-compose hook and private module metadata, before later transforms replace it. Its resolver calls the actual bundler `load` capability for null-prefixed virtual `.css` modules and retrieves the captured original CSS. Metadata supports restored cached modules; an in-progress source cache avoids reloading an already captured module while walking nested graphs. Per-build cache state resets at buildStart.
5. Both stylesheet transforms classify virtual CSS in production. Before composition, the adapter removes programmatically loaded graph-only sources that have no actual static/dynamic module importers. Such children remain inside their parent's prepared graph, preserving `print`/layer conditions instead of adding another unconditional entry. Direct JS imports retain their entry behavior. Virtual IDs are not passed to `addWatchFile`; custom loader filesystem dependencies remain with Vite.
6. Compiler/Vite README and formal Site directive contract describe source records, identity, conditional delivery and remaining resource/preprocessor work. No Rust/ABI/runtime changes, new dependencies or existing fixtures/snapshots were introduced.

## Validation

| Check | Final result |
|---|---|
| Full compiler suite |223PASS across27files;4new virtual-source tests |
| Full Vite suite |110PASS across19files |
| Compiler/Vite lint/types/build |PASS |
| Expanded actual host-input matrix |13builds:12succeed/1Sass failure;72browser:66PASS/6Sass failures |
| Virtual subset of that matrix |5builds/30browser PASS |
| Native pruning/preservation subset |6builds/36browser PASS |
| Prior file-resolver corpus |6builds/36browser PASS |
| Prior package/resource corpus |3builds/18browser PASS |
| Prior naming/cache/lazy corpus |21builds/39browser PASS |
| Actual Master CSS virtual build watch |9builds/54browser PASS across3scenarios |
| Pure Vite watch control |3builds/18browser PASS |
| Site guide preparation/lint |PASS;0errors/75warnings |

- [Compiler223](../evidence/0135-compiler-tests-final.log), [Vite110](../evidence/0135-vite-tests-query-final.log). The new [host tests](../../../../packages/compiler/tests/bug-hunt-virtual-sources.test.ts) exercise source IDs with query suffixes, provided resource owner/query/fragment delivery, snapshot/deletion, no resolver calls during composition, empty source/repeated edges, missing-owner atomicity and original virtual diagnostic identity.
- [Expanded driver](../repros/vite-host-inputs.mjs), [final matrix](../evidence/0135-host-inputs-expanded.log): direct virtual entry, imported virtual CSS, `print` plus layer, nested virtual import conditions, and separate `?blue`/`?red` sources selected by print/screen. Every case runs Chromium/Firefox/WebKit under both media. Initial2virtual cases passed12comparisons, then nested/condition cases passed12; final combined matrix is authoritative. Its exit1 retains the unresolved Sass cases rather than treating them as expected successes.
- [Resolver36](../evidence/0135-resolver-control.log), [resources18](../evidence/0135-resource-control.log), [cache39](../evidence/0135-hash-control.log). The final query change only affects virtual IDs; file resolver/resource controls retain the same source paths. Vite's final suite and full host-input/cache matrices ran after the final compiler rebuild.
- [Watch driver](../repros/vite-virtual-watch.mjs): custom loader calls `addWatchFile` on its source file; red→blue→green changes trigger3actual builds and18browser comparisons per scenario. [Direct](../evidence/0135-virtual-watch-direct-canonical.log), [conditional imported](../evidence/0135-virtual-watch-canonical.log), and [query-ID imported](../evidence/0135-virtual-watch-query.log) each pass18. Screen remains black for conditional imports while print changes; direct entries change in both media. All require zero missing resources/page errors and three loader reads. These are bounded build-watch controls, not the full HMR/multiple-entry/lazy/deletion matrix.
- [Pure Vite control18](../evidence/0135-virtual-watch-vite-control.log) omits Master CSS. Earlier watch attempts used macOS `/var` symlink paths for `addWatchFile` and timed out after the initial6passes. Canonicalizing the temporary root fixes the control and all Master cases. The final driver also closes each BUNDLE_END result as required by the installed Rolldown API. An intermediate diagnostic attempted unsupported `getWatchFiles` and failed before browser checks; it now records `getModuleIds` as module IDs. These harness failures are not new product findings.
- The first4host tests had3PASS/1FAIL because the assertion expected an error-level `source` property; the actual public error stores it in `diagnostics[].source`, which already contained the original virtual ID. The corrected assertion passed. Separately, [query regression before](../evidence/0135-virtual-query-before.log) proved actual identity truncation and required the product fix above; do not conflate the two failures.

## Gates and preservation

- [Artifact hashes](../evidence/0135-artifact-hashes.json): all five0134 hashes and raw/gzip/brotli sizes unchanged, including compiler-Wasm7159106/1593333/988883bytes. No Rust/ABI rebuild, Rust tests, codegen/parity or runtime benchmark was repeated. Host source caching retains additional build-time CSS strings; module loading can run extra transforms. No speed or memory improvement is claimed.
- [API census](../evidence/0135-api-census-final.log) remains FAIL with unchanged SHA256 `dc10f0ea4b46e12c21c6bdc6703bf56891d67411a80ad845344dba3bde6c45a4`. [Package golden](../evidence/0135-package-check-final.log) remains FAIL and includes the new source-record type/public callback surface, SHA256 `dce82ef4e66b2849e180df3cd856561f50874ec8c1ea7332df81ec56172fc3ad`. No golden refresh. The other two root gates remain open/not rerun.
- [Site prepare](../evidence/0135-site-prepare-final.log), [Site lint](../evidence/0135-site-lint.log). Final source hashes, inventory, AI budgets and terminal job states are recorded separately. Foreign Site configuration/agent files, other product work, existing fixtures/snapshots, dependencies, lockfiles and CI/release remain preserved.

## Direct continuation

1. Continue from the remaining actual **Sass entry build failure and6Sass-import browser failures** in the same driver. Async graph registration currently bypasses preprocessing and the resolver only loads `.css`. Extend host source preparation before Rust analysis for entry and imported Sass, honoring installed preprocessor options, alias resolution, dependencies and resource ownership. Vite's public `preprocessCSS` runs its whole CSS compilation pipeline; do not accidentally flatten graph imports while reusing it.
2. Connect automatic virtual/resource alias ownership and `@reference` resolution. Source-record `baseFile` is currently supplied by generic compiler callers; the Vite loader bridge does not infer it or integrate arbitrary loader source maps. Direct virtual sources with relative resources, virtual references, arbitrary non-CSS IDs and preprocessing transforms beyond the captured stage remain unverified or incomplete.
3. Verify parent-shared definitions/local-compose contexts, multiple actual roots, repeated slots/dedup, aliases into virtual modules, nested relative imports/resources, cycles/errors/recovery, source/pruning policies, lazy chunks and broader watch/HMR. Do not count a documented rejection or a passing plain virtual example as completion of these requirements.
4. Then migrate Webpack's graph registration/publication; last original actual corpus remains3build/12browser failures. Legacy single-string corpus remains21PASS/39FAIL. No-delivery/native/CLI no-export consumers and remaining wrapper/diagnostic cases are still open.
5. Counts remain45historical findings:33fixed/12unresolved;75coverage units:65checked/10blocked;4root gates and4unclassified candidates.0038 extra verification still needs explicit identity confirmation. Goal remains active; no new commit/push.
