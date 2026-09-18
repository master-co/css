# 0242 前次交接原文

本檔保存0242更新前的0241共同交接與受影響索引列；未完成要求不因壓縮刪除。

## README.md

- 0241：raw map改絕對file URL，修正0239普通CSS分流帶來的child路徑回歸；default／Rust prototype均通過。8build／16browser、18anchors PASS／1FAIL；合併selector偏移純Next亦重現，仍未完成。保留0241 Next候選54／64，Rust契約與global closure待續，未交付。[證據](evidence/0241-final-checks.json)；[批次](batches/0241-next-postcss-map-context.md)；[前次](progress-history-0241-next-postcss-map-context.md)。

## coverage.md

- 0241：raw map改絕對file URL，修正0239普通CSS分流帶來的child路徑回歸；default／Rust prototype均通過。8build／16browser、18anchors PASS／1FAIL；合併selector偏移純Next亦重現，仍未完成。保留0241 Next候選54／64，Rust契約與global closure待續，未交付。[證據](evidence/0241-final-checks.json)；[批次](batches/0241-next-postcss-map-context.md)；[前次](progress-history-0241-next-postcss-map-context.md)。

| PKG-next | `packages/next` | 高 | 已檢查 | 0241 raw map來源URL修正，8build／16browser及18maps PASS | 未交付；1native Next selector map FAIL、Rust prototype3預設格式FAIL、global closure及完整host要求待續 | [0241](batches/0241-next-postcss-map-context.md)；[此前](progress-history-0241-next-postcss-map-context.md) |

## findings.md

- 0241：raw map改絕對file URL，修正0239普通CSS分流帶來的child路徑回歸；default／Rust prototype均通過。8build／16browser、18anchors PASS／1FAIL；合併selector偏移純Next亦重現，仍未完成。保留0241 Next候選54／64，Rust契約與global closure待續，未交付。[證據](evidence/0241-final-checks.json)；[批次](batches/0241-next-postcss-map-context.md)；[前次](progress-history-0241-next-postcss-map-context.md)。

| BH-0004 | P1 | 已確認／部分修正 | CSS import 展開丟失檔案邊界，條件、cascade及managed定義失真 | 0240 source保留原型8build／16browser證據保持；0241修正raw map路徑，default/prototype通過。Rust正式opt-in契約、global closure／raw20qualified/39external／完整host仍未完成。[0241](batches/0241-next-postcss-map-context.md)。 |

| BH-0053 | P1 | 部分修正 | Next/Turbopack 在 Sass 預處理前分類造成編譯失敗 | 0241已修候選raw map把child解析到project root的回歸，18anchors PASS／1FAIL；剩下合併selector48vs26，純Next也失敗但要求仍未完成。歷史Sass／Turbo重複URI／細maps及完整host範圍保持，未交付。[0241](batches/0241-next-postcss-map-context.md)；[此前](progress-history-0241-next-postcss-map-context.md) |

## changes.md

- 0241：raw map改絕對file URL，修正0239普通CSS分流帶來的child路徑回歸；default／Rust prototype均通過。8build／16browser、18anchors PASS／1FAIL；合併selector偏移純Next亦重現，仍未完成。保留0241 Next候選54／64，Rust契約與global closure待續，未交付。[證據](evidence/0241-final-checks.json)；[批次](batches/0241-next-postcss-map-context.md)；[前次](progress-history-0241-next-postcss-map-context.md)。

## report.md

- 0241：raw map改絕對file URL，修正0239普通CSS分流帶來的child路徑回歸；default／Rust prototype均通過。8build／16browser、18anchors PASS／1FAIL；合併selector偏移純Next亦重現，仍未完成。保留0241 Next候選54／64，Rust契約與global closure待續，未交付。[證據](evidence/0241-final-checks.json)；[批次](batches/0241-next-postcss-map-context.md)；[前次](progress-history-0241-next-postcss-map-context.md)。

