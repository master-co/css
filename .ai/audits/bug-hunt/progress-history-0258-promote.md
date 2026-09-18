# 0258 Previous checkpoint archive

以下0257交接與受影響列逐字保留。

- 0257：owned副本`packages/next`候選五項檢查全PASS：lint、audit type-check（src＋tests對0244 compiler d.ts）、build、24files／152tests、3e2e；候選測試契約較主工作樹新增4檔、修改5檔（含pending `nextGraphDeliveryTests`四檔）。量化promote依賴鏈：Rust 535行（`native_source.rs`）＋binding protocol＋compiler 11檔46行＋next 13新檔＋site契約文件，且0244候選crates缺0251–0253 perf（0251 patch dry-run可套用，0252／0253未驗）。沒有promote、沒有產品變更；另commit訂正0256「副本無tests」誤述。63historical／58fixed／5unresolved不變。[證據](evidence/0257-final-checks.json)；[批次](batches/0257-next-candidate-promote-feasibility.md)；[前次](progress-history-0257-next-candidate-promote.md)。

| PKG-next | `packages/next` | 高 | 已檢查 | 0257 owned候選lint／audit types／build／152tests／3e2e全PASS；0256 BH-0063候選`module-animation` Turbopack FAIL→PASS、Webpack對照PASS；0249 late資源dev 20步驟；0248 watch16步驟 | 未交付；promote為Rust／binding／compiler／next／site跨層交付，0244候選crates需rebase至0253後；`nextGraphDeliveryTests`四檔待授權；Turbopack combined-root PostCSS／late resource契約待設計 | [0257](batches/0257-next-candidate-promote-feasibility.md)；[0256](batches/0256-next-turbopack-module-animation.md)；[0255](batches/0255-next-turbopack-postcss-characterization.md) |

| BH-0063 | P1 | 已確認／owned候選修復 | Turbopack CSS Module 引用 Master global animation 時名稱被作用域化且無 keyframes，動畫不執行 | 0256 owned副本候選：`nextGeneratedGlobalAnimations`取preset keyframes名稱、Turbopack無host PostCSS分支帶`globalAnimations`建立graph，`module-animation` Turbopack baseline FAIL→PASS、Webpack對照PASS（Chromium／WebKit）；候選檔案主工作樹不存在，promote須交付整套0232–0256候選，未交付。[0256](batches/0256-next-turbopack-module-animation.md)；[原始0255](batches/0255-next-turbopack-postcss-characterization.md) |
