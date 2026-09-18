# Batch 0267: BH-0004 authored layer order

## 目前交接點

0266訂正後，BH-0004的external面只剩`different-layers`一案可修。使用者授權按0266的收窄條件實作，本批交付（`e20f890aa`）。0038仍暫停。

## 修正

`resolve_css_import_graph_file`在展開完成後，於輸出最前面補一行依作者順序的`@layer`宣告。條件全部成立才輸出：

1. 確實有無法解析的import被提前（`preserved_imports`非空）；
2. 該stylesheet具名的layer **多於一個**；
3. 作者**沒有**自己寫過`@layer …;`宣告。

作者順序由`@layer name{…}`區塊與`@import … layer(name)`依原始位置合併去重取得；匿名layer無法具名，不納入。宣告置於輸出最前端而非第一個import的位置——否則當作者在import前就寫了`@layer base{…}`區塊時，宣告會落在區塊之後而失去意義（此情形由新測試`bh_0004_layer_blocks_take_part_in_the_authored_order`捕捉，初版實作確實踩到）。

```css
/* 作者 */
@import './local.css' layer(a);
@import 'https://cdn.example/remote.css' layer(b);

/* 展開後 */
@layer a, b;
@import 'https://cdn.example/remote.css' layer(b);
@layer a{.example{color:red}}
```

## 驗收

`repros/external-import-order.mjs`（10情境×2瀏覽器＝20觀察）：

| 情境 | 0266 | 0267 |
|---|---|---|
| different-layers | 0 PASS／2 FAIL | **2 PASS／0 FAIL** |
| external-first、predeclared-layers、nested-plain | 各 2／0 | 不變 |
| conditional-local | 1／1 | 不變 |
| same-layer、external-last | 各 0／2 | 不變（固有邊界） |
| nested-named／anonymous／supports-media | 各 0／2 | 不變（明確限制） |
| **合計** | **7 PASS／13 FAIL** | **9 PASS／11 FAIL** |

binding parity 10 PASS維持。[baseline](../evidence/0267-external-import-order.log)

0264的qualified矩陣不受影響，仍為60觀察／0失敗。[qualified](../evidence/0267-qualified-matrix.log)

## 驗證與回歸

`cargo fmt --check`、`cargo clippy --workspace --all-targets --all-features -D warnings`、`cargo test --workspace` **370 PASS／0 FAIL**（0264為364，本批新增6項）；28套件build PASS；`turbo run test lint type-check` 101／107。

`bug_hunt_import_qualifiers.rs`新增6項：提前的外部import釘住作者順序、單一具名layer不輸出宣告、未分層不輸出、作者已宣告不重複、`@layer`區塊參與順序、完全解析的graph位元組不變。

既有失敗以serial重跑，與baseline逐項相同：

| 套件 | 結果 |
|---|---|
| `@master/css-webpack` | **12 files／88 tests全PASS**（0266交付兩個patch後的狀態維持） |
| `@master/css-vite` | 23 FAIL／644 PASS，名稱與pre-promote baseline逐項相同 |
| `@master/css-nuxt` | 3 FAIL／7 PASS，同樣三項 |
| `@master/css-binding-wasm-compiler`／`-tooling` | 各1 FAIL |

平行執行另有webpack `bug-hunt-active-graph`一次性失敗與一次`type-check`因`--force`與build競態而失敗，單獨與serial重跑皆通過。[webpack](../evidence/0267-webpack-serial.log)；[vite](../evidence/0267-vite-serial.log)；[nuxt](../evidence/0267-nuxt-serial.log)

## 工作區修復（非產品變更）

0266起的install清掉孤立store目錄後，多個套件底下殘留的`node_modules/.bin` shim仍指向已被清掉的路徑（`packages/nuxt`的`vitest`最先暴露）。刪除所有`packages/*/node_modules`並以`--frozen-lockfile`重裝後全部恢復；lockfile未變動。

## 帳本

- BH-0004維持**已確認／部分修正**，external基準更新為9 PASS／11 FAIL。63historical、62fixed、1unresolved不變；65checked／10blocked不變；pendingApprovals為空；goal active。
- 剩餘：`same-layer`與未分層的2案為固有邊界、nested未解析外部import的6項為明確限制，兩者都不是可修缺陷；完整public／host graph遷移仍未完成。

[Final checks](../evidence/0267-final-checks.json)
