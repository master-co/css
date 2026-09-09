# 0130 Bundle namespace and resource source context

- HEAD2740faa60. Previous goal turn made progress:0129implemented Rust bundle boundary discovery/composition with71Rust/205host/48browser controls. All111recordedsource/preservationhashes matched at this batch's start.
- Scope: preserve namespace declarations on ordinary CSS fragments and relocate their resource/import URLs without changing managed graph ownership or original UTF-16 references. This extends the lower Rust path; native/Wasm transports and actual Vite/Webpack consumers remain unmigrated. BH-0004 is not closed.
- Counts stay45historical findings,33fixed/12unresolved,65checked/10blocked,4root gates and4unclassified candidates.0038additional verification still requires explicit identity confirmation.

## Source contract and changes

- Namespace prefixes/defaults belong to the declaring stylesheet and do not cross imports; repeated declarations use the last binding. Namespace URI syntax is an identifier, not a resource URL to normalize. These rules were checked against the [W3C namespace scope and declaration specification](https://www.w3.org/TR/css-namespaces-3/#scope), then verified with actual HTML/SVG browser controls. The namespace-after-layer-statement case has separate current-browser evidence.
-0129rejected every namespace-bearing bundle. The new direct Rust regression initially failed on a valid prefixed namespace and nested media input. [Before](../evidence/0130-context-before.log), [after](../evidence/0130-context-after.log).
- The bundle composer validates namespace statement syntax through the existing Lightning CSS parser. Original leading declarations stay in the first fragment after original imports; later/group fragments receive the same ordered namespace prelude. The already compiled managed graph retains its own namespace scope.
- `CssBundleSource` now records the copied `prefix` plus original `resources` and `imports`, alongside the original filename/range. Reference ranges remain UTF-16 positions in the original bundle, including astral characters, before namespace prefix copies or URL spelling changes. This does not claim arbitrary downstream diagnostics are already mapped back through every future transform.
- New `stylesheet_bundle_context.rs` provides fragment metadata construction and public Rust `relocate_css_bundle_resources`. It clones the graph, rewrites only ordinary source-owned nodes, and returns the completed result. Missing/invalid mappings cannot partially mutate the caller's graph.
- Resource parsing/rewriting reuses `stylesheet_resources.rs`; CSS import rewriting reuses the existing import parser/printer and refreshes graph import ranges afterward. Only helper visibility changed in those two existing modules. Decoded original URLs map to caller-provided root-relative or absolute URLs. Relative imports require mappings too; their layer/supports/media suffixes remain parsed CSS conditions.
- Namespace identifiers, strings resembling URLs, local fragments and empty declaration URLs retain existing semantics. Already compiled managed nodes are not relocated by this ordinary-bundle operation. Host URL assignment and file publication remain host responsibilities; no filesystem/network policy or new dependency was added.

## Validation

| Check | Result |
|---|---|
| New namespace/resource context tests |4PASS, including original failing namespace case |
| Complete Rust compiler |75PASS |
| Complete TypeScript compiler baseline |205PASS |
| Compiler lint/types, Rust Clippy/fmt/codegen |PASS |
| New namespace/resource browser matrix |36PASS:6cases ×3browsers ×screen/print |
| Existing0129bundle browser matrix |48PASS |
| Source preservation |5intentional changes among111previous paths;106other paths unchanged |
| Compiler/runtime artifact hashes |5unchanged; no native/Wasm/runtime rebuild |

- [Rust context tests](../../../../crates/mastercss-compiler/tests/bug_hunt_bundle_context.rs) validate prefixed/default/redeclared namespace ordering, original imports before namespace, managed graph isolation, query/fragment-bearing resource and CSS import mappings, unchanged namespace identifiers, original resource/import ranges and no partial mutation on missing/relative mappings.0129's namespace refusal control now uses a misplaced declaration after a style rule; valid namespace support is the deliberate contract expansion.
- First full run stopped at3PASS/1FAIL in the new context test because it expected the filename in `CompilerError` display text. The existing error stores filename in its structured `Import.filename` field; the test now checks that field. No production error-format behavior changed. [Intermediate](../evidence/0130-compiler-rust.log), [final75Rust](../evidence/0130-compiler-rust-final.log).
- [Rust probe](../repros/bundle-context-probe.rs) passes current raw CSS through composition, explicit URL relocation and existing rendering. [Browser driver](../repros/bundle-context-browser.mjs) uses an offline temporary Cargo consumer and serves actual generated assets. Original stylesheets with separate namespace-bearing before/after files and independent managed CSS provide the browser reference.
- Six cases: prefixed SVG selector, default SVG namespace versus HTML, redeclared prefix, namespace inside shared anonymous-layer/print delivery, namespace after a layer-order statement, and image-set/CSS-import relocation with query/fragment suffixes. All36compare computed HTML/SVG color, fill, stroke, background, image, outline and content. The resource case checks actual `/author/pixel.svg?q=1` and `/author/paint.css?rev=1` requests and rejects fake-string/namespace requests. [Expanded36](../evidence/0130-context-browser-expanded.log), [initial30](../evidence/0130-context-browser.log).
- [Existing48](../evidence/0130-bundle-browser.log) reruns the prior ordinary-before/after, anonymous layer, nested conditions, fake slot and duplicate slot cases against the new Rust code. [Host205](../evidence/0130-compiler-tests.log) uses unchanged existing bindings, so it is baseline compatibility evidence rather than a transport test for these new functions.

## Next implementation and unfinished requirements

1. Expose the Rust bundle composition/relocation contract through native and compiler-Wasm bindings and the compiler host, using existing graph/source/resource types and generated protocol workflow. Preserve original source references and errors at this boundary. Then connect the actual Vite/Webpack style entry/collection paths and asset publishing; avoid additional host CSS parsing.
2. Actual adapters still flatten imports before classification/collection registration and publish a single replaced slot. Migrate them to original graphs and full asset delivery, preserving0128's pre-reference content naming. Reconcile global virtual-output deduplication with distinct authoring wrapper occurrences. Validate0127's actual failing builds before calling any consumer fixed.
3. Slots inside other scopes (container/nested selector/etc.), invalid/misplaced namespace/import handling, arbitrary future diagnostic transforms, remaining source/watch lifecycle and other legacy paths still require work. Existing explicit refusals are not completion. Legal namespace source context and explicit ordinary URL relocation are now verified in the Rust helper only.
4. Latest legacy corpus remains0125's21PASS/39FAIL; latest actual consumer corpus remains0127's10successful/6failed builds with36PASS/24FAIL browser comparisons. These consumer paths were unchanged and not rerun here. No-delivery file/native CLI/no-export and allotherunresolved/gates/blocked/candidates stay open.
5. Copying namespace preludes adds asset bytes; metadata retains original URLs and graph relocation clones graph strings before publishing a result. No speed/memory improvement is claimed. No engine/runtime hot path or runtime payload changed, so no runtime benchmark; five existing artifact hashes remain exact. No TypeScript/wire API change yet, so root API gates were not rerun; last exact failures remain0128.
6. All knownjobs terminal. No commit/push. Preserve other conversations' Site changes, existing fixtures/snapshots, dependencies, lockfiles and CI/release.0038additional verification remains paused for explicit identity confirmation.

- Ledger size maintenance: older coverage/report/handoff paragraphs moved verbatim into sibling history files with links;75coverage rows and current status remain. Original moved-text hashes and exact-copy checks are in `evidence/0130-ledger-history.json`. No historical progress was deleted or reclassified.
