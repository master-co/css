# 0156 Emitted globals 的條件匯入圖譜

## 基線、範圍與狀態

- 0155修復與驗證為有效進展；本批前194source hashes一致，HEAD9aefc18ac。沿用BH-0004必要修復目標，0038仍等待使用者明確身分確認。
- 本批修復compiler的emitted-globals蒐集及相應production啟動失敗。Development完整圖譜仍未交付，不能因metadata／production通過而結案BH-0004。

## 根因與修正

- Project manifest早已使用Rust逐檔圖譜，但createStyleEntryEmittedGlobals仍呼叫resolveMasterStyleSource攤平CSS。qualified local import的子檔保留external import時，在蒐集globals前就拋錯；未加qualifier的reference/native @compose控制也拋Invalid @compose class: paint。新4案例修前全FAIL（0156-globals-before.log）。
- 改用既有delivery的Rust compileCSSStylesheetGraph與reference解析，保留graph而不攤平。內部compileStylesheetMetadata以原檔file URL提供來源位置；產出的CSS與manifest只供globals計數，不作為交付資產或公開輸出。
- Metadata-only路徑不讀取resource bytes、不加入圖片發布依賴，實際資源交付仍由host驗證。CSS與reference檔案仍須存在，reference cycle仍報錯；reference-only native CSS不參與已發布globals，重複entry不重算。Sass根來源仍經原先preprocessStylesheet處理。
- compiler stylesheet/index.ts與delivery.ts兩個產品檔修改；新增5個API測試。公開exports/options不變，CSS／directive語義仍由Rust處理，未改Rust、bindings、fixtures、snapshots、依賴或CI。

## 驗證

- 27focused及compiler235tests／30files全部PASS；compiler lint/types/build PASS。Vite重建後，在BH_QUALIFIED=1下197tests／37files PASS，包含共用插件的四模式qualified builds；獨立factory的4個HTML build controls另PASS。
- Vite原範例build與Vite lint PASS；Site prepare/lint PASS（75warnings、0errors）。公開compiler README、Vite README及Site directive contract同步限定行為與development限制。
- 新vite-qualified-prerender.mjs：本機HTTP提供external CSS及其巢狀import；qualified本地子檔含native variable與相對SVG，root提供component及hydration。最終supports有效／無效各2production builds、18browser observations，合計4build／36browser全PASS。涵蓋兩模式、三瀏覽器、900→400→900 viewport；核對native與external樣式條件、component color、utility padding、單一master-css style及資源HTTP bytes／query。
- 第一輪48browser：18PASS／30FAIL。其中6個production窄視窗失敗是新腳本以outlineWidth=0判斷outline:none的錯誤；三瀏覽器實測style=none時仍可回報3px。原始source、logs及窄視窗／outline probes保留；修正以outlineStyle判定後完整production控制通過。

## 仍未完成與分類

1. **BH-0004 development graph**：首輪24個dev觀測皆FAIL。style.css由master-css:local-compose回傳500；HTTP error response明確指向resolveStylesheetSync→resolveMasterStyleSource→resolveCSSImportGraphSource舊攤平路徑。完整回應見0156-dev-error-response.txt。修改metadata解開啟動後，實際stylesheet交付仍使用舊路徑。
2. **新增待分類runtime URL候選**：progressive dev在/base/下另請求根目錄/@id/__x00__virtual:master-css-runtime並404。尚未以無qualified CSS的最小頁面獨立重現，不先分配確認finding ID或認定與BH-0004同根因。既有4候選保留，現在另有此1候選待分類。
3. **Nuxt下游**：首次並行測試有49102/49103等固定port碰撞與直接CSS文字失敗，為2FAIL／4PASS／4SKIP及suite setup failures；串行消除埠碰撞，但仍7PASS／3FAIL。三個case只fetch入口CSS並要求其中包含.box，實際入口為@import子CSS。必須跟隨published graph並用真實頁面核對樣式，再區分測試假設與產品交付；未修改既有測試／fixtures或宣稱Nuxt完成。
4. **Webpack下游**：首次並行62PASS／1FAIL及1suite load failure，載入/dist/plugins/usage-graph.js失敗；串行69PASS／6files。runtime-e2e.test.ts的buildPackage會重建所有consumer共用dist，與既有候選競態一致；其測試設定仍未修正，不以串行PASS結案。
5. Astro15tests／2files與Next58tests／8files PASS。這些是下游回歸控制，不證明其他host的完整qualified stylesheet交付。

## 可直接接續

- 先獨立重現/base/下runtime bootstrap404並依證據分類；可使用不含條件匯入的runtime／progressive頁面，對比/與/base/，檢查注入script src及兩種URL的HTTP結果。
- Vite development graph需一起處理LocalComposePlugin／StyleEntryPlugin的preserveImports、registerStylesheetSource與getExtractedCSSResult的serve分支，並提供可供瀏覽器／SSR取得的子CSS及resources。不能只略過分類錯誤、移除external imports或用build placeholders回應dev。
- 重跑`node .ai/audits/bug-hunt/repros/vite-qualified-prerender.mjs`完整build/dev及theme更新矩陣；`BH_TARGET=build`僅是已完成production控制，不代表dev通過。supports false控制加`BH_SUPPORTS=false`。
- 原Webpack3build／12browser、legacy39browser、其他preprocessors/PostCSS、完整maps、resource/reference、同config production environments/workers等原要求仍保留；45historical／33fixed／12unresolved、65checked／10blocked、4root gates、4原候選+1新增候選與0038身分暫停維持。

## 保存

- 194基線來源中修改兩個compiler產品檔與三份文件，189檔不變；新增一個compiler test及一個repro，合計196source hashes。五個Wasm/runtime/manifest產物byte-identical，壓縮大小沿用相同bytes舊值。
- 原始失敗logs與首輪browser source另存，沒有覆寫；AI budget、source/artifact hashes、下游命令及終態見0156-final-checks.json與file inventory。
- 所有本批命令均已結束；index空、HEAD不變，本批未commit／push。其他對話Site變更與既有未完成實作保留。
