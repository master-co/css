# 0112 External import ordering — BH-0004 remains unfinished

- Starting HEAD7e225b3da. Previous goal turn made progress:0111 completed BH-0003 with145Rust/279runtime and72browser controls. This batch resumes0092's preserved import work; it does not recreate the ledger or alter prior source progress. No product change, commit or push in this batch.0038追加驗證 remains paused without explicit identity confirmation.
- Read0092, current Rust import/provider/result contracts, matching compiler manifest/local AI, Node prepared graph and project/stylesheet consumers. The prior local qualification implementation remains intact. Its8Rust regressions still pass; [log](../evidence/0112-local-regressions.log). That includes a test explicitly expecting the old nested-external limitation, so green does not mean BH-0004 is complete.

## Direct current-source evidence

- Added a bounded [driver](../repros/external-import-order.mjs) covering10cases. It compares actual browser-loaded original import trees with CSS produced through the public compiler session graph/compile operations. Each runs screen and print in Chromium/Firefox/WebKit. Native source controls assert explicit expected colors, rather than treating any browser output as the desired answer.
- Native and compiler-Wasm produce identical graph/CSS results or identical typed errors for all10cases, using current compiler-Wasm bytes explicitly. Final run:60browser comparisons,21PASS/39FAIL. Of the39failures,21produce wrong computed colors and18cannot compile because qualified parents contain preserved external imports. The script intentionally exits1 until these behaviors are repaired. [First native browser evidence](../evidence/0112-external-before.log), [native/Wasm plus browser evidence](../evidence/0112-external-parity-browser.log).

| Case | Browser comparisons | Current result |
|---|---:|---|
| External before local |6| PASS; later local red wins |
| Local before external |6| FAIL; source blue, compiled red |
| Both imports in the same named layer |6| FAIL; source blue, compiled red |
| Imports establish different layers |6| FAIL; hoisting changes first-declared layer order; source blue, compiled red |
| Different layers predeclared by `@layer a,b` |6| PASS; explicit layer order compensates for this example |
| Local import only in print, then external |6|3PASS screen/3FAIL print; source blue, compiled red in print |
| Unqualified local parent containing external import |6| PASS for the tested external-first child |
| Named-layer local parent containing external import |6| Typed import error; valid source renders red |
| Anonymous-layer local parent containing external import |6| Typed import error; valid source renders red |
| Supports/media local parent containing external import |6| Typed import error; source red on screen/black in print |

- All cases belong to existing BH-0004. Do not create a second ID for the source-order symptom, mark39failures as setup errors, or count typed refusal as supported behavior. Anonymous/named layers and false media conditions remain required parts of the final behavior.

## Capability constraints and implementation direction

- `resolve_css_import_graph_file` currently separates unresolved imports into `preserved_imports`, then inserts them before expanded local CSS. That maintains syntactic placement but changes source and sometimes layer order. `wrap_imported_css` explicitly refuses qualified parents containing imports because placing an `@import` inside `@media`/`@supports`/`@layer` would be invalid.
- Current Rust `ResolvedCssImportGraph` and TS `ResolvedCSSImportGraph` carry a single source string plus dependencies/references. Prepared Node graphs already have files and edges, but resolution discards stylesheet boundaries. `compile_native_css` and downstream compile results similarly return CSS strings; the examined stylesheet result types have no compiler-owned CSS asset tree.
- [CSS Cascade5](https://drafts.csswg.org/css-cascade-5/#at-import) constrains import placement and qualification. The existing [Lightning CSS bundling documentation](https://lightningcss.dev/bundling.html#custom-resolvers) explicitly forbids an external import after bundled imports to preserve behavior. Its installed Rust bundler also emits `ExternalImportAfterBundledImport`; replacing this resolver wholesale with that bundler would retain a limitation, not complete this requirement.
- Existing import AST types support layers and supports/media conditions. This may help with representable external prefixes, but qualifier concatenation alone does not preserve arbitrary source order or shared anonymous-layer boundaries. Negated media-type combinations also cannot all be represented by one flattened import query; do not assume a successful common-case conjunction proves all conditions.
- Do not silently switch external resources to fetched/bundled content, synthesize data-URL stylesheets, invent extra cascade layers, or hoist imports as a substitute for preserving the authored behavior. Those approaches change loading/CSP/URL bases or cascade semantics and have no supporting end-to-end evidence here.

## Directly resumable next steps

1. Start at the owning Rust graph representation in `crates/mastercss-compiler/src/lib.rs` and `imports.rs`. Preserve ordered import edges, each statement's qualifiers and stylesheet boundaries before flattening. Keep local flattening for provably safe graphs; represent graphs requiring separate stylesheet delivery without losing order. Carry original source IDs so URL/base handling can remain deliberate.
2. Trace the complete response path before selecting a public contract: Node `node-compiler.ts` and `project/binding-project.ts`, Rust `mastercss-project` prepared/direct graph loading, `stylesheet/directives.ts` and `stylesheet/index.ts`, then build/CLI consumers. Host layers may emit assets/resolve paths; they must not implement CSS semantic fallbacks. The existing runtime-manifest asset emitter is specific to JSON and is not an existing CSS graph solution.
3. Establish a reviewable multi-stylesheet output contract or another demonstrated equivalent at the compiler layer, update every required consumer, and validate actual delivery. Do not add fields that downstream consumers silently ignore and then mark the graph supported. Preserve the existing successful single-file/public behaviors while implementing boundary-preserving output.
4. Use this driver as a failure baseline, adapt it to consume the implemented output graph/assets, and keep original author controls. Add required relative URL/base, repeated-import, anonymous layer, important declaration, mixed media-list/negation and conditional-layer controls before claiming full support. Existing0092 local96browser controls remain part of final regression validation.

- This batch completes additional diagnosis and a concrete next-work boundary, not the product fix.31fixed/13unresolved and65checked/10blocked are unchanged. BH-0004 remains partial. All other unresolved findings, root-check failures, Node Wasm loader/.mjs/Webpack harness candidates and blocked coverage remain unfinished.
- All browser/compiler/tool handles are terminal and disposed. Source hashes for0092 and completed0110/0111 plus foreign Site files are verified unchanged; index empty and HEADunchanged. No runtime build, benchmark, lint or product tests beyond the targeted Rust regression were required for this repro/ledger-only batch; no new performance claim.
