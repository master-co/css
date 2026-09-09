# 0120 Standalone stylesheet output modes

- Starting HEAD927278b1c; user-requested audit-only commit912a73b26 occurred during this batch. Previous goal turn made progress by committing0118/0119 investigation materials while preserving unfinished implementation.
- Bounded behavior: standalone collection selection of project native CSS, Master package CSS, generated utility CSS, and raw native preservation. BH-0004 remains partial; other consumers, diagnostics and asset lifecycle are not complete.
- Counts remain32fixed/12unresolved,65checked/10blocked,4root gates and4unclassified candidates.0038additional verification still awaits explicit identity confirmation.

## Failures and classification

1. Collection delivery rejected `includeNativeCSS:false` or `includeMasterBaseCSS:false`. The first8-mode regression had6FAIL/2PASS. [Original guard failures](../evidence/0120-modes-before.log).
2. After implementing selection, expanding to `preserveNativeCSS:false` exposed ignored forwarding and retained raw external imports:6FAIL/11PASS among17tests. [Raw preservation baseline](../evidence/0120-preserve-before.log).
3. The first full16-mode browser corpus passed96comparisons but did not exercise competition between layers. Adding an independent layer probe exposed36FAIL/60PASS: a suppressed file retained `@import './dead.css' layer(later)`, establishing a layer despite the target having no selected output. Generated purple incorrectly beat the later page's blue rule. [Stronger original failure](../evidence/0120-layer-before.log), [same driver after correction](../evidence/0120-layer-browser.log).
4. Script-only mistakes were kept separate: the initial Rust expectation ignored printer whitespace in `supports(display: grid)`; the initial browser assertion rejected Firefox fetching an original external URL twice. Whitespace normalization and comparing requested URL sets corrected those assertions; raw request arrays remain in browser evidence. Neither mistake is a product finding. The originally drafted wrong preset path was corrected before running the browser driver.

These are the existing BH-0004 delivery/cascade requirements. No new finding ID or full-fix claim.

## Implementation

- Rust graph request adds optional `nativeStylesheets` file IDs, validates unknown IDs, and independently retains all authoring definitions and dependencies. Native selection controls native declarations, native compose output and external imports. Generated utility selection remains the collection host's existing render option.
- The Node collection classifies Master package ownership using prepared filesystem edges, forwards native selection and `preserveNativeCSS`, and removes the previous exclusion guard. CSS parsing, lowering and graph emission remain in Rust.
- `preserveNativeCSS:false` omits raw rules/external imports while retaining selected compiled native compose output. `includeNativeCSS:false` excludes project native compose as well. Excluded definitions still produce used utilities.
- Rust propagates selected output to ancestors using reverse graph edges. A suppressed source retains only import edges needed to reach selected output, preserving each edge's media/supports/layer conditions. A source whose raw native CSS is selected retains its authored imports, including their layer effects.
- Final assets include only nodes reachable from the rewritten entry graph. The entry is retained even when empty; dependency and definition reporting retain all authoring files. Excluding all native output produces no empty sidecar requests or accidental layer declarations.
- Compiler README and the actual directive guide `contract.mdx` describe these output contracts. Generated protocol came from the xtask template/codegen workflow; no existing golden/fixture was updated.

## Final evidence

| Check | Final result |
|---|---|
| Rust compiler suite |63PASS; selected descendant reachability, omitted empty branches, authored layer preservation, definitions/dependencies retained |
| Compiler host suite |185PASS, including16option combinations plus native/Wasm request parity and invalid selection |
| Public collection browser |96PASS/0FAIL:16combinations x screen/print x Chromium/Firefox/WebKit; computed styles, competing layers and external requests |
| CLI host suite |37PASS |
| Actual source/built CLI |18PASS each; original six-case disk output corpus |
| Binding host suite |17PASS |
| Native/compiler-Wasm builds |PASS; final parity uses rebuilt artifacts |
| Compiler/binding lint and types |PASS |
| Compiler/CLI builds |PASS; built CLI browser uses fresh output |
| Rust Clippy compiler/native/Wasm, fmt, codegen/parity |PASS |
| Site guide lint/prepare |PASS;0errors/75existingwarnings |
| Legacy public external-import browser |Still21PASS/39FAIL; BH-0004 remains unfinished |
| Root API census/package contracts |BothFAIL; both output hashes unchanged from0119; no golden updates |

- Final logs use `0120-layer-*`: [Rust](../evidence/0120-layer-rust.log), [compiler](../evidence/0120-layer-compiler-tests.log), [CLI](../evidence/0120-layer-cli-tests.log), [source CLI](../evidence/0120-layer-cli-source.json), [built CLI](../evidence/0120-layer-cli-built.json), [legacy](../evidence/0120-layer-legacy-browser.log), [root gates](../evidence/0120-root-checks.json).
- Earlier0120logs are intermediate states; their passing assertions do not supersede the stronger layer probe or final source hashes.
- CompilerWasm7,044,616raw/1,565,476gzip/972,207brotli bytes: +8,585/+5,107/+1,589 versus0119. Engine/runtime Wasm, runtime global JS and default manifest hashes are unchanged. [Payload](../evidence/0120-payload.json).
- No engine/runtime hot-path change and no engine/runtime benchmark in this batch. No CPU/memory/speed improvement claimed. The new graph traversal adds compiler work proportional to graph nodes/edges.

## Direct handoff and remaining work

1. Next bounded batch: reproduce public delivery diagnostics with an imported file, a resource URL whose relocation changes length, and a later invalid directive/native compose. Check original owner filename and UTF-16 positions; variant IDs currently contain internal NUL suffixes. Preserve the actual failure before fixing owner/range mapping.
2. BH-0004 still needs existing file/project/build and `--no-export` consumers, inline/runtime resource bases, namespace/external URL-base forms, reference/source-policy edges and complete delivery behavior. Original60-case browser corpus still has39failures.
3. Resource watch replacement is verified; stale asset cleanup, missing-resource recovery, removed imports and broader multiple-output/reload tests remain unfinished. Do not delete unrelated output files or call an explicit error fallback completion.
4. Keep the final16-mode/96browser and source/built CLI controls while extending the shared compiler. Preserve12unresolved findings,10blocked coverage units,4root gates,4unclassified candidates and the0038identity pause.

This bounded output-mode verification is complete, not BH-0004 or the overall goal. Current implementation, tests and0120materials remain uncommitted; HEAD912a73b26. No push. Source/preservation hashes, inventory and final context-budget result accompany this batch.
