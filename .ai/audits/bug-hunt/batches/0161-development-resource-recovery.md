# 0161 Resource snapshot consistency and recovery

## 基線與本批範圍

- 前輪0160修復資源檔名／deny／舊版本交付，231tests與96browser全PASS，帳本保存完成，屬有效進展。本批213來源雜湊一致，HEADb306e5d77；未commit/push，0038身分暫停不變。
- 接BH-0004：檢查resourceURL讀取內容與發布副本是否一致；再驗證資源刪除、錯誤與恢復。其他custom environment、local-compose、virtual/reference、Nuxt／Webpack及原全部未完成要求維持。

## 進行中

- 新控制在resourceURL取得後、publishDevStylesheets執行前替換或刪除來源；要求發布的版本保留命名時的原始bytes。這是可確定重現的讀取邊界，不以隨機時序猜測。
- 尚待結果，47historical／35fixed／12unresolved、10blocked／4gates／4原候選與1host shutdown限制不變。

## 目前證據

- Snapshot兩控制皆重現：命名後替換檔案使舊href存入blue而非red，命名後刪檔使copyFileSync ENOENT。新fixture首次誤寫emittedGlobals為未使用的keyframes／array欄位，已依公開型別改variables／animations空record並重跑，結果仍兩個相同產品失敗；原log保留，不混為產品型別bug。
- resourceURL改在同一份Buffer上計算版本與寫入安全副本；publishDevStylesheets不再第二次讀來源。既有版本復用同一副本，最後environment關閉的清理維持。18focused及完整237tests／44files、lint/types/build通過。
- 新actual-server四mode全部通過：刪資源後CSS500且錯誤包含原檔名，已發布的舊resource仍200／原bytes；恢復為新內容後CSS200且URL改變、新舊bytes各自正確，關閉釋放副本。此HTTP證據不能代替browser錯誤overlay與HMR恢復，新增四mode／三browser重現正在執行。

## 最終驗證與接續

- built-package四mode／三browser、初始／deleted／restored／updated-again共48觀測全PASS：刪除後實際Vite error overlay包含pixel.svg，舊SVG仍可HTTP取回、canvas仍紅；恢復藍色後overlay消失，下一次更新再變紅，bootID全程不變。只允許該style.css因缺少資源產生的500；pageerror為空，其他HTTP錯誤不接受。保留每列實際HTTP500與overlay片段，不稱刪除階段error-free。
- Vite完整237tests／44files、lint/types/build與原範例build通過。公開文件同步同一份bytes命名／發布與已驗證的缺檔恢復，不更動CSS語義／public exports／依賴。Site lint與最終來源、產物及cleanup核對見0161-final-checks.json。
- 本批仍歸BH-0004，無新ID；47historical／35fixed／12unresolved、65checked／10blocked、4root gates、4原候選與1host shutdown限制不變。0038追加驗證仍待明確身分確認，不能解除暫停。
- 下一批驗證retained graph的custom environment replacement／restart，續local-compose的真正graph transform、virtual resource/reference owner，及其他preprocessor／PostCSS／maps、Nuxt實際子CSS、Webpack graph／並行dist與所有原有未完成項目。未commit/push。
