# Batch 0265: BH-0004 external import baseline classification

## 目前交接點

0264把BH-0004的qualified flatten+compile補到60觀察／0失敗後，該finding剩下的量測面就是`external-import-order`基準：交付後仍為7 PASS／13 FAIL、binding parity 10 PASS，且0264前後完全相同。本批不改產品，只把這13項失敗逐案分類，並用基準內既有的對照證明其中一組有明確可行的修法。0038仍暫停。

## 13項失敗分成三類

| 類別 | 案例 | 失敗數 | 說明 |
|---|---|---|---|
| A 明確限制（設計如此） | nested-named、nested-anonymous、nested-supports-media | 6 | 被匯入stylesheet自己含未解析的外部`@import`，而CSS不允許`@import`出現在條件／layer區塊內，因此無法內聯。已有明確錯誤訊息與專屬測試`bh_0004_unresolved_nested_import_is_an_explicit_limit_not_invalid_nested_css` |
| B layer順序可修 | same-layer、different-layers | 4 | 見下 |
| C 無layer可依（目前無解） | external-last、conditional-local | 3 | 外部與本地內容都未分層，純粹靠出現順序決勝；把外部`@import`提到最前面必然改變cascade，除非把外部資源抓下來內聯 |

## B類：基準自己證明了修法

同一份基準內的兩個案例只差一行：

| 案例 | 輸入 | 結果 |
|---|---|---|
| different-layers | `@import 'https://remote.test/external.css' layer(b);`＋`@layer a{.example{color:red}}` | **FAIL** |
| predeclared-layers | `@layer a,b;` 開頭，其餘完全相同 | **PASS** |

CSS的layer順序由首次出現決定。展開時外部`@import`被提到最前，layer `b`就先於layer `a`宣告，與作者順序（`a`在前）相反；一旦用`@layer a,b;`把順序釘住，提前就無害。因此B類的修法是明確的：展開時在輸出開頭補一行依作者順序排列的`@layer`宣告。本批只記錄結論，未實作——它會改變CSS輸出，屬獨立的授權範圍。

若B類照此修復，基準會從7 PASS／13 FAIL變成11 PASS／9 FAIL，剩下的就是A類的6項明確限制與C類的3項。

## C類為何無解

`external-last`（`@import './local.css';@import 'https://remote.test/external.css';`）與`conditional-local`（本地帶`print`條件）兩案中，外部與本地內容都不在任何layer裡。未分層樣式之間只有出現順序，而CSS要求所有`@import`必須位於其他規則之前，所以把外部import留在原位是非法CSS、提前又必然翻轉順序。唯一的正解是取得外部資源並內聯，那不是compiler的職責。這三項應視為展開的固有邊界，而非可修缺陷。

[基準](../evidence/0264-external-import-order.log)

## 帳本

- BH-0004維持**已確認／部分修正**。qualified面已於0264完成；external面本批分類為6項明確限制＋4項可修（layer順序）＋3項固有邊界。63historical、62fixed、1unresolved不變。65checked／10blocked不變；goal active。
- pending approvals：`existingWebpackTestContract`、`watchpackDependencyPatch`仍未授權、未交付。
- 下一步（需授權，因會改變CSS輸出）：展開時輸出依作者順序的`@layer`宣告以修B類4項；其餘為完整public／host graph遷移。

[Final checks](../evidence/0265-final-checks.json)
