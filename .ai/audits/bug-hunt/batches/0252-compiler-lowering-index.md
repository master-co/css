# Batch 0252: Shared source indexes across native and managed lowering

## 目前交接點

0251修了mapping anchor後，形狀對照仍有三條二次成長路徑：`@compose`規則（每條規則的selector／directive／token reference各自從頭掃描）、`url()`資源引用（每個引用兩次UTF-16換算）與`@components`／`@utilities`定義（managed lowering的相同掃描）。本批把`SourceIndex`貫穿`native_style.rs`、`native_conditionals.rs`、`managed.rs`、`pattern.rs`與`stylesheet_resources.rs`，移除只剩測試使用的掃描函式`byte_offset_for_location`（保留為索引測試的oracle）與`selector_source_reference`；`SourceIndex`新增`selector_reference`。root產品變更9檔＋擴充回歸測試；未改依賴、fixtures／snapshots、CI、release、Site或shared artifacts。0038仍暫停。

## 驗證

| 檢查 | 結果 |
|---|---|
| 擴充回歸 | `bug_hunt_rule_count_scaling`新增compose與resources形狀（500→4000規則、單行／多行）；0251 HEAD基準worktree：compose 500規則2.01s、4000規則128.6s、比值63.8 FAIL（media／resources在debug下未超過門檻）；修後三個測試1.55s PASS [baseline](../evidence/0252-scaling-tests-baseline.log) [fixed](../evidence/0252-scaling-tests-fixed.log) |
| Rust | compiler／project／cli／binding-native 140 tests PASS、workspace clippy `-D warnings`、fmt、codegen check PASS [checks](../evidence/0252-workspace-rust-checks.log) |
| root binding形狀對照 | 同機release建置：url() 800規則153→14.6ms、`@compose` 562→79ms（0251前）／76ms；`@components` 154→74ms、`@utilities` 121→71ms（仍超線性，見下）、`@theme` 800變數58→61ms（未變） [baseline vs 0251](../evidence/0252-shape-root-baseline-vs-0251.log) [0252](../evidence/0252-shape-root-fixed.log) |
| 0242候選＋patch | 候選副本129 Rust tests／clippy PASS；compiler套件428／428、Next 151／151；形狀對照與root一致 [suites](../evidence/0252-candidate-suites.log) |

首次覆蓋owned binding時node被`Killed: 9`：macOS對原地覆寫的已載入dylib判定簽章失效；改為先刪除再複製，屬工具流程問題，已記錄。

## 剩餘超線性：manifest合併

`@components`／`@utilities`／`@theme`在索引化後仍約×3每倍增。以帶符號的owned binding取樣（`sample`）：熱點在`serde_json::Value`／`IndexMap<String, Value>`的clone_from、`get_index_of`、`to_vec`與`manifest::variables::variable_slot`，即manifest輸入合併時每個定義重複複製或線性查找，而非位置換算。800個定義約70ms、800個theme變數約60ms；規模較小，列為待查項（未新增finding ID，待定位確切複製點後再決定）。[sample](../evidence/0252-manifest-sample.log) [repro](../repros/compiler-manifest-sample-loop.mjs)

## 帳本與交付

- BH-0062保持已修復；本批為其第二階段。0242候選delta更新為`repros/compiler-source-index-on-0242.patch`（12檔，含`native_source.rs`），read-only apply check通過，未套用。
- 62historical／58fixed／4unresolved；65checked／10blocked、pending approvals不變；goal active。
- 未完成：manifest合併的超線性；`stylesheet_graph`／`syntax`／`bundle`等仍為每token線性掃描但未在profile顯著；hook render次數；BH-0004／BH-0053與先前remaining。

[Final checks](../evidence/0252-final-checks.json) · [Inventory](../evidence/0252-inventory-summary.json)
