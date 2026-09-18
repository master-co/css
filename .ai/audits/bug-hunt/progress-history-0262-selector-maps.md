# 0262 Previous checkpoint archive

以下0261交接與受影響列逐字保留。

- 0261：BH-0029結案。在目前主工作樹重跑原repro：Rspack模組仍無source，但`finishModules`以完整module graph補齊，managed CSS實際經`main.css`→`@import`鏈交付（`.block{display:block}`在鏈上），原斷言只讀`main.css`（僅50 bytes的`@import`）故誤判。新增Webpack對照repro，四格（webpack／rspack×有無`@preserve native`）行為逐格相同：managed CSS一律交付，作者原生CSS只有`@preserve native`才保留，屬Master既有預設。repro改為沿鏈攤平並加上`@preserve native`後PASS。0038暫停的integration-lab追加覆蓋未重啟。63historical／61fixed／2unresolved。[證據](evidence/0261-final-checks.json)；[批次](batches/0261-rspack-static-delivery.md)；[前次](progress-history-0261-rspack-delivery.md)。

| BH-0053 | P1 | 部分修正 | Next/Turbopack 在 Sass 預處理前分類造成編譯失敗 | 0260交付版本turbopack scss dev／build／partial／partial+recovery四組Chromium＋WebKit PASS，分類在預處理之後的行為維持成立；promote已於0258完成。0249 late資源刪除／還原dev 20步驟、0248 watch／HMR、0247 policy與真實Webpack build PASS。0243 delivery asset maps與持久快取反例、native declaration granularity、完整Sass option／host邊界仍未完成。[0260](batches/0260-next-css-pipeline-closure.md)；[0249](batches/0249-postcss-resource-dev-recovery.md) |

| PKG-next | `packages/next` | 高 | 已檢查 | 0259 交付後實際host重驗：Webpack 8 PostCSS＋Turbopack 7 Module情境×2瀏覽器全PASS；0258 候選已交付，lint／type-check／24files/152tests／3e2e PASS | Turbopack combined-root PostCSS／late resource契約不存在，待設計；`encoded-composes`為Turbopack自身限制；BH-0004完整public／host graph遷移未完成 | [0259](batches/0259-post-promote-reverification.md)；[0258](batches/0258-promote-next-candidate.md)；[0257](batches/0257-next-candidate-promote-feasibility.md) |
