# 0086 MCP context process interruption

- Scope: own OS worker processes with actual Context, no product I/O hooks. Terminate after preview but before apply; then interrupt1024file sequentialapply after observing firstfilecontents change. Record terminalPID/signal and everyfile; freshcontext rejectsoldtoken, freshpreview recovers remaining changes. IPC is orchestration, not anadditionalstdio/SDKtransportclaim.
- [Driver](../repros/mcp-process-interruption.mjs), [source hashes](../evidence/0086-source-hashes.json). All files belong to disposable root; no originalworkspace writes orpaused0038execution. No durability/atomicity assumptions. Execution completed.

## Results

- Command `node --import tsx .ai/audits/bug-hunt/repros/mcp-process-interruption.mjs`; [evidence](../evidence/0086-process-interruption.json), [log](../evidence/0086-process-interruption.log). Preview-before-apply process69440terminatedSIGKILL; file unchanged. Freshprocess69441rejectsoldtoken andfreshpreview correctlyapplies.
- Actual1024fileapply process69456terminatedSIGKILL immediatelyafterparentobserved firstfile'sdesiredcontents. Terminaleventconfirmed;1fullyupdated/1023unchanged/0otherstates saved for everyfile. No observation timeout used as evidence ofdeath, no productI/O monkeypatch/barrier. Parentreceivedterminatedresult rather thanappliedtrue.
- Newprocess69471rejectsoldtoken; freshpreviewcontains1023remainingchanges, thenall1024filesmatch intendedcontents. Recoveryworkers69441/69471exit0. Auditexit0; temporaryrootremoved, allfourworkerexitstatuses preserved.
- Classification: no newfinding. Context stores previews in aprocess-localMap andsequentiallywritesfiles (src/context.ts:102,221–252). PublicREADMEdoesnotpromise durablepreviewstorage or crash-atomicupdates. This demonstrates bounded processlifetime/interruptedwrite/recovery behavior, not power-loss durability or everyfile/OS crashinterleaving. Prior0085 SDKerrorresponses remainseparateevidence.
- Onlyledger/repro/evidence added; no package-localtest/sourcechanges or redundantMCP lint rerun. No existingfixture/dependency/commit/paused0038work.43confirmed/13blocked unchanged.
- Next0087 completion/prerequisite reconciliation: allthree concrete authorizedfollow-ups listed in0081 nowhave bounded evidence (MCP0082/0085/0086, editor0083, staticchildren0084). Preserve everycurrentcoverage remainingcell andtestobligation; verify13blockers/currenthost/sourceconditions, externalservice/install requirements and explicitopen-ended residuals. Do notclear blockers byclassification orstart arbitrary newcases inplaceofproving requestedcompletion.
- Final [checks](../evidence/0086-final-checks.json), [inventory](../evidence/0086-file-inventory.json), [AI context](../evidence/0086-ai-context.log).
