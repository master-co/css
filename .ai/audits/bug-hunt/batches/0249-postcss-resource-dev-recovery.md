# Batch 0249: Late-resource deletion and definition recovery in dev

## 目前交接點

0248是progress：late資源的位元組與theme值更新在Webpack dev已驗證，但資源檔案被刪除後的錯誤與恢復、以及plugin仍引用而作者刪除theme定義時的行為未驗證。本批只新增audit repro與證據；沒有修改任何產品、候選source／dist、既有測試／fixtures、依賴、CI、release或Site。0247副本59source／60dist、0244 API與native binding SHA、493shared artifacts不變；root selected sources新增1個repro後673。0038仍暫停。

## 實際`next dev --webpack`恢復觀察

`repros/next-resource-dev-recovery.mjs`沿用0248 fixture（plugin在Once追加`background-image:var(--image-audit)`與`outline-color:var(--color-audit)`），hydrate後依序：刪除`new.svg`、以新位元組還原、刪除`--color-audit`的定義（plugin仍引用）、還原定義。pure控制把定義放在global stylesheet。

| 組合 | initial | SVG刪除 | SVG還原 | 定義刪除 | 定義還原 |
|---|---|---|---|---|---|
| Master／Chromium | PASS | 頁面500，`Module build failed (from stylesheet-loader): ENOENT …/new.svg` | PASS，自動恢復（整頁reload），blue位元組 | PASS，outline退回currentColor rgb(18,52,86) | PASS，rgb(17,17,17) |
| Master／WebKit | PASS | 同上 | PASS，自動恢復 | PASS | PASS |
| Pure／Chromium | PASS | 頁面500，`Module build failed: ENOENT` | PASS，但90秒內未自動恢復，harness reload後恢復 | PASS | PASS |
| Pure／WebKit | PASS | 同上 | PASS，自動恢復 | PASS | PASS |

20／20步驟通過。差異：Master的缺檔錯誤由`stylesheet-loader`在preflight／delivery讀取資源時拋出，訊息含完整路徑；pure由Next css-loader拋出。還原後所有組合都經整頁reload（marker由preserved變fresh），這是Next對build error恢復的既有行為；pure／Chromium未在90秒內自動恢復屬pure Next行為，非Master差異。刪除定義時late引用不再有可補入的global，hook不拋錯也不復活舊值，輸出與pure一致。

兩次harness修正分開保存：首版在dev overlay移除`#probe`時等待locator逾時；第二版改回報missing後，Master／Chromium又遇到overlay導航使evaluate context被銷毀，第三版把導航視為暫時missing並在90秒後允許一次harness reload。[初版](../evidence/0249-dev-recovery-initial.log) [第二版](../evidence/0249-dev-recovery-second.log) [最終](../evidence/0249-dev-recovery-final.log)

## 可接續材料與下一步

- 已驗證：late資源刪除的錯誤呈現、還原、定義刪除／還原，雙瀏覽器與pure對照，皆在Webpack dev。
- 未完成：sibling歷史共享／去重、hook效能、Turbopack路徑、Document／並行生命週期、0243 selector provenance與Turbo persistent-cache publication、完整Sass／watch／SSR／Modules／multi-root／host邊界；BH-0004／BH-0053不結案。
- 下一步：整理0246–0249的owned副本delta，評估promote至保留的0242候選所需的既有測試契約與patch；或先處理sibling歷史去重。
- 61historical／57fixed／4unresolved、65checked／10blocked不變；pending approvals不變；goal active。

[Final checks](../evidence/0249-final-checks.json) · [Inventory](../evidence/0249-inventory-summary.json)
