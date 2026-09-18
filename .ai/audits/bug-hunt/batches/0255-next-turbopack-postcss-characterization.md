# Batch 0255: Turbopack PostCSS characterization and BH-0063

## 目前交接點

0247–0249的PostCSS resource policy只涵蓋Webpack原生loader路徑；0232起所有`postcss-*`實際host證據都是Webpack。本批以owned 0247副本在Turbopack（`next build`預設）跑同一組實際host情境，並加入不含PostCSS plugin的`module-animation`情境。沒有產品變更；repro新增`BH_NEXT_LOOSE_FILE_MATCH`（預設關閉，既有證據可重現）與`module-animation`情境。0038仍暫停。

## 首輪（嚴格檔名比對）與confound

7個情境×Master／pure×Chromium／WebKit全部build成功（pure child-global-resource因pure fixture缺`new%20image.svg`而build失敗，屬fixture限制），但除`postcss-composes`外觀察全部FAIL。檢查`postcss.jsonl`：Turbopack路徑下user plugin看到的檔名是`card.module.css.module.css`（Master Turbopack管線包裝後的模組）與`<hash>-entry.css.css`（Master產生的global entry），嚴格`endsWith('/card.module.css')`永遠不成立，plugin根本沒有執行編輯。pure在含Master指令的情境本來就不適用（原文含`@theme`／`@compose`）。[strict](../evidence/0255-turbo-matrix-strict.log)

## 第二輪（寬鬆比對）：Turbopack契約差異

| 情境 | Turbopack（Master） | 分類 |
|---|---|---|
| postcss-global-context | plugin分別在Module與global entry各跑一次，從未同時看到local與global；`--color-audit`維持#111，未套用#123456 | combined-root契約不存在（Webpack有，0237） |
| postcss-added-global-reference | plugin的`background-image:var(--image-audit)`落在Turbopack殘留的空Module規則`.card-module-css-module__…__direct{}`，Master lowered輸出未收到編輯，theme變數未補入，background none | user PostCSS作用在Turbopack側模組，不在Master lowered root；late resource policy無法介入 |
| postcss-global-resource／child-global-resource | 資源URL與顏色正確，pass=false只因predicate要求`?rev=1`（Turbopack asset丟棄query） | 與0248 pure相同的query差異，功能正確 |
| postcss-generated-keyframe／imported-keyframe | animation名稱被Turbopack CSS Modules改為`card_fade__…`／`other_fade__…`，最終CSS沒有任何`@keyframes`，`getAnimations()`無frames | 見BH-0063 |
| Webpack控制 postcss-global-context（寬鬆比對） | 2browser PASS | 寬鬆比對未改變Webpack結果 |

[loose](../evidence/0255-turbo-matrix-loose.log) [summary](../evidence/0255-turbopack-summary.json)

## BH-0063：Turbopack Module引用Master global animation失效

無PostCSS plugin的`module-animation`情境（`.direct{animation:fade 1s linear infinite}`，`fade`為preset animation）：

| 組合 | animation-name | keyframes | 結果 |
|---|---|---|---|
| Webpack＋Master | `fade` | `@keyframes fade{0%{opacity:0}to{opacity:1}}`，2 frames | 正常 |
| Turbopack＋Master | `card_fade__leUQF` | 無`@keyframes`；另出現空的`.card-module-css-module__…__fade{}` | 動畫不執行（Chromium／WebKit） |
| Turbopack pure／Webpack pure | 作用域化名稱、無keyframes | 無Master時本來就沒有`fade`定義，屬對照 |

Master的Turbopack管線沒有0237在Webpack路徑的global animation保護（`nextGlobalAnimationReferences`／`:global()`），且global `@keyframes fade`未被交付到最終CSS，animation名稱還被當作Module export。新增BH-0063（P1，已確認、未修復）。[runs](../evidence/0255-module-animation-runs.log)

## 帳本

- 62→63historical、58fixed、4→5unresolved；65checked／10blocked、pending approvals不變；goal active。
- 下一步：0256在owned副本修Turbopack路徑的global animation引用與keyframes交付，以`module-animation`雙bundler雙瀏覽器為驗收；PostCSS combined-root與late resource在Turbopack仍為契約差異，需另行設計。

[Final checks](../evidence/0255-final-checks.json)
