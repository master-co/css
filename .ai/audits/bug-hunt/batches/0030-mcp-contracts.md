# 0030 MCP tool/result/preview lifecycle

- Scope PKG-mcp; engine/compiler/tooling/language service upstream. HEAD unchanged; README/coverage MCP read. Package/AI, server.ts, context.ts, bin and core tests read.
- Flow MCP schemas→context/project/source tools→structured result; preview→token→apply/dispose. Existing tests use actual SDK in-memory transport and temporary project files. No external MCP client/user files used.
- Normal/error/stale-preview/context routing/Unicode metadata and actual stdio lifecycle to check. Security SSR/CSP proofs are not rerun.

## Results and BH-0020 (P3, confirmed)

- Baseline `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-mcp exec vitest run`: 17 PASS, exit 0 ([log](../evidence/0030-tests.log)). Actual SDK in-memory schema/tools/resources/prompts, CSS/source/diagnostics/context routing, preview/one-use token, stale writes/errors, disposal.
- New `tests/bug-hunt-preview-bytes.test.ts`: ASCII control PASS, Unicode FAIL (exit 1) ([log](../evidence/0030-bytes.log)). Preview é→😀 reports before/after bytes 1/2 rather than UTF-8 2/4.
- Source `packages/mcp/src/context.ts:184-185`: beforeText.length/afterText.length count UTF-16 units, aggregated into byte metadata. Impact inaccurate per-file/summary sizes for non-ASCII previews; file contents/hashes remain correct. Use Buffer.byteLength(text, 'utf8') for these fields.
- `pnpm --filter @master/css-mcp build` PASS; `node .ai/audits/bug-hunt/repros/mcp-stdio.mjs` PASS: actual child initialization, 20 tools/3 resources parsed over stdio, close/cleanup ([log](../evidence/0030-stdio.log)). No stdout protocol contamination in this path.
- MCP lint PASS. Only new regression test/repro/ledger; no actual user file modification. Remaining broader concurrency/multiroot races not exhaustively tested. Completed.
