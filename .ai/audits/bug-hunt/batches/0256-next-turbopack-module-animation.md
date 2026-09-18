# Batch 0256: Turbopack Module global animation candidate fix (BH-0063)

## 目前交接點

0255交付的下一步：在owned副本修Turbopack路徑的global animation引用與keyframes交付，以`module-animation`雙bundler雙瀏覽器為驗收。本批在owned副本`.ai/audits/bug-hunt/tmp/0256-turbopack-animations`（0247副本延續，`packages/next/src`共31檔）完成候選修復並通過驗收。主工作樹沒有產品變更；候選未交付。repro `next-module-edge-host.mjs`只調整`expectedAnimation`斷言：`keyframeContext`情境仍要求plugin改寫後的`opacity:0.25`，無plugin情境只要求`getAnimations()`有frames（原斷言對無plugin情境永遠不成立，屬harness錯誤）。0038仍暫停。

本批前半（候選實作、baseline／fixed對照、4個PostCSS情境重跑）在chat cowork完成；本會話重驗候選目前狀態、分類剩餘FAIL並記錄帳本。

## 候選修復（owned副本）

- `packages/next/src/prepare-global-module.ts`：新增`nextGeneratedGlobalAnimations(generatedCSS)`，用Next自帶的postcss／postcss-value-parser從Master `generatedCSS`取出單一名稱的`@keyframes`（preset animation）；作者自己的`@keyframes`不在其中，維持Module作用域，與純CSS Modules一致。
- `packages/next/src/prepare-entry-graph.ts`：無host PostCSS（`options.preprocessed`為假，即Turbopack預設）分支改為先`compileRenderedStylesheet`取得manifest，再以`globalAnimations`建立第二個module graph，transform回傳`{ source, sourceMap, globalAnimations }`。既有`prepare-module-graph.ts`／`prepare-module.ts`（0237）的接線在`scoped`時插入`nextGlobalAnimationReferences` plugin，把Next已標記的`:local(fade)`還原為`fade`，並讓rendered entry繼續輸出`@keyframes fade`而不被Turbopack當成Module export。
- 有host PostCSS的分支（Webpack路徑）不變；`protectNextGeneratedGlobals`沿用`knownAnimations`。

## 驗收：`module-animation`（無PostCSS plugin，`.direct{animation:fade 1s linear infinite}`）

| 組合 | animation-name | frames | 結果 |
|---|---|---|---|
| Turbopack＋Master baseline（候選關閉） | `card_fade__leUQF` | 0 | FAIL（Chromium／WebKit）[baseline](../evidence/0256-final-baseline-turbopack-module-animation.json) |
| Turbopack＋Master fixed（cowork 11:15） | `fade` | 2（opacity 0→1） | PASS（Chromium／WebKit）[fixed](../evidence/0256-final-fixed-turbopack-module-animation.json) |
| Turbopack＋Master recheck（本會話，副本目前狀態） | `fade` | 2 | PASS（Chromium／WebKit）[recheck](../evidence/0256-recheck-turbopack-module-animation.json) |
| Webpack＋Master baseline／fixed／recheck | `fade` | 2 | 全PASS，無回歸 [baseline](../evidence/0256-final-baseline-webpack-module-animation.json) [fixed](../evidence/0256-final-fixed-webpack-module-animation.json) [recheck](../evidence/0256-recheck-webpack-module-animation.json) |

副本的兩個候選檔在11:15 fixed證據之後（11:21）仍有編輯，因此以本會話recheck作為候選目前狀態的驗收依據；baseline由同一repro、候選關閉時產生。

## 剩餘Turbopack FAIL分類（候選開啟）

| 情境 | 0255（修復前） | 0256（修復後） | 判定 |
|---|---|---|---|
| postcss-composes | PASS | PASS | 不受影響 |
| postcss-generated-keyframe | `card_fade__leUQF`、0 frames | `fade`、2 frames（opacity 0→1） | BH-0063症狀已消除；殘餘FAIL只因predicate要求user plugin把combined-root `@keyframes fade`的`opacity:0`改為`0.25` |
| postcss-imported-keyframe | `other_fade__MHG7W`、0 frames | `fade`、2 frames | 同上 |
| postcss-global-context | `--color-audit`未解析（`rgb(17,17,17)`） | 完全相同 | 修復前後一致，無回歸 |

三者殘餘失敗都落在0255已分類的「Turbopack沒有combined-root PostCSS契約」：user plugin在Turbopack下分別看到Module與global entry，從未同時看到local與global，`keyframeContext`／`globalContext`的plugin變更不會發生。不新增finding；仍需另行設計，不在BH-0063範圍。[generated](../evidence/0256-turbopack-postcss-generated-keyframe.json) [imported](../evidence/0256-turbopack-postcss-imported-keyframe.json) [global](../evidence/0256-turbopack-postcss-global-context.json) [composes](../evidence/0256-turbopack-postcss-composes.json)

## promote範圍評估（未執行）

BH-0063候選只涉及兩個函式，但所在檔案主工作樹不存在：owned副本`packages/next/src`比主工作樹多13檔約800行（`prepare-entry-graph`、`prepare-global-module`、`prepare-module`、`prepare-module-graph`、`prepare-postcss`、`postcss-request-plugins`、`postcss-resource-policy`、`stylesheet-delivery`、`stylesheet-input-loader`、`stylesheet-map-loader`、`stylesheet-source-loader`、`webpack-css-loader`、`webpack-postcss-loader`），另改`index.ts`／`stylesheet-loader.ts`／`webpack-stylesheets.ts`／`static-publication.ts`約63行。promote等於交付0232–0256整套Next PostCSS／module pipeline候選；副本沒有`tests/`目錄，候選從未跑過`packages/next`測試套件。使用者決定先不promote，照舊記錄。

## 帳本

- 63historical、58fixed、5unresolved不變；BH-0063改為「已確認／owned候選修復」，比照BH-0004。65checked／10blocked、pending approvals不變；goal active。
- 下一步：promote另開一批，先把候選搬進含`tests/`的完整副本跑`packages/next` lint／types／build與測試套件、e2e，通過再談交付；Turbopack combined-root PostCSS與late resource契約仍需另行設計。

[Final checks](../evidence/0256-final-checks.json)
