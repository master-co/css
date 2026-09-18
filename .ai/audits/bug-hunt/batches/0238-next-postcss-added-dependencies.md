# Batch 0238: Next PostCSS added dependencies and resource ownership

## 目前交接點

0237持續取得進展，已保留global/PostCSS隔離候選。本批opening核對660selected source inputs、493shared artifacts及candidate54sources／64dist均符合0237。沿用原帳本及問題ID，沒有重新建立進度。53個舊remaining條目完整保留，新加一條限定更新；不是54個獨立bug。

目前仍保留owned候選 `tmp/master-next-copy-3z8i_q4c/packages/next`，沒有套用正式package或commit。開始前src/dist備份於 `tmp/0238-baseline`。本批只修改其中三份src及兩份audit repro；沒有改root既有測試、fixtures、依賴、lockfile、CI/release或其他工作。

## 重現與分類

首輪六案都因audit腳本產生的plugin少一個括號而build失敗，**不算產品bug**。修正後加入`vm.Script`預先檢查生成的plugin，六份首輪原始紀錄保留於0238-before-*。

修正腳本後的實際Next Webpack production證據：新增composes得到正確class export但沒有子檔CSS（兩瀏覽器border為0）；generated theme圖片仍是file URL（兩瀏覽器無HTTP圖片）；PostCSS新加入var(--image-audit)時沒有生成對應變數（兩瀏覽器background為none）。新增qualified import與普通圖片各2PASS。

巢狀case原先使用`.shared{}`，build報missing export；lowering在PostCSS前已移除空rule，plugin找不到可新增composes的節點。保留此失敗，另加非空`.shared{display:block}`控制以獨立驗證新增巢狀ICSS。空rule支援／純Next對照仍待續，不能用非空控制取代此要求。

## 候選修正

1. 將全圖`importsRetained:true`改為每個node的已保留ICSS specifier集合；Next既有ICSS processors處理plugin新增依賴後，只把尚未保留的依賴加入CSS graph。直接與巢狀新composes都得到真實子檔CSS，沒有改Module命名／解析語義。
2. Preflight仍用絕對file URL保留跨檔資源身分。將generated globals放入root前，以Next已有PostCSS/value parser，只重定位preflight明確記錄的file URL為root相對URL，再由既有final publisher交付。query/fragment保留，未新增依賴，也沒有自行實作CSS tokenizer或Rust語義。

曾嘗試直接令preflight回傳相對URL：第一版未開relativeResourceURLs，兩案被拒；開啟後同層可用，但子目錄仍被拒。讀回public契約與Rust證據確認該選項只支援同層資產，此路線已撤換，失敗證據及rejected patch保留。這些是候選使用API錯誤，沒有修改compiler契約繞過限制。一次build從錯誤cwd啟動而失敗亦保留，正確cwd重建成功。

## Actual host結果

| 有界行為 | 最新結果 |
|---|---|
| PostCSS新增直接composes | 2browser PASS |
| PostCSS新增巢狀composes，非空child | 2browser PASS |
| PostCSS新增qualified import | 2browser PASS；獨立套用imported class也為7px |
| PostCSS新增普通圖片 | 2browser PASS，HTTP200／query／fragment |
| 已引用theme圖片 | 修正後2browser PASS |
| 子目錄theme＋含空白圖片檔名 | 修正後2browser PASS，HTTP200 |
| combined-root global context／ICSS child global animation | 各2browser PASS |
| PostCSS新增theme變數引用 | 最新仍2browser FAIL；background none |
| 空Module rule後加composes | build失敗保留，待原生對照／修正 |

共28次host嘗試：6次是已分類script syntax錯誤；其餘22次18build成功／4失敗。有效build歷史瀏覽器觀察26PASS／10FAIL；包含修正前失敗，不把它們刪掉，也不把歷史總數當最新候選矩陣。

10組actual輸入的16selector anchors全部PASS，核對原始file/line/column及完整sourcesContent，含新增ICSS／普通import／nested leaf／child theme。沒有聲稱generated global和每個declaration已有細緻錨點。

## 限制與可直接接續步驟

下一批0239從此候選接續：先做PostCSS新增theme引用與空rule的純Next／候選／Rust階段對照，決定如何保留完整global reference closure與PostCSS可見輸入；不得以重跑任意非冪等plugin或偷偷加入所有預設globals掩蓋缺口。新ICSS來自raw graph之外時，其Master定義是否需補入共用manifest也待驗。

本批保留specifier集合只證明新增依賴；plugin刪除／改名／改寫原有synthetic import的同步、重複／順序／condition等仍須控制。任意AST ownership／metadata遺失、Sass native pipeline、snapshot watch失效與清理、跨consumer條件、SSR／Turbo／Firefox、完整maps及歷史raw gates均未完成。

0038追加驗證仍等待使用者explicit identity確認，沒有新授權。原pending patches保留，未因本批繼續而擴張權限。目標保持active。

[總核對](../evidence/0238-final-checks.json) · [Host歷史](../evidence/0238-host-summary.json) · [最新資源矩陣](../evidence/0238-rebased-matrix.json)

完整15source候選patch：`repros/next-postcss-added-dependencies-candidate.patch`，root只做apply-check PASS；舊patch與0238 baseline仍保留。

收尾驗證：128tests、3e2e、18graph controls、build、types、lint與AI context均PASS。E2E首輪因Python未展開glob而找不到測試，已用正確shell展開補跑並通過，兩份log保留。660selected inputs僅兩份audit repro變動；493shared artifacts不變，candidate54／64已保存新hash，HEAD／空index不變。
