# 0014 Language service document features

- 目的：TextDocument→Rust analysis→completion/hover/colors/tokens/format，settings/版本更新與 dispose；Shiki 同一語意消費者。
- 範圍：PKG-language-service；Rust 根因沿 BH-0013/0014。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；foreign site/internal edits 保存；本批產品不改。
- 已讀 package/AI、core.ts、tests 目錄；下一步檢查 feature cache/來源 ranges 與既有全部 tests。

## 結果

- 已追 core TextDocument 每次 getText→session；features/suggest-syntax、render-syntax-colors、render-semantic-tokens 的 edit/range mapping，Shiki session ownership；session/completion-cache/shiki-session tests。
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-language-service exec vitest run`：新增測試前 32 files / 372 passed，exit 0，19.22s。[log](../evidence/0014-tests.log)
- 涵蓋各 framework context、空白/跳脫、completion cache 不被呼叫者污染、hover/color/format、semantic mode、Shiki grammar/session 資源管理；不代表已開啟真實 editor。
- 新 `packages/language-service/tests/bug-hunt.test.ts`：同 URI TextDocument v1→v2→空 v3，class/color 結果替換，emoji/CRLF 前綴；1 passed。[log](../evidence/0014-document-update.log)
- package lint/type-check exit 0：[lint](../evidence/0014-lint.log)、[type-check](../evidence/0014-typecheck.log)。
- 無新增問題。Rust BH-0013/0014 仍影響上游 IR，未因 host baseline 通過而排除。
- 0014 完成；下一批 0015 LSP workspace/manifest reload、診斷/文件 close、connection disposal。
