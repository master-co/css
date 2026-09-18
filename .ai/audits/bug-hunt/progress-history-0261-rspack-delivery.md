# 0261 Previous checkpoint archive

以下0260交接與受影響列逐字保留。

- 0260：BH-0051結案。交付版本以14組實際host對照補齊：webpack css／scss／sass的build與dev、三種語法＋LightningCSS build、turbopack css build，每組Chromium＋WebKit皆`failures:0`且`cssSupportDisabled:false`；配合0258的152tests／3e2e（`next-config`已改為斷言舊頂層rule缺席）與0259的15情境，BH-0051列明範圍完成。BH-0053補turbopack scss dev／build／partial／partial+recovery四組PASS，仍維持部分修正（delivery asset maps、native declaration granularity、完整Sass host邊界未完成）。repro新增`BH_NEXT_BROWSERS`以繞過本機Firefox環境失敗，預設行為不變。63historical／60fixed／3unresolved。[證據](evidence/0260-final-checks.json)；[批次](batches/0260-next-css-pipeline-closure.md)；[前次](progress-history-0260-next-css-closure.md)。

| BH-0029 | P1 | 已確認 | Rspack succeedModule 無 source，static 模式漏掉所有 managed CSS | Webpack/Rspack/Rsbuild；[0038](batches/0038-integration-lab.md)；追加驗證暫停 |
