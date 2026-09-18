# Batch 0243: Selector maps and persistent-cache publication boundaries

## 目前交接點

0242為progress：explicit source-preservation API及Next選用已在owned copies驗證，並補出sibling map與static export反例。本批opening確認662selected inputs／493shared artifacts／Next54source與64dist吻合0242。

本批只新增兩份audit repro，未修改任何產品或owned candidate source／dist。仍保留0242 API workspace及Next候選；原compiler對照期間只暫換Next自己的compiler symlink，所有讀者結束後已恢復連到`tmp/0242-source-preservation-api/packages/compiler`。Root產品、tests／fixtures、deps／lockfile／CI／release／Site及HEAD／空index不變。無commit，0038仍暫停。

## Selector provenance：兩個獨立損失階段

新`repros/next-selector-map-stages.mjs`直接呼叫公開`compileStylesheet`，接著呼叫目前安裝Next16.3.4真正的`CssMinimizerPlugin.optimizeAsset`，使用其原生PostCSS/cssnano及sourceAndMap輸入，不自行實作或替換optimizer。

五份固定原文：可合併的兩規則、原本就是selector list、巢狀media內可合併規則、不同宣告、Unicode／換行。每份獨立核對兩個selector的原始line／UTF-16 column及完整sourcesContent。

| compiler選項 | compiler階段 | Next optimizer後 |
|---|---|---|
| 預設false | 6anchors PASS／4FAIL | 6PASS／4FAIL |
| preserveNativeSource:true | 10PASS／0FAIL | 6PASS／4FAIL |

原生compiler的`output_mappings.rs`依minify後rule location產生mapping，沒有保留被合併的第二個selector位置；即使不合併，原本同rule的selector list也只有第一個起點。保留原文選項修正這些輸入錨點，但Next optimizer再次按PostCSS rule來源寫map，仍遺失不同selector位置。不同宣告的兩rule在兩段皆PASS。

因此把最終publication一律切到preserveNativeSource不能滿足全程per-selector map要求。未套用依CSS文字猜來源的修補，未改依賴或移除native optimizer。BH-0053保持未完成。初次repro呼叫不存在的webpack.init是腳本錯誤，修正後的直接API證據另存，無產品bug計數。

## Static export：由偶發轉成穩定cache反例

先把0242失敗`.next`複製回原fixture（原失敗副本仍保留，工作cache備份`tmp/0243-static-export-working-next`）；已有publication時重建PASS。這不能證明首次產生新revision沒問題。

新`repros/next-initial-publication.mjs`每次建立自己的fresh app，沿用同一app依序build：initial → 修改entry CSS新增`.updated{padding:13px}` → 刪除自己的published graph後重建。保留完整build log、回傳依賴、publication內容、兩頁HTML hydration links與輸出CSS；失敗即停止後續階段，避免用舊out當成功結果。

| 持久build cache啟用的對照 | initial | source修改後 |
|---|---|---|
| 0242 candidate，無instrumentation | PASS | FAIL |
| candidate＋callback追蹤 | PASS | FAIL |
| callback前使用this.fs.readFile | PASS | FAIL |
| 額外addContextDependency | PASS | FAIL |
| 原root compiler及預設binding | PASS | FAIL |
| 純Next＋最小寫檔loader，未載入Master | PASS | FAIL |
| candidate loader cacheable(false) | PASS | FAIL |
| 純Next loader cacheable(false) | PASS | FAIL |

8組相同轉移全部重現：Turbopack宣稱找不到新revision CSS。追蹤確認loader callback前精確檔案已存在、依賴已登記、metadata存在；host `this.fs.readFile`亦成功讀到1019bytes。不是只在process結束後才看見檔案。

純Next最小loader同步寫CSS到content-hashed檔名、addDependency，再回傳`@import`；不使用Master compiler、manifest或publication helper，同樣FAIL。這把反例縮到Turbopack持久build cache與loader執行期間新增import檔案的交互作用；不是0242 Rust API特有的回歸。這是host邊界的直接證據，不是宣稱Master交付責任已完成。

關閉`experimental.turbopackFileSystemCacheForBuild`後，candidate與pure各initial／changed-source／deleted-publications三階段全部PASS，共6build；`.updated`實際在輸出CSS，candidate两頁hydration manifests都存在。這只是因果對照，未改產品預設或使用者config。cache開啟時的deleted-publications階段因先前失敗尚未抵達，不能算通過。

另兩個早期initial-only builds成功，追蹤已確認callback前publication；其第一版hydration observer用了錯誤attribute，因此不引用它們作hydration驗證。後續lifecycle版已用正確`data-master-css-hydration-manifest`並有非空斷言。

安裝版Next文件及實作也已讀回：build filesystem cache預設true；loader emitFile／importModule不支援、fs僅readFile。未假設可借用Webpack emitFile完成Turbo輸出；未改native依賴。

## 下一步與保留

- 0244接續可獨立推進的PostCSS新global-reference closure：先驗證compiler既有emittedGlobals／resource session能否提供新增引用差集，並用Once修改／新增引用的反例約束流程。不得盲目重跑任意plugin或補回整份舊manifest覆寫已處理值。
- Map仍需能保留per-selector provenance的compiler／host處理；目前native optimizer反例保留。沒有以scope縮小或把限制列出就結案。
- Turbo交付需設計host可見的immutable publication生命週期，尤其warm cache新增revision。只禁用loader cache、加依賴或host read已排除；全域關閉cache不是本批交付。後續若需native依賴修正，依賴／lockfile限制不變。
- 不重跑已排除的同類對照；先評估host graph在native filesystem cache初始化前準備的正式生命週期，或host提供的virtual/source transport，並保留並行讀者、資源URL、Modules／Sass／watch語義。
- 原58個remaining條目逐字保留，追加本批取代說明。61／57／4及65checked／10blocked不變，pending approvals不變。其他raw、各hosts、root gates、Site、性能／長session與平台驗證全保留。

本批664selected sources（原662不變＋2新repros）、493shared artifacts不變，Next54／64與owned API source／artifacts不變。所有自建initial-publication fixtures已清理，沒有運行中的讀者或builder；goal active。

[Final checks](../evidence/0243-final-checks.json) · [Selector stages](../evidence/0243-selector-stages.json) · [Publication summary](../evidence/0243-publication-summary.json)
