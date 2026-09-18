# Batch 0259: Post-promote re-verification and ledger archive

## 目前交接點

0258把0232–0256候選交付到主工作樹，`packages/next`整條loader路徑被取代。帳本規則要求「變動的舊結論標待重驗」，因此本批用實際host重現對交付後的產品重跑Next相關結論，並依0254慣例歸檔四份帳本的歷史段落。沒有產品變更。0038仍暫停。

## 交付後實際host重驗（16情境×Chromium／WebKit）

全部對**主工作樹**的`packages/next`（非owned副本）執行。

| bundler | 情境 | 結果 |
|---|---|---|
| Webpack | postcss-added-composes、postcss-added-import、postcss-added-nested-composes、postcss-added-resource、postcss-global-resource、postcss-global-context、postcss-generated-keyframe、postcss-imported-keyframe | 8/8 PASS |
| Turbopack | postcss-composes、module-animation、alias-composes、package-composes、query-composes、fragment-composes、escaped-composes | 7/7 PASS |
| Turbopack | encoded-composes | build FAIL（見下） |

0237／0247在owned副本得到的Webpack combined-root PostCSS結論（user plugin同時看到authored與generated、late resource rebase、generated global保有所有權）在交付後的產品上重現通過；0226–0231的Module scope／inline／request契約亦在Turbopack上重現通過。BH-0051、BH-0053、BH-0054的Next結論維持成立，不需改標待重驗。

## encoded-composes：Turbopack側行為，非產品缺陷

`composes:shared from "./other%20module.module.css"`在Turbopack建置失敗：

- Master：`Unable to resolve relative './other%20module.module.css'`（`stylesheet-loader`回報）
- **pure Turbopack對照（無Master）**：`Module not found: Can't resolve './other%20module.module.css'`＋`An issue occurred while resolving a CSS module 'composes:' rule`

兩者同樣拒絕，與0227「pureTurbo also rejects this encoded composition request，不可把Webpack policy外推到Turbo」一致。Webpack側的百分號編碼路徑修復（0227）不受影響。不新增finding。[master](../evidence/0259-turbopack-encoded-composes.json)；[pure](../evidence/0259-turbopack-encoded-composes-pure.json)

## 帳本歸檔（比照0254）

四份帳本的逐批歷史敘述逐字移出，表格、清單與最新批次留在原檔，各留一行指標：

| 檔案 | 歸檔前 | 歸檔後 | 歷史檔 |
|---|---|---|---|
| findings.md | 45.9 KiB | 19.0 KiB | [findings-history-0259.md](../findings-history-0259.md) |
| coverage.md | 45.5 KiB | 36.7 KiB | [coverage-history-0259.md](../coverage-history-0259.md) |
| report.md | 42.1 KiB | 29.9 KiB | [report-history-0259.md](../report-history-0259.md) |
| changes.md | 40.2 KiB | 11.0 KiB | [changes-history-0259.md](../changes-history-0259.md) |

四份都回到320行／40 KiB的拆分建議值以內（README 28.0 KiB本來就在範圍內）。`pnpm run check:ai-context`通過（3302 files）。

## 帳本

- 63historical、59fixed、4unresolved不變（BH-0004部分修正、BH-0029、BH-0051、BH-0053）。65checked／10blocked不變；goal active。
- 10個受阻覆蓋單位是跨平台binding（darwin-x64、linux×4、win32×2）與examples／benchmarks／nested hosts，受本機平台與既有環境限制，非本批可完成。
- pending approvals：`existingWebpackTestContract`、`watchpackDependencyPatch`仍未授權、未交付。
- 下一步：Turbopack combined-root PostCSS與late resource契約仍不存在，需另行設計；BH-0004完整public／host graph遷移、BH-0029 Rspack仍未完成。

[Final checks](../evidence/0259-final-checks.json)
