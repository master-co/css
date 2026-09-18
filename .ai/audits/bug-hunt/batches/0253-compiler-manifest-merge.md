# Batch 0253: Keyed manifest merges (BH-0062 stage three)

## 目前交接點

0252取樣顯示`@components`／`@utilities`／`@theme`定義在索引化後仍超線性，熱點在manifest合併。定位兩處線性搜尋：`manifest/variables.rs::push_variable`對每個變數重新走訪並重算所有既有變數的slot字串（含配置），mode變數另以`position`依name搜尋；`manifest/normalize.rs::merge_array_by`對next的每個元素在merged中`position`並為每個既有元素重算key字串（variables／variants／utilities合併皆用）。本批以`VariableTable`（slot→index）與`merge_array_by`的key索引取代線性搜尋，語義維持「第一個持有key的項目擁有slot、後續定義原位取代、無key者追加」。root產品變更2檔＋回歸測試擴充；未改依賴、fixtures／snapshots、CI、release、Site或shared artifacts。0038仍暫停。

## 驗證

| 檢查 | 結果 |
|---|---|
| 擴充回歸 | `bug_hunt_rule_count_scaling`新增theme與components形狀：lowering後以`compile_manifest_input_with_styles`合併兩次（第二次以第一次結果為base）。0252 HEAD基準worktree：theme 500定義128ms、4000定義6.0s、比值47.1 FAIL；components 179ms→7.9s、比值44.3 FAIL；修後5個測試8.0s PASS [baseline](../evidence/0253-scaling-tests-baseline.log) [fixed](../evidence/0253-scaling-tests-fixed.log) |
| Rust | compiler／project／cli／binding-native 144 tests、workspace clippy `-D warnings`、fmt、codegen check PASS [validation](../evidence/0253-validation.log) |
| root binding形狀 | 800個定義：`@components` 74→27ms、`@utilities` 71→22ms、`@theme` 61→16ms；url()／compose不變 |
| 0242候選＋patch | 候選131 Rust tests／clippy PASS；compiler套件428／428、Next 151／151；形狀與root一致 |

首版測試因theme定義以空字串串接（缺分號）與計數假設錯誤而失敗兩次，屬測試錯誤；改為theme用`;`串接並只要求合併後定義數不少於輸入數。

殘餘：`@components`在400→800仍約×2.6（27ms），不再是merge搜尋；候選點為`compile_utilities`或manifest驗證的複製，規模小，列為待查。

## 帳本與交付

- BH-0062保持已修復（第三階段）。0242候選delta更新為`repros/compiler-source-index-on-0242.patch`（14檔），read-only apply check通過，未套用。
- 62historical／58fixed／4unresolved；65checked／10blocked、pending approvals不變；goal active。

[Final checks](../evidence/0253-final-checks.json) · [Inventory](../evidence/0253-inventory-summary.json)
