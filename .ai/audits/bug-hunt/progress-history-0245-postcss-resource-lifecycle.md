# 0245 Previous checkpoint archive

以下0244交接與受影響列逐字保留；各批次反例仍可直接追溯。

## README.md

- 0244：隔離Compiler新增emittedGlobals差集API，累計428tests及build／types／lint PASS；雙瀏覽器證實保留舊插件值，但新global仍漏插件，重跑則重複副作用。未併入Next或root；完整closure未完成。[證據](evidence/0244-final-checks.json)；[批次](batches/0244-rendered-resource-context.md)；[前次](progress-history-0244-rendered-resource-context.md)。

## coverage.md

- 0244：隔離Compiler新增emittedGlobals差集API，累計428tests及build／types／lint PASS；雙瀏覽器證實保留舊插件值，但新global仍漏插件，重跑則重複副作用。未併入Next或root；完整closure未完成。[證據](evidence/0244-final-checks.json)；[批次](batches/0244-rendered-resource-context.md)；[前次](progress-history-0244-rendered-resource-context.md)。

| PKG-next | `packages/next` | 高 | 已檢查 | 0244 Compiler差集保留舊值；實際PostCSS＋雙browser確認新global漏處理 | 未交付；完整插件closure、selector maps、cache publication及host邊界未完成 | [0244](batches/0244-rendered-resource-context.md)；[此前](progress-history-0244-rendered-resource-context.md) |

## findings.md

- 0244：隔離Compiler新增emittedGlobals差集API，累計428tests及build／types／lint PASS；雙瀏覽器證實保留舊插件值，但新global仍漏插件，重跑則重複副作用。未併入Next或root；完整closure未完成。[證據](evidence/0244-final-checks.json)；[批次](batches/0244-rendered-resource-context.md)；[前次](progress-history-0244-rendered-resource-context.md)。

| BH-0053 | P1 | 部分修正 | Next/Turbopack 在 Sass 預處理前分類造成編譯失敗 | 0244隔離差集API通過，但新global仍漏PostCSS、重跑有副作用。0243 selector map與cache publication反例保留；完整Sass／maps／host未完成。[0244](batches/0244-rendered-resource-context.md)；[此前](progress-history-0244-rendered-resource-context.md) |

## changes.md

- 0244：隔離Compiler新增emittedGlobals差集API，累計428tests及build／types／lint PASS；雙瀏覽器證實保留舊插件值，但新global仍漏插件，重跑則重複副作用。未併入Next或root；完整closure未完成。[證據](evidence/0244-final-checks.json)；[批次](batches/0244-rendered-resource-context.md)；[前次](progress-history-0244-rendered-resource-context.md)。

## report.md

- 0244：隔離Compiler新增emittedGlobals差集API，累計428tests及build／types／lint PASS；雙瀏覽器證實保留舊插件值，但新global仍漏插件，重跑則重複副作用。未併入Next或root；完整closure未完成。[證據](evidence/0244-final-checks.json)；[批次](batches/0244-rendered-resource-context.md)；[前次](progress-history-0244-rendered-resource-context.md)。

