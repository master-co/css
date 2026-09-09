# 0153 Custom environment 單獨關閉

## 範圍及基線

- 接續0152的多環境生命週期限制。先核對187個source SHA-256皆一致，HEAD8d40735be、index空；上一輪為已完成修復及驗證的有效進展。
- 本批限定server建立時宣告的client、ssr及自訂runnable edge環境；分別關閉其中一個，驗證其餘環境的新stylesheet載入與後續更新。動態新增／替換環境、共用plugin instance並行多root仍待驗，不能以本批通過替代。
- BH-0004整體未完成；0038身分驗證暫停維持，無新確認。本批沒有commit／push。

## 失敗與根因

- 新actual-server測試6cases：pure Vite三種關閉順序全PASS；managed關閉edge或ssr後，client新stylesheet HTTP500；關閉client後SSR新模組拋出Scanner context未初始化。`0153-custom-close-before.log`保存3PASS／3FAIL。
- 同一config的環境共用scanner與stylesheet collection；0152解決新舊config互相清理，但任一環境closeBundle仍會釋放整份config的資源。
- 安裝中的Vite8.2.2公開DevEnvironment.close及其實作會對各環境呼叫closeBundle，不受buildStart/buildEnd的per-environment旗標過濾。API型別／來源SHA與摘錄見`0153-vite-api.json`。
- 該份公開型別同時在ServerOptions及Plugin提供perEnvironmentStartEndDuringDev；先前以為只有server option的判斷不完整，已明確更正。本批不需開啟此旗標，不能據此宣稱其所有組合已驗證。

## 修復

- Scanner config狀態記錄server.environments中的環境物件，包括尚未載入模組的idle環境；configureServer註冊初始使用者。
- scanner及HMR closeBundle以同一個冪等的environment release刪除已關閉環境。仍有使用者時保留scanner／collection及HMR server登記；最後一個環境關閉才釋放。
- 保留0152的config隔離、初始化promise、失敗重試及重複清理保護。沒有改Rust／tooling語意、主機私有module graph、公開package API或runtime。
- 新測試亦以真實MasterCSSScanner.dispose的passthrough spy確認：單一環境關閉不釋放，server最終關閉只釋放一次；後續CSS與兩種SSR consumer更新purple均通過。

## 驗證

- 正常模式6actual-server cases全PASS；13個聚焦測試、Vite lint／type-check／build PASS。最終完整179tests／34files全PASS，未改既有tests、fixtures或snapshots。
- 新`vite-custom-environments.mjs`對pure／managed、關閉edge／ssr、三browser保留同一頁面，依序initial、closed、partial edit及第二次edit。48browser與20SSR outputs全PASS；每份SSR分別在三browser shadow root渲染。關閉／編輯後bootID保持不變，無page/HTTP errors，server channel沒有browser CSS payload。
- 關閉client後兩個server consumer仍能載入新CSS並更新，另由actual-server測試直接核對；不要求已關閉的client繼續供應HTTP。
- 0152 middleware／一般server連續兩次restart控制各72browser／24SSR PASS，共144browser／48SSR。加上新custom矩陣，最終192browser／68SSR outputs全PASS。
- Vite README與Site既有directive contract同步已宣告環境的獨立關閉行為。Site prepare/lint、Vite範例build、來源／產物保存與命令終態見final-checks。
- 0147–0151五段共用交接由五份主要帳本逐字歸檔至progress-history-0153.md；保留25處原文對應的SHA與歸檔驗證，不重新建立帳本、不改歷史batch／raw logs。

## 接續

1. 驗證共用plugin instance並行使用、動態新增／替換environment、per-environment hooks旗標組合；目前retention涵蓋configureServer時的初始環境，不替動態生命週期背書。
2. 繼續resource內容變更／reference ownership、其他preprocessor/PostCSS、完整published maps與Webpack交付。
3. 0144巢狀CSS Modules缺檔host終止、0148Modules?url未交付、Webpack3build／12browser與legacy39browser失敗仍保留。33fixed／12unresolved、65checked／10blocked、4root gates／4候選維持，0038仍須明確身分驗證通過，整體目標active。
