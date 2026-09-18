# Batch 0270: BH-0004 corpora re-measurement

## 目前交接點

0269交付計畫步驟1、2、3、5後，步驟4要求「以遷移後的真實consumer重跑三組語料」。0269只跑了`external-import-order`與qualified矩陣；本批補齊另外三支瀏覽器語料。沒有產品變更；三支repro與0268同樣修掉「單一瀏覽器啟動失敗就整輪中止」，另兩支改指向built output。0038仍暫停。

## repro修正

| repro | 修正 |
|---|---|
| `import-conditions-browser.mjs` | 讀`BH_BROWSERS`（預設三瀏覽器）；啟動失敗只記錄不中止；import由`packages/compiler/src/node.ts`改為`dist/node.js` |
| `compiled-stylesheets-browser.mjs` | 同上；import由`src/index.ts`改為`dist/index.js` |
| `stylesheet-graph-browser.mjs` | 同上（本來就用dist） |

兩支原本直接載入TS來源，在目前的Node／tsx組合下會因compiler內部的無副檔名相對import而`ERR_MODULE_NOT_FOUND`，與本次遷移無關；改用built output後即可執行，量測對象也因此就是實際交付的程式碼。

## 結果：三組語料全數通過

| 語料 | 範圍 | 結果 |
|---|---|---|
| `import-conditions-browser`（0092本地條件控制） | 8情境×2 media×2 viewport×2瀏覽器 | **64 comparisons，全PASS**（Chromium 153.0.8010.12 32、WebKit 26.6 32） |
| `compiled-stylesheets-browser`（0114 public `compileStylesheets`） | 21 cases | **84 comparisons／0 failures** |
| `stylesheet-graph-browser`（0113 Rust graph renderer） | 18 cases | **72 comparisons／0 failures** |

本機Firefox自0227起啟動失敗，三支都記錄`launched:false`並繼續；原始記錄的96／126／108為三瀏覽器數字，與此處的兩瀏覽器數字不可直接並列。[import-conditions](../evidence/0270-import-conditions-browser.log)；[compiled-stylesheets](../evidence/0270-compiled-stylesheets-browser.log)；[stylesheet-graph](../evidence/0270-stylesheet-graph-browser.log)

## 步驟4完整結果

| 量測 | 結果 |
|---|---|
| `external-import-order` | 18 PASS／22 FAIL（40觀察） |
| `qualified-managed-matrix` | 60觀察／0失敗 |
| `import-conditions-browser` | 64／0 |
| `compiled-stylesheets-browser` | 84／0 |
| `stylesheet-graph-browser` | 72／0 |
| Next實際host（Turbopack `module-animation`） | Chromium／WebKit PASS |
| 套件 | compiler 58files/438tests、next 25files/155tests＋3e2e、webpack 12/88、28套件build、102/107 tasks |

## 帳本

- BH-0004：計畫五個步驟全部完成。維持**已確認／部分修正**——剩餘為三類非可修缺陷（`same-layer`、未分層、nested未解析外部import）與尚未逐項重跑的完整host／watch矩陣。
- 63historical、62fixed、1unresolved不變；65checked／10blocked不變；pendingApprovals為空；goal active。

[Final checks](../evidence/0270-final-checks.json)
