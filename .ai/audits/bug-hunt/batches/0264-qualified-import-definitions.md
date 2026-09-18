# Batch 0264: BH-0004 qualified import definitions

## 目前交接點

0263把BH-0004低層`direct`路徑的20項失敗化約為單一根因（definition directive被native at-rule包住就無法lowering），並指出正確修法在`imports.rs`展開qualified import時把child的definitions留在wrapper外。本批交付該修正（`fc879fad4`）。0038仍暫停。

## 修正

`resolve_css_import_graph_file`在wrapper非空（即import帶`layer()`／`supports()`／media query）時，先用`extract_top_level_at_rule_blocks`取出被匯入stylesheet頂層的`@settings`／`@theme`／`@custom-variant`／`@defaults`／`@components`／`@utilities`區塊，以`MappedSource::slice`切出（保留原有copied source spans），輸出在prefix之前；其餘內容照舊包進wrapper。無qualifier的import完全不走這條路徑。

展開結果（`layer(cards) supports(display:grid) screen`）：

```css
@utilities{paint{padding:2rem}}
@supports (display: grid){@media screen{@layer cards{
.card{padding:3rem}}}}
.after{margin:1px}
```

definition回到頂層並保持全域，被匯入的規則仍受qualifier條件約束。

## 驗收

`repros/qualified-managed-matrix.mjs`（6種qualifier×compose開關×5條路徑＝60觀察）：

| 路徑 | 0263（修正前） | 0264（修正後） |
|---|---|---|
| direct-native | 2 PASS／10 FAIL | **12 PASS／0 FAIL** |
| direct-wasm | 2 PASS／10 FAIL | **12 PASS／0 FAIL** |
| prepared-native／prepared-wasm／rendered-node | 各 12／0 | 各 12／0 |
| 合計 | 60觀察／20失敗 | **60觀察／0失敗** |

native與Wasm一致（兩個binding都已重建）。[修正後](../evidence/0264-qualified-matrix-after-hoist.log)

新增3項Rust測試於`bug_hunt_import_qualifiers.rs`：qualified import保留被匯入definitions在頂層、多個definition family都hoist且相對順序不變、unqualified import輸出完全不變。該檔11項全PASS。

## 驗證與回歸

`cargo fmt --check`、`cargo clippy --workspace --all-targets --all-features -D warnings`、`cargo test --workspace` **364 PASS／0 FAIL**（0263為361，本批新增3項）、`cargo xtask codegen --check`、`cargo xtask parity` 皆通過；28套件build PASS；`packages/compiler` 57 files／428 tests PASS；`packages/next` 24 files／152 tests PASS；`turbo run test lint type-check --filter="./packages/*"` 102／107 successful。

既有失敗以serial重跑，與pre-promote baseline逐項相同，本批未新增任何失敗：

| 套件 | serial結果 | 與baseline |
|---|---|---|
| `@master/css-vite` | 23 FAIL／644 PASS | 失敗名稱逐項相同 |
| `@master/css-nuxt` | 3 FAIL／7 PASS | 相同三項 |
| `@master/css-webpack` | 2 FAIL／86 PASS | 相同兩項（未授權的test contract patch） |
| `@master/css-binding-wasm-compiler`／`-tooling` | 各1 FAIL | 相同 |

[vite](../evidence/0264-vite-serial.log)；[nuxt](../evidence/0264-nuxt-serial.log)；[webpack](../evidence/0264-webpack-serial.log)；[全套件](../evidence/0264-all-checks.log)

`external-import-order`基準未受影響，修正前後同為7 PASS／13 FAIL、binding parity 10 PASS。[external](../evidence/0264-external-import-order.log)

## BH-0004剩餘範圍

qualified flatten+compile已完成。仍未完成：`external-import-order`的外部import hoist（含nested未解析import的明確限制）、以及完整public／host graph遷移。BH-0004維持**已確認／部分修正**。

## 帳本

- BH-0004維持部分修正並更新驗收數字：qualified矩陣60觀察／0失敗（原20失敗）。63historical、62fixed、1unresolved不變。65checked／10blocked不變；goal active。
- pending approvals：`existingWebpackTestContract`、`watchpackDependencyPatch`仍未授權、未交付。
- 下一步：external import展開順序與nested未解析import；完整public／host graph遷移。

[Final checks](../evidence/0264-final-checks.json)
