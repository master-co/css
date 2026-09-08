# 0041 Benchmark report/harness contracts

- HEAD9bc565e512744e7fe6e4f28ae42fafa71f8b18ad; README/coverage0040 read. Scope SUP-benchmarks, correctness of report/fixture/stats inputs and cleanup.
- Manifest/AI/performance pack, report-smoke, shared report/stats/fixtures/runner read. No performance comparison; smoke uses explicitly fake data. No snapshots/history/evidence update commands. Pending report smoke and normal/error stats/fixture controls.

## Results

- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter ./benchmarks exec vitest bench report-smoke --run`:1 PASS exit0 ([log](../evidence/0041-report-smoke.log)). Actual fresh `.results/report-smoke/report.json` generated2026-09-08T11:09:45.292Z;70 fake samples,14 summaries. JSON/Markdown writer exercised; no performance numbers published or history refreshed.
- `node --import tsx .ai/audits/bug-hunt/repros/benchmark-controls.mts`: PASS ([log](../evidence/0041-controls.log)). Finite/NaN/infinity/empty/even median, variant isolation, valid/duplicate/missing fixture; actual child command stdout, error/stderr propagation and timeout termination verified. No product edits. No package-local lint script.
- Bounded report/harness coverage complete; all performance suites/long-session/remote history measurements not executed, not correctness substitutes. No new finding.
