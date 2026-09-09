# 0159逐字歷史交接歸檔

- 0158：關閉殘留完成有界分類，71個獨立程序控制；scanner／renderer dispose均有trace。完全不載Master CSS插件或Node API的純Vite加runtime dependency／virtual HMR亦留native async handle，停optimizer不解；普通小dependency另有close未完成exit13，與native殘留分開。先等待公開waitForRequestsIdle的六控制全部自然退出0；CSS調查腳本採相同收尾，直接close仍保留主機限制，未視為修復／完成。產品來源與既有驗證不變；46historical／34fixed／12unresolved、10blocked／4gates／4原候選+1主機關閉待辦及0038身分暫停保留。下一批接BH-0004 dev分類、CSS graph與resources實際交付，再續Nuxt／Webpack與其餘要求。HEAD42ccdc182，未提交／推送。[0158](batches/0158-development-shutdown-classification.md)。

- 0146：修復共用manifest HMR hook丟棄普通CSS／inline／raw更新modules，保留原節點並合併virtual manifest；internal18、Vite160、Astro15與三套件lint/types/build、Vite／Astro範例均PASS。修後完整開發request矩陣93PASS／3FAIL；剩managed Sass ?url的link為/style.scss，但HMR送/style.scss.css?direct，更新路徑不匹配，已留WebSocket證據待修。另Modules HMR18PASS；URL原文oracle與pure冷啟動boot判定分開記錄。Site通過（75warnings），五產物不變；20段歷史逐字歸檔。下一批先修Sass direct URL HMR，再續其他request／host與Webpack；0144巢狀缺檔仍未完成。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0146](batches/0146-development-style-requests.md)。

- 0145：development CSS／Sass Modules接入既有主機預處理與scoped匯出／usage流程，依root／composes子檔失效cache及Vite代理modules；修復managed entry缺少具名匯出與local Sass500。Vite160／lint/types/build／範例PASS；entry／local、直接／巢狀、三瀏覽器HMR72及production60對照PASS，逐步核對新HMR且無整頁reload。preset blue色彩oracle與首次baseFile/preserveImports接入錯誤分開留證。Site通過（75warnings），五產物不變。下一批dev inline／raw／url與普通Sass、其他host／Webpack；0144巢狀缺檔主機終止仍未完成。33fixed／12unresolved、10blocked／4root gates／4候選與0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0145](batches/0145-module-development-hmr.md)。

- 0135：接通Vite virtual CSS來源載入，保留原始CSS、opaque ID/query與條件圖譜；graph-only loader子檔不再額外成為無條件入口。compiler223／Vite110、兩套件lint/types/build通過；13actual builds剩1SassFAIL，72browser為66PASS／6SassFAIL，其中virtual30與裁剪36全通過。既有resolver36／resource18／cache39、3種watch共54與純Vite控制18通過；早期watch非實體暫存路徑及錯用getWatchFiles屬harness問題，query截斷則已修復。Site prepare/lint通過（75warnings）；5artifacts不變，兩root API gates仍失敗。下一步接Sass入口／匯入預處理、virtual資源／reference與其他host路徑，再遷移Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變；HEADef7887f76，本批未提交／推送。[0135](batches/0135-vite-virtual-sources.md)。

本次依使用者要求整理提交（父提交 `912a73b26`）：僅納入 0120–0122 已完成的調查紀錄、驗證證據與三個重現腳本。BH-0004 的產品、測試及公開文件實作仍未完成整體交付，保留未提交；其他對話的 Site 變更保持原樣。81 個來源／保留檔案雜湊與 0122 最終記錄全部一致。證據對應這些工作區版本，重現腳本仍依賴未提交來源，不能宣稱本提交的乾淨 checkout 可獨立重現修復後結果。0123 已開始：發布寫入失敗破壞既有 CSS，以及覆寫使用者修改的 sidecar，兩項回歸均 FAIL；其測試與證據保留工作區，下一步完成不可覆寫資產與入口切換，再驗證所有權及清理。32 已修復／12 未解決、65 已檢查／10 受阻、4 項 root gates、4 個待分類候選及 0038 身分驗證暫停均保持；未推送。

本次依使用者要求整理提交（父提交 `74e471917`）：僅納入 0123–0124 已完成的調查、證據與三個重現腳本。BH-0004 的產品、測試及公開文件實作與其他對話的 Site 變更保留未提交。0124 的 12 個本批來源雜湊全部一致；80 個保留來源中，77 個一致，3 個已由進行中的 0125 修改（rust-contract.ts、protocol.ts、stylesheet/index.ts）。歷史證據對應各批來源雜湊的工作區版本，腳本依賴未提交實作，不能宣稱本提交的乾淨 checkout 可重現修復後結果。0125 已開始 manifest-only project graph：compiler 197 tests、lint/types 通過；Rust project 8 PASS／1 FAIL，失敗為 structured_project_entries_merge_in_order 的 CSS 斷言，根因尚未分類。先檢查實際 CSS 與跨入口定義覆寫，再續 native 下游及 manifest loader 驗證；0125 實作、測試與證據均留工作區。32 已修復／12 未解決、65 已檢查／10 受阻、4 項 root gates、4 個待分類候選保持未完成；0038 追加驗證仍等待明確身分確認。未推送。

