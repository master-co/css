# 0257 Previous checkpoint archive

以下0256交接與受影響列逐字保留（含0257訂正後的措辭）。

- 0256：在owned副本完成BH-0063候選修復：`nextGeneratedGlobalAnimations`從Master generatedCSS取出preset keyframes名稱，Turbopack無host PostCSS分支以`globalAnimations`建立module graph，`:local(fade)`還原為global `fade`且`@keyframes fade`交付；`module-animation` Turbopack baseline FAIL→fixed／recheck PASS，Webpack對照全PASS（Chromium／WebKit）。剩餘generated／imported-keyframe與global-context FAIL歸類為Turbopack combined-root PostCSS契約差異，不新增finding。promote等於交付0232–0256整套13檔約800行候選，使用者決定先不promote；BH-0063改為owned候選修復，63historical／58fixed／5unresolved不變。[證據](evidence/0256-final-checks.json)；[批次](batches/0256-next-turbopack-module-animation.md)；[前次](progress-history-0256-next-turbopack-animation.md)。

| PKG-next | `packages/next` | 高 | 已檢查 | 0256 BH-0063 owned候選：`module-animation` Turbopack baseline FAIL→fixed／recheck PASS、Webpack對照PASS（Chromium／WebKit）；0249 late資源dev 20步驟；0248 watch16步驟；0247 policy 151tests／3e2e | 未交付；promote等於整套13檔候選並依賴owned compiler／Rust候選鏈；Turbopack combined-root PostCSS／late resource契約、sibling歷史去重、maps／cache／完整host待續 | [0256](batches/0256-next-turbopack-module-animation.md)；[0255](batches/0255-next-turbopack-postcss-characterization.md)；[0249](batches/0249-postcss-resource-dev-recovery.md) |

| BH-0063 | P1 | 已確認／owned候選修復 | Turbopack CSS Module 引用 Master global animation 時名稱被作用域化且無 keyframes，動畫不執行 | 0256 owned副本候選：`nextGeneratedGlobalAnimations`取preset keyframes名稱、Turbopack無host PostCSS分支帶`globalAnimations`建立graph，`module-animation` Turbopack baseline FAIL→PASS、Webpack對照PASS（Chromium／WebKit）；候選檔案主工作樹不存在，promote須交付整套0232–0256候選，未交付。[0256](batches/0256-next-turbopack-module-animation.md)；[原始0255](batches/0255-next-turbopack-postcss-characterization.md) |
