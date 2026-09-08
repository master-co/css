# 0016 VS Code delivery and host lifecycle

- 目的：bundle/package/native staging、stdio server、extension activate/settings/restart/deactivate 與可取得 host。
- 範圍：PKG-vscode；LSP/core 使用前批結果。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；foreign site/internal changes 保留。
- 已讀 package/AI、extension.min.ts、tsdown.config、server-bundle/release-scripts tests。
- 限制：正常 build 會呼叫 generate 改 package contributions，改用 `exec tsdown` 僅生成 dist；release/publish 不執行。
- 下一步：檢查 staging 副作用後跑既有 tests，查可用 VS Code host。

## 已驗證

- `pnpm --filter @master/css-vscode exec tsdown`：exit 0，仅 dist，未跑 generate。[build](../evidence/0016-build.log)
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-vscode exec vitest run`：3 files / 31 passed，exit 0。[tests](../evidence/0016-tests.log)
- 檢查 staging 的 package/grammar/native artifacts、缺少 artifact 錯誤、publisher/target 參數、release dry-run；未 publish。stdio server test 使用獨立子程序並關閉。
- `pnpm --filter @master/css-vscode type-check`：exit 0。[log](../evidence/0016-typecheck.log)
- 真實 VS Code 1.135.0 arm64：新增 audit repro `repros/vscode-host.mjs` 與 `vscode-host.cjs`，staged extension + 獨立暫存 profile/extensions/workspace；開 HTML、activate、hover、restart、文件 class 更新後 hover，再正常結束 extension host。
- `node .ai/audits/bug-hunt/repros/vscode-host.mjs`：exit 0；active=true、初始 hover color、更新後 display:block、documentVersion=2。[result](../evidence/0016-vscode-host.json)、[log](../evidence/0016-vscode-host.log)
- wrapper finally 清理自己建立的暫存目錄；沒有改使用者 VS Code profile，也沒有留下 host process。

## Harness 修正與排除

- 首次 code CLI 返回 0 但沒有 result，不能視為通過；改用實際 app executable（Info.plist 指向 MacOS/Code）。
- 首個 host assertion 用 JSON.stringify(MarkdownString) 只能看到空物件；改讀 contents.value 後取得 CSS 並通過，屬測試 harness 問題，不是產品 bug。
- VS Code 的 AgentHost/provider catalog 訊息屬 host 其他功能，未影響 Master CSS 測試；未以這些訊息列產品問題。
- Windows/Linux target 真機仍沿 0006 受阻；本機 host 基本 lifecycle 已檢查。未窮舉取消/所有 settings 重啟時序。
- 0016 完成；下一批 0017 ESLint plugin/config，正常/invalid AST/fix 範圍/重複穩定性。
