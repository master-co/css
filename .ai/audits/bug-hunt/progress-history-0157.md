# 0155–0156 交接歷史

以下保留當時的共同交接原文；最新狀態見 README 的目前交接點。

- 0156：compiler globals蒐集改用Rust import/reference graph，metadata不讀host資源；5新tests、compiler235／Vite197（qualified案例開啟）、lint/types/build及範例PASS。最終supports真／假、兩模式與三瀏覽器4build／36觀測PASS；首輪6個outline寬度oracle錯誤已修正留證。Dev仍24FAIL：local-compose的舊攤平路徑500；progressive /base/runtime404另列新增待分類候選。Astro15／Next58通過；Webpack並行載入失敗、串行69PASS仍待修競態，Nuxt串行7PASS／3FAIL需驗證子CSS／實際頁面。189來源與五產物不變。下一批先獨立分類runtime base，再接dev graph／資源交付；12unresolved／10blocked／4gates／4原候選+1新增候選及0038身分暫停維持。HEAD9aefc18ac，未提交／推送。[0156](batches/0156-emitted-globals-graphs.md)。

- 0155：共用插件跨root污染修復，按ResolvedConfig隔離完整插件組；applyToEnvironment與非同步呼叫設定路由保留外層hook包裝及無environment的resolveFileUrl，SSR原始base經config merge保留。197tests／37files、lint/types/build／範例及Site PASS（75warnings）；四組restart、替換控制與四模式重用建置共384browser／128SSR及16build全PASS。185既有來源、五產物不變；3段交接逐字歸檔。另確認pre-render／progressive qualified子檔保留external import在獨立factory也失敗，下一批先修此BH-0004交付，再續資源／reference、其他host；同config並行production environments／workers仍待驗。12unresolved／10blocked／4gates／4候選及0038身分暫停維持；HEAD9aefc18ac，本批未提交／推送。[0155](batches/0155-shared-plugin-roots.md)。