本次依使用者指示整理提交（父提交 `1c6595586`）：僅納入 0125–0127 已完成的調查、證據與五個重現腳本。BH-0004 的產品／測試／公開文件、0128 BH-0045 進行中實作及其他對話的 Site 變更均保留未提交。0127 記錄的 103 個來源／保留雜湊全部一致；歷史證據依賴未提交的工作區實作，不能宣稱本提交的乾淨 checkout 可獨立重現修復後結果。0128 已有 Vite 110 tests、lint/types/build、7 模式 21 builds／39 browser 對照通過，已知程序均結束；尚須完成 hook 順序影響的 runtime/progressive 控制、最終原始重現、文件與批次結案，BH-0045 保持未解決。32 已修復／13 未解決、65 已檢查／10 受阻、4 root gates、4 候選與0038身分暫停均保持；未推送。

使用者再次授權提交已完成部分：本次納入0141–0142已完成的查核紀錄、重現材料與原始證據；歷史HEAD／未提交描述保留為當時狀態。共用watch腳本僅提交與0142 inventory SHA-256一致的已驗證版本，0143擴充保留工作目錄。BH-0004產品／套件測試與其他對話Site變更未納入。0143直接子檔watch已6build／18browser PASS，新增dependency3tests與Modules9tests通過；但巢狀錯誤恢復最新6build／18browser為16PASS／2FAIL，Chromium恢復時請求不存在的JS／CSS資產，尚須區分watch事件時序、發布行為與腳本因素，不能宣稱修復完成。相關命令已結束；下一步先查事件與資產發布時序，再補穩定的恢復驗證及0143整批收尾，續dev/HMR、其他host與Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分驗證暫停不變，目標保持active；此次未推送。[提交範圍與保存證據](evidence/0142-commit-validation.json)。

本次依使用者「把已完成的部分 commit」指示，以 bece2e120 為父提交，僅提交 0113–0114 已完成的調查紀錄、驗證證據與重現材料。0092/0113/0114 的 compiler、binding、公開 API、測試及文件實作尚未完成整體交付，全部留在工作區；Site 其他工作亦不納入。證據描述的是來源雜湊所標識的工作區版本，重現腳本依賴尚未提交的 graph 原始碼與測試 corpus，不能在本次提交的乾淨 checkout 單獨重跑。45 個來源／保留雜湊均與 0114 最終記錄一致。BH-0004、13 個未解決問題、10 個受阻單位及四項 root gates 保持未完成；0038 追加驗證繼續暫停。未推送。

- 0056 Next Firefox/WebKit bounded HMR controls PASS; no new finding, confirmed total remains34.
- 0057 Vite Firefox/WebKit order/HMR/recovery controls PASS; no new finding.
- 0058 LSP cancellation/current-version/settings controls PASS; initial self-parent watchdog was harness error, no new finding.
- 0061 Firefox/WebKit example controls10PASS; no new finding, BH-0027 network404 still observed.
- 0062 Astro/Next/Svelte Firefox/WebKit controls6PASS; no new finding.
- 0063 Laravel Firefox/WebKit home CSS/login visibility2PASS; no new finding.

- 0073 original cold/repeat32commands and16artifact controls PASS;0075 confirms existingBH-0032 on delivery-mode report; prototype metric zeros require distinct attribution recorded in batch. Total remains41.
- 0076 original progressive report failsBH-0032; same-page sidecar/native/public controls extend facadeBH-0033 andCSSOMcounterBH-0034. No newID.
- 0074 neutral browser14variants/448samples/trace sums PASS; initial180s audit timeout excluded, no new finding.

- 0092：BH-0004本機條件/圖層修正經Rust34、TS126及96browser comparisons通過；nested unresolved imports仍未完成，維持已確認。[證據](batches/0092-import-conditions.md)。
- 0093：BH-0022已修復，15tests/lint/types/build及三瀏覽器的實際plugin/UI＋mock Figma API通過。44歷史確認：14已修復、30未解決；不宣稱真實Figma文件驗證。[證據](batches/0093-figma-import.md)。

- 0094：BH-0008/0009修復；273browser tests/lint/types/build與標準runtime benchmark通過。Global gzip減112bytes，無效manifest仍拒絕；18fixed的最終累計見0095。[證據](batches/0094-runtime-csp-frame.md)。
- 0095：BH-0012/0018修復；scanner80、NodeCLI28、RustCLI3、Vite99與實際三瀏覽器.mjs build通過。44歷史確認：18已修復、26未解決。[證據](batches/0095-mjs-source-discovery.md)。
