# 0131 Public bundle preparation and rendering

- Continued the in-progress0131 work after the user-requested commits `bb0989bb6` (BH-0045 Vite fix) and `160ca58a5` (0128–0130audit evidence). Previous goal turn made progress: both commits were created and87excluded files were byte-preserved. Those87hashes were rechecked before continuing. No new commit or push in this continuation.
- Scope: expose0130Rust bundle composition/relocation through native, compiler-Wasm and public compiler sessions, then verify real browser delivery. BH-0004 remains unfinished until required existing consumers use complete graph delivery.0038extra verification remains paused; no identity confirmation was supplied.

## Implementation and contract

1. Rust `prepare_css_stylesheet_bundle` accepts the existing `compileStylesheets` result's entry and asset list. It parses the already compiled CSS with the existing parser, reconnects exact compiler-issued import hrefs to node IDs, validates distinct nonempty hrefs and the managed graph even when no slot exists, then calls the existing bundle composer.
2. Rust `render_css_stylesheet_bundle` accepts that serializable bundle, final node URLs and optional ordinary-resource URL mappings. It relocates ordinary fragments through the0130helper and renders the complete graph. Managed resources retain the URLs assigned by the original compilation. Relative ordinary resources/imports still require an absolute or root-relative mapping; empty mappings do not disable validation.
3. Native JSON and compiler-Wasm exports forward to these Rust functions. Binding providers and compiler sessions expose `prepareStylesheetBundle` and `renderStylesheetBundle`; the sync Node session exposes the same methods. No TypeScript CSS parsing or semantic fallback was introduced.
4. Four public types were intentionally added: `MasterCSSPrepareStylesheetBundleRequest`, `MasterCSSStylesheetBundle`, `MasterCSSRenderStylesheetBundleRequest`, and `MasterCSSStylesheetAsset`. The Rust contract template was edited and protocol generated with `cargo xtask codegen`. The template is963lines, within its1000line script budget.
5. The public host returns frozen result records/arrays and enforces disposed-session guards. Prepare diagnostics map against the original host source or the managed asset's own CSS. JSON serialization between preparation/rendering is supported. This does not add original locations to diagnostics whose underlying error has no range.
6. The compiler README documents two-phase use, exact managed href identity, publication of every asset, ordinary URL mappings, resource ownership and current unsupported scopes. No directive syntax changed.

## Validation

| Check | Result and scope |
|---|---|
| Native and compiler-Wasm rebuild |PASS; [native](../evidence/0131-native-build.log), [Wasm](../evidence/0131-wasm-build.log) |
| Three host package builds |PASS; [build](../evidence/0131-host-build.log) |
| Focused public transport regressions |4PASS: native/Wasm equality, compiled import reconnection, original UTF-16 refs, JSON roundtrip, URL errors, duplicate href rejection, original diagnostic position, disposal and sync API; [log](../evidence/0131-bundle-host.log) |
| Complete compiler host suite |209PASS across24files; [log](../evidence/0131-compiler-tests.log) |
| Binding / compiler-Wasm provider suites |17PASS /4PASS; [binding](../evidence/0131-binding-tests.log), [provider](../evidence/0131-wasm-tests.log) |
| Rust compiler/native/Wasm crate tests |75compiler tests PASS; binding crates have0unit tests; public ABI covered above; [log](../evidence/0131-rust-tests.log) |
| Three package lint/type checks |All PASS; `0131-{compiler,binding,binding-wasm-compiler}-{lint,types}.log` |
| Three crate Clippy / workspace fmt |PASS; [Clippy](../evidence/0131-clippy.log), [fmt](../evidence/0131-fmt.log) |
| Generated protocol / parity |PASS; [codegen check](../evidence/0131-codegen-check.log), [parity](../evidence/0131-parity.log) |
| Built public API, real CSS delivery |14cases ×2bindings ×3browsers ×2media =168PASS; [driver](../repros/bundle-public-browser.mjs), [log](../evidence/0131-public-browser-final.log) |
| API invoked inside browser realms |6PASS:3browsers ×screen/print, fetched Wasm, native equality,6published CSS assets, namespace and original SVG URL; [driver](../repros/bundle-browser-wasm.mjs), [log](../evidence/0131-browser-wasm.log) |

