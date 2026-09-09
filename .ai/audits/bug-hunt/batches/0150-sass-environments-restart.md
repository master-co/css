# 0150 Sass environments and server restart

- HEAD `45747c24a`；起始179項來源與0149相符，index空。上一goal turn修復partial刪除／恢復並完成294browser與163tests，屬有效進展。
- 限定client／SSR Sass更新訊息隔離、server restart後新請求及URL登記時序；沿用BH-0004。新增三個原先乾淨的Vite lifecycle檔案，編輯前SHA記於new-scope-before。

## 重現與分類

| 證據 | 結果／含義 |
|---|---|
| `0150-environment-before.log` | 新actual server測試FAIL：SSR inline CSS有更新，但browser css-update也送往server consumer channel。 |
| `0150-restart-before.log` | 兩測試FAIL；restart在StyleEntryHMR buildStart拋Scanner context was not initialized。Vite8.2.2先建立新server再關舊server，舊scanner此時被dispose；新的並行buildStart尚未完成初始化。 |
| `0150-lifecycle-first.log` | 抽出既有初始化能力時遺留同名type import，造成三個suite parse失敗；本輪編輯錯誤，已移除重複import，不列既有產品缺陷。 |
| `0150-lifecycle-second.log`、`0150-restart-trace.log` | scanner／既有HMR與SSR隔離通過，restart新URL沒有HMR。trace顯示watch事件存在但module graph空：精確alias HTTP路徑回傳raw source，原先只查red的oracle不足。 |
| `0150-restart-corrected-route.log` | 改用真實custom resolver、HTTP200且不得含@master的processed CSS後，確認重啟仍送舊/old.scss URL。不是watcher未就緒。 |
| `0150-focused-final.log`、`0150-focused-second.log` | 僅clear Map仍FAIL：舊請求的非同步回呼寫回同一Map。改每server獨立Map後，兩個新回歸與原scanner／HMR共17PASS。 |
| `0150-types-first.log` | 新測試讀取send overload spy參數被推斷成never；改用typed expectation matcher，不改產品型別／降低檢查。 |
| `0150-vite-tests-final.log` | 首次完整套件164PASS／1FAIL：HTTP回應後立即編輯時，URL登記的async graph lookup尚未完成，nested URL只收到代理路徑更新。 |
| `0150-pending-url-test.log`、`0150-pending-url-without-wait.log` | 新增可控制登記延遲的回歸。等待pending時3tests PASS；僅暫時移除等待，該測試FAIL。原始來源已逐位元組還原，SHA記於control-preservation；未改dist或其他來源。 |
| `0150-browser-environments-first.log` | 48browser有3pure-Vite restart後FAIL，涉及舊連線自動reload與一次未及更新；另16SSR中1FAIL僅因blue被合法序列化為#00f。不得全部列產品bug。 |
| `0150-browser-environments-second.log` | restart前移至about:blank再對新server發送請求，明確限定新請求生命週期；SSR輸出改用三browser shadow DOM實際渲染。pure／managed ×兩獨立root ×四phase：48browser、16SSR outputs全PASS。舊連線重啟自動重連仍待獨立驗證。 |

## 最終修改

- `sass-source.ts`只對consumer=client送stylesheet css-update，各環境仍各自失效module graph；server consumer不接收browser CSS訊息。
- 每次configureServer配置獨立URL Map及pending registrations；舊請求closure只能更新其舊Map。hotUpdate先等待目前server的pending登記，避免回應與file event競速漏掉URL。
- 將ScannerPlugin既有ensureScanner抽至私有scanner-context utility，使用以context為key的WeakMap共用初始化promise；ScannerPlugin與StyleEntryHMR等待同一初始化。已有scanner時，HMR原本同步掛listener流程不變；既有scanner／HMR測試無修改。
- 新增`bug-hunt-sass-environment.test.ts`三個actual-server回歸及`vite-sass-environments.mjs`。重啟以custom resolver改old/new URL，同时核對SSR、client與另一獨立root不受影響。
- Vite README與Site現有directives contract同步SSR更新與重啟後新請求行為。未修改tooling語意、runtime、fixtures/snapshots、依賴、lockfile、CI／release或公開API。

## 最終驗證

- Vite166tests／30files、lint／type-check／build與原Vite範例build PASS；新增3tests。
- 新環境48browser／16SSR outputs、原request96browser、巢狀managed partial刪除恢復36browser，全PASS；共180browser rows，另16SSR輸出各經三browser渲染。
- Site prepare/lint PASS（0errors／75warnings）；source hashes、五artifact、AI budget／whitespace及terminal jobs詳見final-checks。
- 原source baseline加入編輯前三個lifecycle檔案；所有其他來源與其他對話Site變更保留。沒有commit／push，兩個root API既有失敗與四個root gates不刷新或結案。

## 接續

1. 獨立核對server restart時保持連線的browser自動重連／reload完成條件；本批about:blank隔離只證明新server請求及後續HMR，不能替代live reconnect驗證。
2. 驗證middleware/custom environment及同plugin instance生命週期等尚未涵蓋範圍；兩個獨立factory/root成功不代表共用plugin instance並行安全。
3. 接resource內容變更／reference ownership、其他preprocessor/PostCSS、多root／SSR shared environments、完整published maps與Webpack。
4. 0144巢狀CSS Modules缺檔host終止、0148Modules?url未交付、Webpack3build／12browser及legacy39browser失敗保持。45findings為33fixed／12unresolved、75coverage為65checked／10blocked，另4root gates／4候選。0038仍等明確身分驗證通過；整體目標active。
