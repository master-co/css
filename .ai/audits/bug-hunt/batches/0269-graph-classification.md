# Batch 0269: BH-0004 graph classification and flattening retirement

## 目前交接點

0268釐清BH-0004剩餘範圍後，使用者授權執行完整計畫。本批交付計畫的步驟1、2、5：分類改走保留邊界的圖、退場兩個零呼叫者的攤平API、更新契約文件。步驟3（binding surface去留）依計畫採保留。0038仍暫停。

## 步驟1：分類改走import graph（`690671b99`、`efa311688`）

### 問題

`resolveStylesheetSync`在`preserveImports`為假時用`resolveMasterStyleSource`——把整個import graph攤平成單一字串來判斷stylesheet的kind。攤平無法把`@import`放進qualifier的區塊，於是**分類階段就直接失敗**，而兩個host接著都是用保留邊界的delivery路徑編譯，那條路徑本來就吃得下這個形狀。

新增`repros/stylesheet-classification-parity.mjs`逐形狀對照：

| 形狀 | 攤平分類 | 圖分類 |
|---|---|---|
| plain entry／local import／qualified import／plain css／theme only／local directives only | 與圖分類**完全相同** | 同左 |
| `@import "./child.css" layer(cards);`＋child自帶外部`@import` | **THROW** `CSS_IMPORT_ERROR` | `entry` deps=2 |
| 同上但用匿名`layer` | **THROW** | `entry` deps=2 |
| `@import "@master/css"`＋qualified external child | **THROW** | `entry` deps=2 |
| child宣告local directives（`.child{@compose …}`） | `plain` deps=1 | **`local`** deps=2 |
| `@import "@master/css"` | `entry` deps=7（展開preset套件） | `entry` deps=1 |

兩處差異都對圖分類有利：`local`那筆正是既有測試`bug-hunt-imported-local-classification.test.ts`斷言的答案（`expect(resolution?.kind).toBe('local')`），攤平的`plain`會讓root不被transform。deps 7 vs 1是`expandPackageImports`差異，preset CSS位於node_modules且build期間不變，`collectStylesheetDependencies`本來就不展開套件；無測試依賴該形狀。[對照](../evidence/0269-classification-parity.log)

### 交付

`packages/next`（`static.ts`、`stylesheet-loader.ts`）與`packages/webpack`（`plugin.ts`、`stylesheet-loader.ts`、`utils/transform-style-source.ts`）的分類呼叫一律改為`preserveImports: true`。Vite自搬到delivery後就是這樣分類。`plugins/style-entry.ts`的loader選項**不動**——它同時決定`transformStyleSource`走async-with-resolver或sync，不只是分類。

### 順帶修掉的既有缺陷（`efa311688`）

切過去後Next有5個Sass診斷測試失敗，追出來是圖分類本身的bug：`classifyPreparedStylesheet`檢查本地指令時呼叫`hasLocalStyleDirectives(source)`**沒有傳檔名**，於是分類期間拋出的指令診斷被歸到compiler預設的`master.css`，而不是真正的檔案。Sass partial裡的`@compose "block"`因此報在`master.css`。改為傳入每個檔案的id，`delivery.ts`共用同一helper的地方一併修正。這是既有缺陷，Vite也受影響，只是我的切換把它曝出來。

## 步驟2：退場兩個零呼叫者的攤平API（`a2f5b2465`）

- `packages/compiler/src/node-compiler.ts` `compileCSSFile`——攤平後compile，repo內零呼叫
- `packages/compiler/src/stylesheet/render-source.ts` `prepareRenderedSource`——死碼

兩者都不在`package.json`的`exports` map內（`node-compiler`與`render-source`都不是published entry），消費端取不到。移除前後跑`check:api-census`與`check:packages`：**兩道gate在改動前就已失敗**（census base=1、packages base=1），且兩份log都沒有提到這兩個名字，屬0114起記錄的既有root gate，與本批無關。[census](../evidence/0270-census.log)；[census base](../evidence/0270-census-base.log)

## 步驟3：`resolveCSSImportGraph` binding surface保留

步驟1、2後repo內僅存兩個使用者：`packages/preset/scripts/generate-default-manifest.ts`（四個本地無qualifier的`@import`，屬通過形狀）與`repros/external-import-order.mjs`（量測用）。依計畫採選項A保留為低階API——退場收益小，且要動公開API gate，風險不成比例。

## 步驟5：契約文件

`site/app/[locale]/guide/directives/contract.mdx`新增說明：kind與編譯輸出都以保留邊界的圖為準；帶qualifier匯入自身含遠端`@import`的stylesheet是支援的，只有必須把圖壓成單一檔案的展開才會拒絕。

## 驗證

| 檢查 | 結果 |
|---|---|
| `packages/compiler` | **58 files／438 tests PASS**（新增`bug-hunt-graph-classification.test.ts` 10項） |
| `packages/next` | **25 files／155 tests PASS**（新增3項host回歸）＋3 e2e PASS |
| `packages/webpack` | 12 files／88 tests PASS |
| 28套件build | PASS |
| `turbo run test lint type-check` | 102／107 |
| BH-0004實際host（Turbopack `module-animation`） | Chromium／WebKit皆PASS |

既有失敗serial下與baseline逐項相同：vite 23 FAIL／644 PASS（名稱完全相同）、nuxt 3 FAIL／7 PASS、wasm各1。

**新測到的間歇性失敗**：`packages/webpack/tests/bug-hunt-active-graph.test.ts`在serial下也會偶發失敗（單檔連跑3次為2 FAIL／PASS／PASS；完整套件連跑4次為PASS／PASS／1 FAIL／PASS）。0267就曾見過同檔另一個案例一次性失敗後重跑通過。屬watch時序flake，非本批造成，已記錄待查。[flake](../evidence/0270-webpack-flake.log)

## 基準

`external-import-order` 18 PASS／22 FAIL（40觀察）與qualified矩陣60觀察／0失敗**均未變動**——這兩支repro直接量測compiler API，不經host分類，因此步驟1、2不會移動它們。步驟1的收益在host端，由新增的Next回歸測試捕捉。

## 帳本

- BH-0004維持**已確認／部分修正**：計畫步驟1、2、3、5完成；步驟4的重新量測即上表。剩餘為`same-layer`／未分層／nested未解析外部import三類非可修缺陷，以及尚未逐項重跑的完整host／watch矩陣。
- 63historical、62fixed、1unresolved不變；65checked／10blocked不變；pendingApprovals為空；goal active。

[Final checks](../evidence/0269-final-checks.json)
