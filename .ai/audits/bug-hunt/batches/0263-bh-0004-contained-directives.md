# Batch 0263: BH-0004 direct-path root cause and directive diagnostics

## 目前交接點

0262後BH-0004是唯一未解finding。其帳本文字停在0242（「仍為owned候選」），實際上source-preservation已於0258交付；低層`direct` flatten+compile的20項失敗也只有「20FAIL/4PASS」這個從0188起沿用的數字。本批在交付後的主工作樹重新量測，定位單一根因，並交付一項診斷修正（`90eea4fd8`）。BH-0004本身仍未解，未宣稱修復。0038仍暫停。

## 交付後基準（重新量測）

`repros/qualified-managed-matrix.mjs`：6種qualifier×compose開關×5條路徑＝60觀察。

| 路徑 | 結果 |
|---|---|
| prepared-native／prepared-wasm／rendered-node | 各 12 PASS／0 FAIL |
| direct-native／direct-wasm | 各 2 PASS／10 FAIL |

失敗全部落在有qualifier的10格（`layer`、`layer(cards)`、`supports(...)`、`screen`、三者併用 × compose開關）；無qualifier的2格通過。[修正前](../evidence/0263-qualified-matrix-before.log)

## 單一根因

新增`repros/contained-directive-shapes.mjs`逐一測試巢狀形狀：

| 形狀 | 結果 |
|---|---|
| `@utilities`在頂層 | PASS |
| `@layer cards{.card{…}}`（無directive） | PASS |
| `@layer cards{@utilities{…}…}` | FAIL |
| `@media screen{@utilities{…}…}` | FAIL |
| `@supports (display:grid){@utilities{…}…}` | FAIL |
| flatten後的完整形狀 `@supports{@media{@layer{@utilities{…}…}}}` | FAIL |

20項失敗全部化約為同一件事：**Master definition directive被包在native at-rule裡就無法處理**。`imports.rs`的flatten是文字包裹——`imported_css_wrappers`產生`@supports{@media{@layer{`前綴後把child整段（含child自己的`@utilities`）塞進去——因此凡是帶qualifier的import，只要child有directive就必然踩到。無qualifier時沒有包裹，所以通過。[形狀對照](../evidence/0263-contained-directive-shapes.log)

## 交付：診斷修正（`90eea4fd8`）

`directives.rs`原本只在`parser.nested_directive`（Lightning CSS只對style rule巢狀回報`is_nested`）擋下巢狀directive並給出`@X must be top-level`。container at-rule不算nested，於是directive以Custom rule留在樹上，最後由printer丟出沒有來源範圍的`CSS_PRINT_ERROR: Printer error`。

新增`contained_directive`掃描已解析的rule tree，對container at-rule內的directive改丟既有的`@X must be top-level`（`CSS_DIRECTIVE_ERROR`，附來源範圍）。definitions本來就是全域的，因此只改「回報哪個錯誤」，不改任何成功案例。

- 新測試`crates/mastercss-compiler/tests/bug_hunt_contained_directives.rs` 4項PASS（三種container、flatten完整形狀、名稱正確、頂層directive與container並存仍編譯）。
- 修正後矩陣：失敗數不變（20），但native與wasm**都**回報`CSS_DIRECTIVE_ERROR: @utilities must be top-level`，取代原本的40筆`CSS_PRINT_ERROR`。native/wasm parity維持（wasm已一併重建）。[修正後](../evidence/0263-qualified-matrix-after.log)
- 依AGENTS.md更新`site/app/[locale]/guide/directives/contract.mdx`：說明六個definition directive必須頂層、巢狀會回報`@X must be top-level`，且qualified import的wrapper不會讓被匯入stylesheet的definitions變成條件式。

## 驗證

`cargo fmt --check`、`cargo clippy --workspace --all-targets --all-features -D warnings`、`cargo test --workspace` 361 PASS／0 FAIL；`packages/compiler` 57 files／428 tests PASS；28套件build PASS；`turbo run test lint type-check --filter="./packages/*"` 101／107 successful。

既有失敗與0258 baseline一致（serial）：vite 23 FAIL／644 PASS（與pre-promote baseline逐項相同）、nuxt 3、webpack 2、wasm-compiler 1、wasm-tooling 1。平行執行另有6個BH-0004 watch／recovery測試與webpack type-check的暫時性失敗，改serial或單獨重跑後皆通過，屬本機平行執行假象。

## BH-0004仍未解

本批沒有修好flatten。真正的修法是讓`imports.rs`在包裹qualifier時把child的definition directive留在wrapper外（definitions是全域宣告，不該被條件化），這會動到`MappedSource`的切片與來源對映，屬BH-0004完整public／host graph遷移的一部分，需獨立設計與授權範圍。`external-import-order`基準本批未變。

## 帳本

- BH-0004維持**已確認／部分修正**，並更新為：source preservation已於0258交付（不再是owned候選）；direct路徑20項失敗已化約為單一根因並取得精確診斷。63historical、62fixed、1unresolved不變。65checked／10blocked不變；goal active。
- 下一步：`imports.rs` flatten時hoist child definitions；`external-import-order`的39項外部import仍未處理。

[Final checks](../evidence/0263-final-checks.json)
