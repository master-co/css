# Batch 0268: External baseline correction and BH-0004 scope re-measurement

## 目前交接點

0267後對BH-0004做完整回溯時發現兩處我自己造成的帳本失準，以及一項對剩餘範圍的重大誤判。本批訂正三者。沒有產品變更；repro `external-import-order.mjs`改為單一瀏覽器啟動失敗不中止整輪。0038仍暫停。

## 訂正一：external基準是**單一瀏覽器**，不是兩個

`external-import-order.mjs`原本硬寫`['chromium','firefox','webkit']`迴圈，任何一個`launch()`失敗就整輪拋出。本機Firefox自0227起`Could not find profile folder`，因此0263–0267的每一次執行都在Chromium跑完20筆後就中止，**WebKit從未執行**。

我在0267寫「10情境×2瀏覽器＝20觀察」——錯。實際是10情境×2 media（screen／print）×**1個瀏覽器**。逐筆核對證據檔可證：

| 證據 | chromium | firefox | webkit | 觀察數 |
|---|---|---|---|---|
| `evidence/0112-external-parity-browser.log`（原始基準） | 20 | 20 | 20 | **60** |
| `evidence/0264-external-import-order.log` | 20 | 0 | 0 | 20 |
| `evidence/0267-external-import-order.log` | 20 | 0 | 0 | 20 |

因此0263–0267記錄的「7 PASS／13 FAIL」與「9 PASS／11 FAIL」是**Chromium單一瀏覽器的子集**，與歷史的21 PASS／39 FAIL（三瀏覽器60觀察）**不可直接比較**。凡是把兩者並列敘述的地方都已改寫。

### repro修正與重新量測

改為讀`BH_IMPORT_ORDER_BROWSERS`（預設仍為三瀏覽器），且單一瀏覽器啟動失敗只記錄`browserFailures`並繼續。重跑後**WebKit自0186以來首次納入**：

| 範圍 | 結果 |
|---|---|
| Chromium＋WebKit，40觀察 | **18 PASS／22 FAIL** |
| Firefox | 啟動失敗，已記錄於`browserFailures`，不計入 |

逐案結果兩個引擎**完全一致**（每案的Chromium數字剛好加倍），這是新事實：此行為與排版引擎無關。

| 情境 | PASS／FAIL（2瀏覽器） |
|---|---|
| external-first、different-layers、predeclared-layers、nested-plain | 各 4／0 |
| conditional-local | 2／2 |
| external-last、same-layer | 各 0／4 |
| nested-named／anonymous／supports-media | 各 0／4 |

[證據](../evidence/0268-external-import-order.log)

## 訂正二：`remaining`前兩筆是自0189起逐字沿用的陳舊數字

`evidence/*-final-checks.json`的`remaining[0]`／`remaining[1]`自0189起被逐字複製到其後**93份**檔案，內容是：

> raw flatten+compile baseline remains21PASS/39FAIL and must not be called repaired.
> BH-0004 low-level native/Wasm qualified flatten+compile still20FAIL/4PASS

第二句在0264就已不成立（qualified矩陣60觀察／0失敗），第一句的21/39自0186後未再以相同條件量測。本批改寫這兩筆為當前事實，並註明量測範圍。

## 訂正三：剩餘範圍比「完整public／host graph遷移」這句話窄得多

逐一追查`resolve_css_import_graph`（產生單一字串的舊展開）今天還有誰在用：

| 呼叫點 | 用途 | 是否用到攤平後的文字 |
|---|---|---|
| `stylesheet/index.ts:167` → `public.ts:187`（`preserveImports`為假的分支） | **entry分類** | 是——成為`compilationSource` |
| `node-compiler.ts:207` `compileCSSFile` | 攤平後compile | 是，但**repo內零呼叫者** |
| `stylesheet/render-source.ts:9` `prepareRenderedSource` | — | **死碼，零呼叫者** |
| `node-compiler.ts:158` `resolveMasterCSSPackageImportGraph` | 套件歸屬判斷 | 否，只用`dependencies` |
| `packages/preset/scripts/generate-default-manifest.ts:53` | 產生預設manifest | 是（但preset的四個`@import`皆為本地且無qualifier，屬通過案例） |

**實際輸出CSS的路徑全部已在graph上。** `compileRenderedStylesheet`兩個分支都走Rust graph；差別只在結果可否維持多資產。關鍵是`inlineImports`**不是**舊的攤平——`graph_inline.rs`先跑`compile_css_stylesheet_graph`逐檔編譯，之後才選擇性內聯，且`output_mappings`全程保留；真正需要邊界時由`compiled-source.ts:37`丟`CSS_IMPORT_ERROR`拒絕。

仍在舊路徑上的是**分類**：`packages/next/src/`完全沒有`preserveImports`（`static.ts:85`、`stylesheet-loader.ts:69`一律攤平），`packages/webpack`則以`usesStylesheetDelivery`／`mode === 'static' && !development`決定。而`public.ts:228` `resolveUnflattenedStylesheet`已經是現成的graph版分類。

因此BH-0004的收尾不是「把所有consumer改寫」，而是：**把最後幾個分類呼叫點改走不攤平的分類、刪掉兩個無人呼叫的攤平API、再決定`resolveCSSImportGraph`這個binding surface的去留。** 詳見計畫。

## 帳本

- BH-0004維持**已確認／部分修正**。external基準改記為**18 PASS／22 FAIL（Chromium＋WebKit 40觀察）**，並註明與歷史60觀察基準不可直接比較、Firefox為本機環境失敗。qualified矩陣維持60觀察／0失敗。
- 63historical、62fixed、1unresolved不變；65checked／10blocked不變；pendingApprovals為空；goal active。
- 下一步：依訂正三的範圍執行分類路徑遷移與舊API退場。

[Final checks](../evidence/0268-final-checks.json)
