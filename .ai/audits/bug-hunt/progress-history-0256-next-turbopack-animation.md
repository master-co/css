# 0256 Previous checkpoint archive

以下0255交接與受影響列逐字保留。

- 0255：Turbopack實際host對照7個PostCSS情境：首輪嚴格檔名比對是confound（Turbopack側檔名為`card.module.css.module.css`），寬鬆比對後確認user PostCSS作用在Turbopack側模組、combined-root與late resource契約不存在；無plugin的`module-animation`證實Turbopack Module引用preset animation時名稱被作用域化且無`@keyframes`，新增BH-0063（P1未修復）。63historical／58fixed／5unresolved。[證據](evidence/0255-final-checks.json)；[批次](batches/0255-next-turbopack-postcss-characterization.md)；[前次](progress-history-0255-next-turbopack-postcss.md)。

| PKG-next | `packages/next` | 高 | 已檢查 | 0249 late資源刪除／還原與定義刪除／還原dev 20步驟雙瀏覽器PASS；0248 watch16步驟；0247 policy 151tests／3e2e、真實Webpack child資源PASS | 未交付；sibling歷史去重、Turbopack、promote至0242候選、maps／cache／完整host待續 | [0249](batches/0249-postcss-resource-dev-recovery.md)；0255 Turbopack對照：PostCSS契約差異與BH-0063動畫失效。[0255](batches/0255-next-turbopack-postcss-characterization.md) |

以下為BH-0063在0255的原始狀態，逐字保留。

| BH-0063 | P1 | 已確認 | Turbopack CSS Module 引用 Master global animation 時名稱被作用域化且無 keyframes，動畫不執行 | `.module.css`內`animation:fade`：Webpack＋Master輸出`fade`與`@keyframes fade`正常；Turbopack＋Master輸出`card_fade__…`、最終CSS無`@keyframes`、另生空`.…__fade{}`，Chromium／WebKit皆無frames。Turbopack管線缺0237的global animation保護與keyframes交付。[0255](batches/0255-next-turbopack-postcss-characterization.md) |
