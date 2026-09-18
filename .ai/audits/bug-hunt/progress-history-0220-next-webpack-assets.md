# 0220 archive of prior progress

Prior paragraphs and rows retained verbatim; latest state is in the active ledgers.

## README.md

- 0219：完整graph讀取保留原預期值，隔離3檔測試調整後29PASS，patch未套用。實際Next預設Webpack候選／純Next均6PASS/6FAIL：layer被當media、外部import排到規則後；Lightning控制9PASS/3FAIL，純／候選Turbopack各12PASS；強制外部import filter則build失敗。產品候選仍未交付，正式來源與493產物保持0217。57fixed/4unresolved、65checked/10blocked及兩份Webpack patch／0038身分暫停不變，目標active，未提交。[證據](evidence/0219-final-checks.json)；[批次](batches/0219-next-webpack-import-boundary.md)；[前次](progress-history-0219-next-webpack-imports.md)。

## coverage.md

- 0219：完整graph讀取保留原預期值，隔離3檔測試調整後29PASS，patch未套用。實際Next預設Webpack候選／純Next均6PASS/6FAIL：layer被當media、外部import排到規則後；Lightning控制9PASS/3FAIL，純／候選Turbopack各12PASS；強制外部import filter則build失敗。產品候選仍未交付，正式來源與493產物保持0217。57fixed/4unresolved、65checked/10blocked及兩份Webpack patch／0038身分暫停不變，目標active，未提交。[證據](evidence/0219-final-checks.json)；[批次](batches/0219-next-webpack-import-boundary.md)；[前次](progress-history-0219-next-webpack-imports.md)。

## Prior Next coverage

| PKG-next | `packages/next` | 高 | 已檢查 | 0217 static交付保留；0219隔離graph測試29PASS、純／候選Turbopack各12PASS | 預設Webpack純／候選均6PASS/6FAIL（layer與外部import），Lightning仍3FAIL；一般loader未交付，測試patch未套用，完整maps/Modules/Sass/dev/HMR/SSR待驗 | [0219](batches/0219-next-webpack-import-boundary.md)；[此前](progress-history-0219-next-webpack-imports.md) |

## findings.md

- 0219：完整graph讀取保留原預期值，隔離3檔測試調整後29PASS，patch未套用。實際Next預設Webpack候選／純Next均6PASS/6FAIL：layer被當media、外部import排到規則後；Lightning控制9PASS/3FAIL，純／候選Turbopack各12PASS；強制外部import filter則build失敗。產品候選仍未交付，正式來源與493產物保持0217。57fixed/4unresolved、65checked/10blocked及兩份Webpack patch／0038身分暫停不變，目標active，未提交。[證據](evidence/0219-final-checks.json)；[批次](batches/0219-next-webpack-import-boundary.md)；[前次](progress-history-0219-next-webpack-imports.md)。

## Prior BH-0004

| BH-0004 | P1 | 已確認／部分修正 | CSS import 展開丟失檔案邊界，條件、cascade及managed定義失真 | 0219純Next與候選預設Webpack均6FAIL，layer誤當media且外部import排序失效；Turbopack各12PASS但一般loader候選未交付。隔離graph斷言29PASS不能取代完整host修復；raw20qualified/39external、native事件與maps仍保留。[0219](batches/0219-next-webpack-import-boundary.md)。 |

## Prior BH-0053

| BH-0053 | P1 | 部分修正 | Next/Turbopack 在 Sass 預處理前分類造成編譯失敗 | raw Sass、partial reference／缺檔恢復及additionalData origins已驗；direct output／expanded origins已驗；delivery maps、native細節與完整options/host待驗；[檢查](evidence/0183-output-maps-final-checks.json)  0187新增graph每檔原始outputMappings；bundle／inline／host source maps仍未完成。 |

## changes.md

- 0219：完整graph讀取保留原預期值，隔離3檔測試調整後29PASS，patch未套用。實際Next預設Webpack候選／純Next均6PASS/6FAIL：layer被當media、外部import排到規則後；Lightning控制9PASS/3FAIL，純／候選Turbopack各12PASS；強制外部import filter則build失敗。產品候選仍未交付，正式來源與493產物保持0217。57fixed/4unresolved、65checked/10blocked及兩份Webpack patch／0038身分暫停不變，目標active，未提交。[證據](evidence/0219-final-checks.json)；[批次](batches/0219-next-webpack-import-boundary.md)；[前次](progress-history-0219-next-webpack-imports.md)。

## report.md

- 0219：完整graph讀取保留原預期值，隔離3檔測試調整後29PASS，patch未套用。實際Next預設Webpack候選／純Next均6PASS/6FAIL：layer被當media、外部import排到規則後；Lightning控制9PASS/3FAIL，純／候選Turbopack各12PASS；強制外部import filter則build失敗。產品候選仍未交付，正式來源與493產物保持0217。57fixed/4unresolved、65checked/10blocked及兩份Webpack patch／0038身分暫停不變，目標active，未提交。[證據](evidence/0219-final-checks.json)；[批次](batches/0219-next-webpack-import-boundary.md)；[前次](progress-history-0219-next-webpack-imports.md)。
