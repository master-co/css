# 0129 Rust source-aware bundle graph composition

- HEAD2740faa60. Previous goal turn made progress:0128fixedBH-0045and verified original cache, dynamic CSS, hydration and example controls. All107recorded source/preservation hashes matched at this batch's start.
- Scope: discover complete managed slot rules inside actual CSS text and compose the existing graph without losing ordinary-before/after order or shared media/supports/layer scopes. This is the lower Rust capability needed by0127's actual Vite/Webpack migration. BH-0004 remains unfinished.
- Counts remain45historical findings,33fixed/12unresolved,65checked/10blocked,4root gates and4unclassified candidates.0038additional verification remains paused for explicit identity confirmation.

## Existing capabilities and implementation

- Inspected compiler `native_style.rs`, `stylesheet_graph.rs`, `compiled_stylesheet_graph.rs`, the lexer `css_syntax.rs`, existing graph tests, and0127's manually segmented browser proof. Native directive lowering handles native compose and selected conditions; it does not expose arbitrary bundle rule ranges. The shared CSS lexer already provides decoded names, complete component blocks and parent statement indices. The graph renderer already parses and rewrites import URLs with conditions. Those capabilities are reused.
- New crate-local module `stylesheet_bundle.rs` exposes public Rust `compose_css_bundle_graph`, `CssBundleGraph` and `CssBundleSource`. It consumes raw bundle source, its filename, the configured complete slot rule and an already compiled managed stylesheet graph. No new TypeScript parser, binding method, package export or dependency was added.
- Slot matching compares complete rule token sequences, ignoring whitespace/comments and optional declaration semicolons. A marker inside a string/comment/custom-property block or a larger selector is not replaced. This does not claim recognition of arbitrary semantic rewrites by third-party minifiers.
- Ordinary text on either side becomes separately addressable graph nodes. Each source node records its original filename and exact UTF-16 range. Existing managed graph nodes/references are retained. Synthetic IDs avoid existing node collisions and remain stable for identical inputs; URL/file naming belongs to the host.
- A media/supports/layer wrapper containing slots becomes one intermediate stylesheet imported with that condition. Its before/managed/after children share that wrapper. In particular an anonymous layer is created once around the group, rather than separately for each fragment, preserving important-declaration priority.
- All slot occurrences are preserved by the graph operation. This deliberately differs from the current adapter's global first-slot-only publication policy. Adapter integration must decide which occurrences represent deduplicated virtual output versus separate authoring scopes; no adapter policy was changed in0129.
- Iterative group jobs avoid recursion on deeply nested wrappers. The existing renderer validates/prints synthesized import statements and handles host-assigned URLs. The helper does not write assets, resolve filesystem paths, rebase resources, lower new directives or fetch external CSS.

## Validation

| Check | Result |
|---|---|
| New Rust bundle groups |6PASS |
| Full Rust compiler suite |71PASS |
| Compiler Clippy, all targets/features |PASS |
| Rust formatting/codegen check |PASS |
| Existing TypeScript compiler suite |205PASS |
| Compiler lint/type-check |PASS |
| Actual Rust composition + browser-loaded assets |48PASS:8cases ×3browsers ×screen/print |
| 0128 source/preservation baseline |Only intentional compiler `lib.rs` export registration changed;106other paths unchanged |
| Compiler/runtime artifacts |5hashes unchanged; no native/Wasm/runtime rebuild |

- [New test](../../../../crates/mastercss-compiler/tests/bug_hunt_bundle_graph.rs) covers exact source reconstruction with astral characters, quoted/comment/custom-property fake markers, a larger selector, slot formatting trivia, nested conditions, one shared anonymous layer, every duplicate slot, synthetic ID collisions, absent slots, explicit unsupported contexts,512nested wrappers, deterministic repeated plans and malformed enclosing blocks.
- Initial focused run was4PASS/1FAIL because a new assertion expected `supports((display: grid))`; the existing import parser prints canonical `supports(display: grid)`. Diagnostic output showed the correct graph and source ordering. The assertion was corrected and actual browser conditions tested separately. This was a test expectation error, not a product condition bug. [Initial](../evidence/0129-bundle-rust.log), [diagnostic](../evidence/0129-condition-diagnostic.log), [final71Rust](../evidence/0129-compiler-rust-final.log).
- [Rust probe](../repros/bundle-graph-probe.rs) passes raw CSS containing slot rules to the new public Rust function, then invokes the existing renderer. [Browser driver](../repros/bundle-graph-browser.mjs) creates a temporary offline Cargo consumer using existing compiler/serde dependencies and serves the resulting assets to Chromium, Firefox and WebKit. The repository manifests/lockfiles are untouched.
- Eight source-controlled cases: ordinary-before, ordinary-after, named layer, anonymous layer with important before/after probes, nested anonymous-layer/supports/print, false supports, comments/strings with fake markers and duplicate slot positions. Original CSS uses separate authoring files/imports as the browser reference. Computed color, background and content match across48comparisons, with no missing assets/page errors. [Evidence](../evidence/0129-bundle-browser.log).
- This extends0127's explicit-segment proof by discovering boundaries from CSS text. It still does not exercise a Vite/Webpack adapter or the native/Wasm transport. TypeScript205tests use unchanged existing bindings and verify baseline compatibility, not access to the new Rust function.

## Explicit limits and direct handoff

1. **Next: source context and relocation.** The current function explicitly refuses namespace-bearing bundles, late top-level imports, nested invalid imports/namespaces, and slots inside other rule scopes such as container or nested selectors. These refusals are not fixes or completion. Inspect CSS namespace ownership and the existing `stylesheet_resources.rs` discovery/relocation helpers before allowing such fragments to move; resource-bearing ordinary fragments already retain original owner/ranges but are not rebased. Keep opaque contexts intact until there is a valid lowering representation.
2. Complete namespace/import-context semantics and ordinary-resource URL ownership at the Rust layer, then expose the bounded graph composition operation through native/compiler-Wasm transports and the compiler host. Reuse current protocol generation and graph asset types instead of adding host CSS parsing. Validate returned resource and diagnostic positions after any edits.
3. Migrate real Vite/Webpack entry classification and collection registration away from the early flat resolver, then compose/publish all graph assets at their original bundle position. Reconcile duplicate virtual slots with real wrapper scopes. Retain0128's pre-reference naming guarantees for every emitted dependency; a graph helper alone cannot fix the actual builds.
4. Existing required failures remain latest0125legacy21PASS/39FAIL and0127actual16builds10PASS/6FAIL, browser36PASS/24FAIL; not rerun here because no consuming adapter or transport changed. File no-delivery/native CLI/no-export, source/watch lifecycle, unlocated diagnostics, all12unresolved findings,10blocked coverage units,4root gates and4candidates remain open.
5. This adds build-time token/statement traversal, graph/source strings, intermediate files and browser import requests. Deep jobs scan statement lists and no performance improvement is claimed. No engine/runtime hot path changed; no runtime benchmark or payload change. Root API gates were not rerun because there is no TypeScript export/wire change; their last exact failures are recorded in0128.
6. All known jobs are terminal. No commit/push. Preserve other conversations' Site changes, existing fixtures/snapshots, dependencies, lockfiles and CI/release.0038additional verification still requires explicit identity confirmation.
