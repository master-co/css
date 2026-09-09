# 0113 Stylesheet boundaries — BH-0004 partial implementation

- Starting HEAD7e225b3da; the user interrupted initial implementation to request committing completed work. That request completed as bece2e120, containing BH-0002/0003 and0110–0112 audit evidence. This goal continuation resumes the preserved compiler work. The preceding turn made concrete progress by committing and hash-verifying completed work, not a no-progress or blocked turn.
- Scope: Rust-owned ordered stylesheet graph and URL rendering, followed by actual browser delivery of its output. No existing public compiler, project, build or CLI entrypoint uses this graph yet. BH-0004 remains unfinished. No new commit/push is authorized by this continuation.0038追加驗證 remains paused without explicit identity confirmation.

## Implementation and evidence

- Added `crates/mastercss-compiler/src/stylesheet_graph.rs`, exported through the compiler crate. The graph retains each source file and every import occurrence, ordered UTF-16 ranges, original import statements, decoded specifiers and optional resolved targets. External imports retain their authored bytes; the provider still determines what is external. Files load once, repeated edges remain distinct, and iterative DFS retains cycle diagnostics without recursive graph traversal.
- Extracted the existing provider-load/reference-removal code into `imports::load_css_import_source`, reused by old and new graph paths.0092 qualification/hoisting logic remains unchanged. References keep original file/ranges, while import offsets refer to the source after reference removal.
- Rendering rewrites resolved import URLs through the existing Lightning CSS import parser/printer. It retains separate stylesheets, import positions, qualifiers and all non-import source bytes; it rejects missing node/URL targets and stale ranges. It does not fetch external CSS, synthesize layers, or inline imports into invalid nested rules.
- New [Rust tests](../../../../crates/mastercss-compiler/tests/bug_hunt_stylesheet_graph.rs) cover duplicate/diamond graphs, escaped/case-insensitive import syntax, comments/strings, UTF-16, references, load/resolve failures, cycles,2048nodes, URL escaping and invalid graph rendering inputs. The [shared18-case corpus](../../../../crates/mastercss-compiler/tests/bug_hunt_stylesheet_graph.json) includes the original0112ten cases plus important declarations, shared/repeated anonymous layers, negated/media lists and false supports.
- The [browser driver](../repros/stylesheet-graph-browser.mjs) invokes the real Rust graph renderer via the corpus test, then serves its returned CSS assets in Chromium/Firefox/WebKit, screen/print. All108comparisons PASS against original browser-loaded trees and explicit expected colors. This proves Rust graph/renderer behavior for the corpus; it is not native/Wasm ABI, directive compilation or existing host delivery evidence. [Results](../evidence/0113-graph-browser.log).
- Rebuilt native/compiler-Wasm through the host suite and reran the original public-session driver:10native/Wasm results agree, but60browser comparisons remain21PASS/39FAIL, including21wrong colors and18typed import refusals. This is direct evidence that the new graph has **not** repaired the existing public path. Keep BH-0004 open. [Public baseline](../evidence/0113-public-external-baseline.log).

## Validation and material errors

| Scope | Result |
|---|---|
| Compiler Rust |42PASS:26existing unit tests,8preserved0092import tests and8newgraph groups; [full](../evidence/0113-rust-full.log) |
| Public compiler |132PASS, native/compiler-Wasm rebuilt; [host](../evidence/0113-host-tests.log) |
| Rust graph browser delivery |18cases ×2media ×3browsers =108PASS; [browser](../evidence/0113-graph-browser.log) |
| Clippy/lint/types/codegen |Compiler all-target/all-feature Clippy, compiler package lint/types and codegen --check PASS; [Clippy](../evidence/0113-clippy.log), [lint](../evidence/0113-host-lint.log), [types](../evidence/0113-host-types.log), [codegen](../evidence/0113-codegen.log). Rust crate has no npm lint; Clippy covers it |
| Existing local import delivery |96actual public-file compiler/browser comparisons PASS after using tsx; [final](../evidence/0113-local-browser-final.log) |
| Formatting |Scoped Rustfmt with the workspace's edition2024 PASS; [final](../evidence/0113-fmt-final.log) |

- First new test used the wrong reference field `filename` instead of existing `file`; compilation failed before tests ran. Corrected test material passes. [First](../evidence/0113-graph-first.log), [corrected](../evidence/0113-graph-corrected.log). No product finding derives from that setup error.
- The initial standalone Rustfmt check omitted edition2024 and proposed a different import sorting style. Retried with the actual edition; existing source was not reformatted to satisfy the wrong invocation. [Initial](../evidence/0113-fmt.log).
- The initial0092browser rerun invoked plain Node, then the TypeScript compiler-API compatibility wrapper; neither resolves extensionless TS source imports. Both exited before browser work. The proper command is `node --import tsx .ai/audits/bug-hunt/repros/import-conditions-browser.mjs`. These invocation failures are not product regressions; original logs are preserved as0113-local-browser.log and0113-local-browser-corrected.log.
- Runtime/engine semantics and runtime artifacts are untouched by this implementation; no runtime benchmark is required for this compiler-only graph addition. No runtime speedup, payload or memory improvement is claimed. No dependency, lockfile, generated protocol, existing fixture/snapshot, CI/release or foreign Site edit.

## Required continuation

1. Finalize the graph-to-compiled-stylesheet contract in Rust, including native CSS/directive lowering and manifest ownership across files. The current renderer preserves raw non-import CSS; it does not compile Master directives. Keep existing safe local/public behaviors while making actual entrypoints consume boundary-preserving output.
2. Add native/compiler-Wasm protocol and transport, generated through xtask rather than manual generated edits. Trace through Node `node-compiler.ts`, Rust/Node project compilation and stylesheet orchestration. Existing `analyzeCSSDependencies` still uses the older lexical import discovery; align prepared host edges with the new decoded import specifiers before claiming escaped-import support at host level.
3. Preserve non-import relative URL bases when assets move. Current renderer deliberately leaves declaration URLs unchanged and requires host base preservation; the browser corpus has no relocated image/font dependency. Add image/font/custom-property/fragment/query URL controls and implement compiler-owned URL analysis plus host resolution/emission. Do not count the current asset-path demonstration as arbitrary URL rebasing support.
4. Wire all required build/CLI consumers to emit and reference the returned stylesheets. Fields ignored by a consumer do not constitute support. Verify actual public compiler/file/project/build delivery using the original0112cases, the expanded18-case corpus and0092local controls; include import dependencies/reload behavior and native/Wasm parity.
5. Continue the other13unresolved findings,10blocked coverage requirements, four root failures and the three unclassified candidates. The new Rust-only output is partial progress, not a replacement definition of completion.

- Goal remains active;31fixed/13unresolved,65checked/10blocked. All original IDs and paused identity-dependent work remain unchanged. Final tool status, preserved hashes and local-regression completion are recorded in0113-final-checks.json before handoff.

- Final0092local public-file regression rerun completed96PASS (32each Chromium/Firefox/WebKit). All jobs are terminal. Completed engine/test and excluded0092test/Site hashes remain unchanged; final source hashes, inventory and completion limits are in0113 evidence. HEADbece2e120/index empty; no commit/push.

## 後續提交範圍

依使用者提交已完成部分的指示，本批帳本、證據及重現材料納入以 bece2e120 為父提交的調查提交；產品／測試實作仍未提交。上文「未提交」是批次結束當時狀態。重現依賴工作區未提交的 graph 實作與 corpus；來源雜湊及未完成交付事項保持有效，BH-0004 不結案。
