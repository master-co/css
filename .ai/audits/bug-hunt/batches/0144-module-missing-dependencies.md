# 0144 Modules missing dependencies

- HEAD `eb6b479a3998aebc37af18523a1458225909d9dc`；從0143的169項來源雜湊逐一核對開始，全部相符。
- 限定BH-0004的CSS／Sass Modules composition子檔刪除、還原、改名及新依賴後續編輯。未修改產品、依賴或既有fixtures；沒有再次commit／push授權。
- 本批已取得直接composition成功與巢狀composition主機失敗證據；**巢狀刪除／改名恢復仍未完成**，分類不是修復。

## 實際控制

| 命令／證據 | 結果與涵義 |
|---|---|
| `BH_NESTED=1 BH_MUTATION=delete node .../vite-css-modules-watch.mjs`／`0144-delete-first.log` | CSS初始及JS-only六browser PASS，刪除leaf後Vite內部FileSystemLoader未處理拒絕使process exit1；Sass及恢復未到達。 |
| `BH_NESTED=1 BH_MUTATION=rename`／`0144-rename-first.log` | 同樣在CSS巢狀缺檔時process exit1；不能宣稱改名不被watch或恢復已測。 |
| `BH_PURE_VITE=1 BH_NESTED=1 BH_ROOT_EDIT=1 BH_MUTATION=delete BH_EXTENSION=css`／`0144-delete-pure-vite.log` | 無Master plugin；用root edit觸發pure Vite重建，六browser PASS後在內部async readFile callback拋出PostCSS received undefined，process exit1。root edit控制只證明host缺檔路徑，未證明pure Vite child-only監看。 |
| `node .../vite-missing-module-host.mjs`／`0144-pure-preprocess-missing.log` | 僅public Vite resolveConfig/preprocessCSS，無Master import：直接缺檔可catch rejection（child exit0）；巢狀缺檔繞過outer await/catch直接process exit1。parent只收集結果並清理自建tmp，不將expected host failure當產品成功。 |
| `BH_MUTATION=delete BH_EXTENSION=css`／`0144-delete-direct.log` | 直接composition正確發ERROR；腳本錯誤要求訊息含子檔名，host實際只有fileResolve generic message。改為核對真實主機錯誤，不虛構原始檔名。 |
| `0144-delete-direct-verified.log`、`0144-rename-direct-verified.log` | direct刪除恢復17PASS／1FAIL、rename20PASS／4FAIL；事件顯示create／rename排入多次build，browser讀live dist時下一build正在重寫，且下一步曾消費上一revision的重複completion。此證據不能當成依賴更新語意失敗，也不證明原子發布。 |
| `0144-delete-direct-final.log` | CSS／Sass direct刪除後expected ERROR，還原後child-only恢復；6build輸出／18browser PASS。 |
| `0144-rename-direct-final.log` | CSS／Sass direct改名後expected ERROR，更新引用恢復，再單獨修改renamed檔；8build輸出／24browser PASS。 |

## 腳本與主機範圍

- `vite-css-modules-watch.mjs`加入delete／rename矩陣，每次輸入變更有revision；BUNDLE_START記錄所屬revision，只接受對應完成結果。ERROR後的END仍不當成功。
- BUNDLE_END即讀取完整輸出檔案快照，三瀏覽器從同一份完成產物載入。這驗證每次完成build的HTML／JS／CSS一致與expected computed styles，不聲稱live dist在另一build清理／發布期间不會404，也不以sleep或重試吞掉CSS錯誤。
- `vite-missing-module-host.mjs`在獨立child process呼叫pure public Vite API；parent保留stdout／stderr／退出碼，沒有安裝全域unhandledRejection handler或修改node_modules。
- 實際Vite8.2.2 `FileSystemLoader.fetch` 的async fs.readFile callback在await `core.load`周圍缺少catch；readFile error reject後也繼續load。nested拒絕未傳回外層promise，是獨立pure-host重現支持的現有主機限制。直接與巢狀error message不同，沒有概括為同一Master解析器bug。
- 不能以先拒絕所有歷史missing依賴作修補：作者可能已在新的consumer內容移除該import。亦未複製CSS Modules parser或導入私有Loader。仍需研究公開host能力或其他正確的錯誤隔離邊界。

## 驗證與保存

- 本批只有帳本與repro修改；0143產品與158Vite測試證據保留，沒有宣稱本批重新執行套件測試或Site lint。
- 完成42個direct mutation browser對照；共用腳本的既有child-update18與nested compiler-error recovery18亦PASS，合計78個完成產物瀏覽器對照。
- source hashes、AI budget、syntax、whitespace、artifact保存與inventory於final-checks記錄；原始失敗log不覆寫。

## 下一步與未完成

1. 巢狀missing module造成Vite程序終止：保留完整failed需求，研究能傳遞主機錯誤且不改CSS語意的公開能力；不能以記錄阻礙結案。
2. 接續development CSS／Sass Modules HMR；與production watch分開驗證，確定scoped export、class usage與child-only更新。
3. 再續其他preprocessor／PostCSS、alias／virtual/reference/resources、多入口／shared environment、cycles及published maps；原Webpack3build／12browser与legacy39browser失敗保持。
4. 45歷史findings仍33fixed／12unresolved；75coverage仍65checked／10blocked；4root gates／4候選。BH-0004未結案，0038追加驗證仍等待明確身分確認。
