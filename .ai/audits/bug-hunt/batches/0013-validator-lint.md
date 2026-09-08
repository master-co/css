# 0013 Validator and lint policy

- 目的：valid/unknown/invalid/native support 的分類，lint order/conflict/canonical/edit IR 與修正穩定性。
- 範圍：CRATE-mastercss-validator、CRATE-mastercss-lint、PKG-tooling；ESLint AST host 留後續批次。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；外部 site/internal 變更保存不修改。
- 已讀 Cargo、lint AI、validator lib、lint session/class-list host source/host capability；validator crate 沒有 AI.md。
- 下一步：Rust/TS baseline 後選擇 UTF-16 ranges 與 fix 冪等性 corpus 驗證。

## 結果與證據

- 已讀 `mastercss-validator/src/lib.rs` generate→inspect→delete 暫存規則、lint session analyze/class-list/policy、TS lint source collect contexts/apply fixes、host css-tree capability cache。
- `cargo test -p mastercss-validator -p mastercss-lint`：validator 3、lint 10 passed，exit 0。[log](../evidence/0013-rust-tests.log)
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-tooling exec vitest run tests/validator tests/lint`：原有 5 files / 79 passed，exit 0。[log](../evidence/0013-ts-tests.log)
- 涵蓋 valid/invalid/unknown/native grouped declarations、重複 batch 不殘留規則、sort/conflict/partial conflict/compose/canonical/raw-value policy。
- 新增 `packages/tooling/tests/lint/bug-hunt.test.ts`：3 類 class corpus 重複修正收斂；Unicode/CRLF surrounding text 不變、診斷 range 不超界；1 test passed。[log](../evidence/0013-fix-stability.log)
- tooling lint/type-check exit 0：[lint](../evidence/0013-tooling-lint.log)、[type-check](../evidence/0013-tooling-typecheck.log)。補跑 lexer host session [log](../evidence/0013-lexer-host.log)。
- 未新增確認問題。所有可能語法與 host CSS grammar 版本並非窮舉；ESLint AST autofix 另批。
- 外部變更名單：[worktree](../evidence/0013-worktree.txt)，不混入本次產品結論。
- 0013 完成；tooling 所列各 subpath 已取得行為證據（0004、0010–0013），已確認問題照 findings 保留。
- 下一批 0014：language-service TextDocument 更新、功能 gating、completion/hover/color/Shiki 與 ranges。