- The168comparisons compile a real two-file managed graph separately with native/Wasm, reconnect its compiled imports, serialize the bundle through JSON, assign new asset URLs and publish every result. The author control uses separate CSS files. Coverage includes external import order, before/after rules, named/shared anonymous layers, nested supports/media, false conditions, repeated slots, comment/string decoys, prefix/default/redeclared namespaces, layer-order namespaces, ordinary image-set and CSS imports. Actual CSS/SVG requests retain query strings/fragments; namespace identifiers and string decoys are not fetched.
- First driver run stopped before browser launch because the new script looked for `resource.specifier`; the actual contract exposes `resource.url`. Correcting that one field yielded168PASS. [Initial script failure](../evidence/0131-public-browser.log) is not a product bug.
- The additional6controls run `createCompiler`, `compileStylesheets`, preparation and rendering inside Chromium/Firefox/WebKit, using browser conditions and an actual fetched Wasm artifact. A generic Vite build packages the consumer; the Master CSS Vite plugin is not enabled. These controls prove browser ABI delivery, not completion of BH-0004's Vite adapter migration. The packaging warning about ineffective dynamic import concerns chunk placement; no page/request failure occurred.

## Artifact and root gate evidence

- [Artifact hashes/sizes](../evidence/0131-artifact-hashes.json): compiler-Wasm now7158333raw /1592968gzip /988754brotli bytes, increases111174 /26084 /15537 from0130. SHA256 `40cdfb3f6338b1a64f665c23f862d3ce121e95a9e4d042a0e7828775eec77641`.
- Engine Wasm, runtime Wasm, runtime global JS and default manifest retain their four prior hashes and sizes. No engine/runtime hot path changed, so no runtime benchmark was run. Preparation parses compiled managed imports and materializes a graph; rendering clones it for relocation. The batch makes no startup, memory or throughput improvement claim.
- [API census](../evidence/0131-api-census.log) still FAIL, exact SHA256 unchanged from0128: `dc10f0ea4b46e12c21c6bdc6703bf56891d67411a80ad845344dba3bde6c45a4`.
- [Package golden](../evidence/0131-package-check.log) still FAIL, now `bee0a86a531520dc6273f8744a5f0905cc08e0dc8fb33b2a64b188886f87e7c0`. Diff from0128adds the four intentional types to binding/compiler exports and changes their declaration-surface hashes for the new methods. Existing golden discrepancies remain; no fixture/golden was refreshed. The other two root gates remain open and were not rerun in this batch.

## Completion and direct handoff

1. The0131two-phase public bundle transport is implemented and validated. BH-0004 itself remains confirmed/unresolved. Counts stay45historical /33fixed /12unresolved;75coverage units stay65checked /10blocked, with4root gates and4unclassified candidates.
2. Next migrate the actual Vite registration/composition/publication path, then Webpack: avoid flattening with `resolveStylesheetSync`/`resolveMasterStyleSource` before graph registration; use collection delivery to compile all managed assets, prepare the complete host stylesheet at its real slot position, assign publication URLs and render every asset. Retain source-owned resource/namespace context, pruning scopes and build-time URL identity before consumers receive references. Keep BH-0045's validated naming behavior.
3. Reuse the actual0127`build-stylesheet-delivery.mjs` corpus to prove the adapter work. Latest authoritative actual-build result remains16builds:10PASS/6FAIL and60browser comparisons:36PASS/24FAIL. The original legacy corpus remains21PASS/39FAIL. Neither corpus was rerun here; this new API does not prove those consumers fixed.
4. Repeated slot/dedup policy across actual bundle chunks, other wrapper scopes, invalid-rule handling, remaining no-delivery/native CLI/no-export consumers, source/watch lifecycle and unlocated diagnostics remain unfinished. Avoid external fetching, import hoisting, data URLs or rejection-only behavior as substitutes for required delivery.
5. Keep all other unresolved findings, root gates, unclassified candidates and blocked coverage open.0038extra verification still requires explicit identity confirmation. Preserve foreign Site changes, existing fixtures/snapshots, dependencies, lockfiles and CI/release. Final source/preservation hashes and process terminal states are recorded separately; no new commit/push.
