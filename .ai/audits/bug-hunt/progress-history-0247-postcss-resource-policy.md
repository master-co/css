# 0247 Previous checkpoint archive

以下0246交接與受影響列逐字保留；不得把adapter機制解讀為已交付完整host修正。

## README.md

- 0246：新隔離Next加入request-local PostCSS adapter；143tests、20項最終複驗、3e2e及build／types／lint PASS。修正proxy身分與lastPlugin；資源刪改計數／自動接線仍未完成。[證據](evidence/0246-final-checks.json)；[批次](batches/0246-postcss-request-adapter.md)；[前次](progress-history-0246-postcss-request-adapter.md)。

## coverage.md

- 0246：新隔離Next加入request-local PostCSS adapter；143tests、20項最終複驗、3e2e及build／types／lint PASS。修正proxy身分與lastPlugin；資源刪改計數／自動接線仍未完成。[證據](evidence/0246-final-checks.json)；[批次](batches/0246-postcss-request-adapter.md)；[前次](progress-history-0246-postcss-request-adapter.md)。

| PKG-next | `packages/next` | 高 | 已檢查 | 0246 owned adapter：143tests＋20複驗／3e2e，native loader與並行隔離通過 | 未交付；context刪改同步、真實resource接線、ownership／maps／cache／完整host待續 | [0246](batches/0246-postcss-request-adapter.md)；[此前](progress-history-0246-postcss-request-adapter.md) |

## findings.md

- 0246：新隔離Next加入request-local PostCSS adapter；143tests、20項最終複驗、3e2e及build／types／lint PASS。修正proxy身分與lastPlugin；資源刪改計數／自動接線仍未完成。[證據](evidence/0246-final-checks.json)；[批次](batches/0246-postcss-request-adapter.md)；[前次](progress-history-0246-postcss-request-adapter.md)。

| BH-0053 | P1 | 部分修正 | Next/Turbopack 在 Sass 預處理前分類造成編譯失敗 | 0246 request-local adapter機制通過native loader與並行測試；尚未自動接入compiler資源，刪改context／Modules所有權與0243 maps／cache反例保持未完成。[0246](batches/0246-postcss-request-adapter.md)；[此前](progress-history-0246-postcss-request-adapter.md) |

## changes.md

- 0246：新隔離Next加入request-local PostCSS adapter；143tests、20項最終複驗、3e2e及build／types／lint PASS。修正proxy身分與lastPlugin；資源刪改計數／自動接線仍未完成。[證據](evidence/0246-final-checks.json)；[批次](batches/0246-postcss-request-adapter.md)；[前次](progress-history-0246-postcss-request-adapter.md)。

## report.md

- 0246：新隔離Next加入request-local PostCSS adapter；143tests、20項最終複驗、3e2e及build／types／lint PASS。修正proxy身分與lastPlugin；資源刪改計數／自動接線仍未完成。[證據](evidence/0246-final-checks.json)；[批次](batches/0246-postcss-request-adapter.md)；[前次](progress-history-0246-postcss-request-adapter.md)。
