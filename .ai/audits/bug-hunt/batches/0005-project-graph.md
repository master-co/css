# 0005 Compiler project graph consistency

- 目的：CSS entry/import/reference graph 到 compiler manifest/stylesheet 的正常、失敗與更新契約。
- 範圍：CRATE-mastercss-compiler、CRATE-mastercss-project、CRATE-mastercss-diagnostics、PKG-compiler。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；產品無變更，只有既有 audit/tests。
- 先讀 README/coverage 與 0003/0004；後續讀 project Cargo/AI、imports/lower/entries/resolution/tests。
- 預計命令：Rust project/diagnostics tests、fresh compiler Wasm、compiler package tests。測試寫檔位於 mkdtemp roots；不刷新 fixtures。
- 下一步：entry/import graph baseline 與 source tracing。

## 重要驗證

- compiler TS baseline：13 files / 123 tests passed；包含本機 package resolution、missing/circular reference、entry/merge/directives/stylesheet/diagnostics。[log](../evidence/0005-compiler-tests.log)
- Rust project 5 tests passed；diagnostics 結果見 [log](../evidence/0005-rust-tests.log)。fresh compiler Wasm build 成功。
- 疑點 BH-0004：Rust imports.rs:203 直接拼接 resolved stylesheet，可能丟失 @import 的 media/supports/layer qualifier。現有 qualifier tests 只涵蓋未展開的外部匯入，不足排除。

## BH-0004 — P1 已確認：展開匯入丟失條件與 cascade layer

- 定位：`crates/mastercss-compiler/src/imports.rs:201`；TS `node-compiler.ts:268` 準備 graph，Rust 只拼接 imported source。
- 觸發：entry `@import './child.css' print;`，child `.example{color:red}`；使用 public `compileManifestFileSync(entry, {classes:['example'],preserveNativeCSS:true})`。
- 預期：child CSS 保持 print 條件；實際：輸出無條件 `.example{color:red}`。`supports(display:grid)`、`layer(test)`、layer+media 同樣丟失。
- 影響：條件樣式在所有環境套用；有 layer 的匯入變成 unlayered，改變 cascade 優先序。不限特殊 manifest。
- 重現：`node --import tsx .ai/audits/bug-hunt/repros/BH-0004.mjs`，5 個 qualifier 對照。[log](../evidence/0005-import-qualifiers.log)
- 新測試：`crates/mastercss-compiler/tests/bug_hunt_import_qualifiers.rs`；`cargo test -p mastercss-compiler --test bug_hunt_import_qualifiers`：3 failed，exit 101。[log](../evidence/0005-qualifier-tests.log)
- 修正方向：Rust import graph 保留 import prelude 語意，以正確嵌套的 layer/supports/media 包裹展開內容；涵蓋匿名 layer、巢狀 import 及外部未展開 import，沿用 parser contracts。

## 已完成檢查與限制

- 已追蹤 entry discovery、CSS request path 清理、graph circular/missing errors、references 不輸出、merge precedence、source plans、diagnostics 版本/排序，配對既有測試通過。
- `cargo clippy -p mastercss-compiler --test bug_hunt_import_qualifiers -- -D warnings`：[log](../evidence/0005-clippy.log)。
- 本批完成；compiler/project/diagnostics 最低列明檢查完成，Windows 實機 filesystem 差異未實測，另由平台整合項目記錄。
- 下一批：0006 native/Wasm delivery、錯誤/版本/session 契約。
