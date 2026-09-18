# Batch 0251: Per-source position index for stylesheet compilation (BH-0062 fix)

## 目前交接點

0250確認BH-0062：每條規則的位置換算都從來源開頭掃描，stylesheet compile對規則數二次成長。本批在root `crates/mastercss-compiler`新增`source_index.rs`（每個來源建立一次line-start與256-byte UTF-16 checkpoint索引），並讓`output_mappings.rs`的Mapper、`refine_native_declaration_sources`、`native_rule_list_has_directives`與`NativeConditionalLowerer`改用索引；保留原本的掃描函式供其他呼叫端沿用，語義以窮舉對照測試固定。root產品變更5檔修改＋1新模組＋1新回歸測試；未改依賴、fixtures／snapshots、CI、release、Site或shared native／Wasm artifacts。0038仍暫停。

## 修正與驗證

| 檢查 | 結果 |
|---|---|
| `source_index`單元測試 | 對7段語料（含😀／ü、CRLF、空行、無換行長文本）窮舉全部byte、UTF-16與(line,column)組合，與`byte_to_utf16_offset`／`utf16_to_byte_offset`／`source_location`／`byte_offset_for_location`逐一相等；首版語料600規則跑249s，縮為48規則後0.54s [初版](../evidence/0251-source-index-tests-initial.log) [最終](../evidence/0251-source-index-tests.log) |
| 新回歸`bug_hunt_rule_count_scaling` | 500→4000個`@media`規則（單行與多行）要求比值<40且<10s；HEAD基準worktree跑同一測試：500規則1.34s、4000規則84.6s、比值63.4 FAIL；修後整個測試1.05s PASS [baseline](../evidence/0251-scaling-test-baseline.log) [fixed](../evidence/0251-scaling-test-fixed.log) |
| Rust | `cargo test -p mastercss-compiler`全部PASS（28 unit＋20 integration files）、project／cli／binding-native tests PASS、workspace clippy `-D warnings`、fmt、`cargo xtask codegen --check` PASS [compiler](../evidence/0251-cargo-test-compiler.log) [workspace](../evidence/0251-workspace-rust-checks.log) |
| root binding（owned tmp build） | 純CSS 200／400／800規則rendered 3.6／6.6／13.2ms（HEAD基準binding同機8.7／25／87ms，仍二次）；`@media`包裹4.9／9.8／19.3ms [fixed](../evidence/0251-shape-fixed.log) [baseline](../evidence/0251-root-baseline-binding.log) |
| root binding TS套件 | Next 0247副本151tests PASS；0244 compiler套件425PASS／3FAIL，3個失敗為`bug-hunt-preserved-source`依賴尚未promote的0242 native候選，HEAD基準binding同樣3FAIL，與本修正無關 [suites](../evidence/0251-suites-root-fixed.log) [detail](../evidence/0251-root-preserved-source-failures.log) |
| 0242候選＋修正（owned workspace） | 同一修正套用到0242候選副本並修正其`native_source.rs`每token anchor掃描：clippy／28＋integration tests PASS；compiler套件428／428、Next 151、e2e 3、真實Next Webpack added-global-reference雙瀏覽器PASS [build+suite](../evidence/0251-candidate-fixed2.log) [suites](../evidence/0251-suites-0242-fixed.log) [e2e](../evidence/0251-next-e2e-fixed.log) |
| 量測（0242候選＋修正） | rendered 800規則2.02s→16.8ms；preserveNativeSource 72.5s→96ms（首輪只修mapper時仍2.2s，定位到`native_source.rs`後修正）；resource hook 19KB／8 plugins 6.75s→109ms [cost](../evidence/0251-suites-0242-fixed.log) [hook](../evidence/0251-hook-cost-fixed.json) |

首次以root crates建的binding量到preserveNativeSource「19ms」是誤判：root沒有0242候選的preserveNativeSource實作，該選項被忽略；改以0242候選副本重量。0250的絕對數字來自48MB的0242 binding（未最佳化建置），本批比較以同機同建置為準，二次成長的結論不變。

## 帳本與交付

- BH-0062：root已修復；0242候選的對應delta為`repros/compiler-source-index-on-0242.patch`（8檔，base為`tmp/0242-source-preservation-api`，read-only apply check通過，未套用到候選）。
- 62historical／58fixed／4unresolved；65checked／10blocked、pending approvals不變；goal active。
- 未完成：其他`byte_to_utf16_offset`每token呼叫端（stylesheet_resources、stylesheet_graph、syntax、bundle）仍為線性掃描但未在profile中顯著；hook render次數最佳化；BH-0004／BH-0053與所有先前remaining。
- 執行環境：Mac端命令經`tmp/0247-runner`佇列；owned binding位於`tmp/0251-source-index/`，shared `packages/binding/artifacts`未重建。

[Final checks](../evidence/0251-final-checks.json) · [Inventory](../evidence/0251-inventory-summary.json)
