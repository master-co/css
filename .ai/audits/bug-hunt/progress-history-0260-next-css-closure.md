# 0260 Previous checkpoint archive

以下0259交接與受影響列逐字保留。

- 0259：交付後以實際host對主工作樹重驗Next結論，16情境×Chromium／WebKit：Webpack 8個PostCSS情境與Turbopack 7個Module情境全PASS，0237／0247的combined-root PostCSS與0226–0231的Module契約在產品上重現；BH-0051／0053／0054維持成立。Turbopack `encoded-composes` build失敗經pure對照證實為Turbopack自身拒絕百分號編碼composes路徑，與0227一致，不新增finding。四份帳本歷史敘述逐字歸檔至`*-history-0259.md`：findings 45.9→19.0K、coverage 45.5→36.7K、report 42.1→29.9K、changes 40.2→11.0K，全部回到40 KiB內，check:ai-context通過。63historical／59fixed／4unresolved不變。[證據](evidence/0259-final-checks.json)；[批次](batches/0259-post-promote-reverification.md)；[前次](progress-history-0259-reverification.md)。

| BH-0051 | P1 | 已確認 | Next --webpack 頂層CSS rule移除原生CSS loaders，CSS被當JS解析 | 管線部分修正；default及LightningCSS production各9browser通過；偶發timeout及完整host邊界仍待驗；[checkpoint](evidence/0183-sass-preparation-final-checks.json) |

| BH-0053 | P1 | 部分修正 | Next/Turbopack 在 Sass 預處理前分類造成編譯失敗 | 0249 late資源刪除／還原與定義刪除／還原在Webpack dev雙瀏覽器PASS；0248 watch／HMR、0247 policy刪改歷史與真實Webpack build PASS。sibling歷史、Turbopack、promote與0243 maps／cache反例保持未完成。[0249](batches/0249-postcss-resource-dev-recovery.md)；[此前](progress-history-0249-postcss-resource-dev-recovery.md) |
