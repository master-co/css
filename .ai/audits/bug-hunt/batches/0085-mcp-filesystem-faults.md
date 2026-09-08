# 0085 MCP filesystem failures and retry

- Scope: real permission-denied failures on disposable files through actual SDK/InMemoryTransport formatting-preview/apply tools. Four scenarios: normal, stale secondfile, unwritable firstfile, unwritable secondfile. Preserve file order from actualpreview; restore permission before retry, freshpreview recovery after partialfailure. No product I/O mocks or originalworkspace writes.
- [Driver](../repros/mcp-filesystem-faults.mjs), [source hashes](../evidence/0085-source-hashes.json). Current README promises preview/token/hash/containment validation, not atomic multi-file writes. Observe exact surfaced errors and file outcomes without inventing all-or-nothing semantics.
- Scope excludes processcrash/disk-full/networkfilesystem; execution completed. Paused0038 untouched.

## Results and classification

- Command: `node scripts/with-typescript-tooling-compat.mjs node --import tsx .ai/audits/bug-hunt/repros/mcp-filesystem-faults.mjs`. [Raw SDK responses/file states](../evidence/0085-filesystem-faults.json), [log](../evidence/0085-filesystem-faults.log). Four scenarios complete onDarwin/non-rootuid501; actualmode0400fault producesEACCES, nofsI/O mocks.
- Normal: formatting preview leaves bothfiles unchanged; apply updatesboth, reusedtoken rejected. Stale secondfile: SDKisErrortrue; firstfile remainsoriginal, secondexternalcontents preserved. This verifies allbeforehashes are checked beforewrites.
- Unwritable firstfile: EACCES/isErrortrue, neitherfilechanges. Restoring0600allows the same token toapplyboth. Unwritable secondfile: EACCES/isErrortrue, firstfilealreadyformatted, secondunchanged. Permissionrestoration plus sametoken retries fail stalehash onfirstfile; freshpreview contains onlysecondfile and applies successfully. Endpoint remains usable throughout.
- No newfinding: README:84 promises token/hash/containment checks, not transactionality or retryidempotence; applytool annotations explicitly idempotentHintfalse. Errorresponses reportEACCES rather thanappliedtrue. Partial-write consequences and lack of a structured partial-change list are observed limitations, not evidence of an undocumented atomicity contract. Do not merge this intoBH-0031 concurrency finding.
- Source context.ts:221–246 validatesallpaths/hashes,249–252 writessequentially andconsumestokenonlyafterallwrites; server.ts:583 delegates, SDKsurfaces thrownerrors asisErrortrue/plaintext. Recovery uses normal reviewedfreshpreview, notmanualproduct repair.
- Tool54286exit0; SDKclient/server disposed andtemporaryrootremoved. No newpackage-localtest/source edits; priorMCP lint baseline remains applicable. No originalfixtures/dependencies/lockfile/commit changes orpaused0038execution.
- Next0086: bounded own-process termination/restart control for preview lifetime and interruptedapply; preserve original filesystemstate and observedterminalPID, no durability/atomicity assumptions. Otherplatform/long-session/service and13blockedunits remain unfinished;43confirmed unchanged.
- Final [checks](../evidence/0085-final-checks.json), [inventory](../evidence/0085-file-inventory.json), [AI context](../evidence/0085-ai-context.log).
