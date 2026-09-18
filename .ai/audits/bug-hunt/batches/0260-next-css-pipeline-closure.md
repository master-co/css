# Batch 0260: BH-0051 closure and BH-0053 Turbopack Sass controls

## 目前交接點

0258把Next管線交付到主工作樹、0259完成實際host重驗後，BH-0051的三項未結原因都已不成立：候選不再「未提交」、`next-config.test.ts`的兩個舊頂層rule斷言已由交付一併取代為明確的缺席斷言、偶發timeout與完整host驗證本批以14組實際host對照補齊。本批據此結案BH-0051，並補BH-0053的Turbopack Sass對照。沒有產品變更；repro `next-webpack-css-pipeline-browser.mjs`新增`BH_NEXT_BROWSERS`（預設`chromium,firefox,webkit`，既有證據可重現）。0038仍暫停。

## repro調整

該repro原本硬寫三瀏覽器迴圈，本機Firefox仍是0227起記錄的`Could not find profile folder`環境失敗，會在WebKit之前中止整個run（首輪四組即因此各記1 failure，Chromium皆已PASS）。改為`BH_NEXT_BROWSERS`可選，預設值與原行為相同。

## BH-0051：Next原生CSS編譯（結案）

`packages/next`交付版本，每組Chromium＋WebKit各1觀察，全部`failures:0`且`cssSupportDisabled:false`——Next內建CSS支援未被停用。

| 組合 | backend | phase | 結果 |
|---|---|---|---|
| css／scss／sass | webpack | build | 3組 PASS |
| css／scss／sass | webpack | dev | 3組 PASS |
| css／scss／sass＋LightningCSS | webpack | build | 3組 PASS |
| css | turbopack | build | PASS |

配合0258的`packages/next` 24 files／152 tests與3 e2e（含`next-config`改以`rules.some(rule => rule.test?.test('/tmp/example.css')) === false`斷言舊頂層rule已不存在）、0259的15個實際host情境，BH-0051列明範圍已完成，改標**已修復**。

## BH-0053：Turbopack Sass分類（仍部分修正）

| 控制 | 結果 |
|---|---|
| turbopack scss dev | PASS |
| turbopack scss build | PASS |
| turbopack scss partial（`parts/_card.scss`） | PASS |
| turbopack scss partial＋recovery（刪除partial觀察失敗後還原） | PASS，`created missing partial after observed failure` |

分類發生在Sass預處理之後的行為在交付版本上維持成立。BH-0053維持部分修正：0243的delivery asset maps與持久快取反例、native declaration granularity、完整Sass option／host邊界仍未完成，不在本批範圍。

## 帳本

- BH-0051：已確認 → **已修復**。63historical、59→60fixed、4→3unresolved（BH-0004部分修正、BH-0029、BH-0053）。65checked／10blocked不變；goal active。
- BH-0029仍因0038身分驗證暫停而無法推進；10個受阻覆蓋單位為跨平台binding與examples／benchmarks／nested hosts的平台限制。
- pending approvals：`existingWebpackTestContract`、`watchpackDependencyPatch`仍未授權、未交付。
- 下一步：BH-0053剩餘的delivery asset maps／native declaration granularity／完整Sass host邊界；BH-0004完整public／host graph遷移；Turbopack combined-root PostCSS與late resource契約待設計。

[Final checks](../evidence/0260-final-checks.json)
