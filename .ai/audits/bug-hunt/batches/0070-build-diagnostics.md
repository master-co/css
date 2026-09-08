# 0070 Build diagnostics

- Prior0067–0069 completed executions and confirmedBH-0039: progress, not blocked/no-progress turn. Current root/index read; benchmark package/AI and current ledger checked; package-routing/performance/testing/guardrails and full build helper/suite/child read0069. HEAD3d2f47768 unchanged, foreign site config preserved.
- Scope original build-diagnostics suite, one round, fourfixtures×CLI/Vite8variants; own isolated workspaces/baseline/dist only. Existing marker gates retained. No product edits/installs, snapshots/history, or paused0038 checks. Current correctness baselines unchanged; report availability/contract audit, not speed comparison.
- [Driver](../repros/build-diagnostic-report.mjs), [source hashes](../evidence/0070-source-hashes.json). Original suite completed; report generation will not alone establish semantic correctness of all metric labels, especially Vite hook counts.

## Results

- Command: `python3 .ai/audits/bug-hunt/repros/isolated-package.py benchmarks node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node /Users/aron/master/css/.ai/audits/bug-hunt/repros/build-diagnostic-report.mjs`. [Log](../evidence/0070-build-diagnostics.log), [raw report](../evidence/0070-build-report.json), [validation](../evidence/0070-validation.json). Original1PASS,8variants,108finite samples/summary. CLI12samples andVite15samples each; every summary sampleCount1 and existing marker gate passes.
- All8artifact SHA256/raw/gzip/brotli match the respective actual artifact previously independently validated0068; all3byte metric values also match each artifact. No product output difference seen. Possible relative Vite input-path concern did not reproduce; both CLI andVite finish.
- The19metric declarations omit2emitted hook-count IDs (`vite-html-scan-count`, `vite-module-scan-count`). Report summary intentionally falls back to count units and retains values; no evidence of dropped/zero data or consumer failure, so no new finding for this alone.
- CLI source-file-count1; eachVite report source-file-count6 comes from5transform+1HTMLhook callbacks. This is not yet evidence of six unique scanned files. 0072 subsequently traced actual module IDs/scan eligibility with unchanged CSS and confirmedBH-0041; do not treat finite values as proof of that label.
- Suite execution and bounded report/output checks complete; original phase reports/lifecycle/other benchmark blockers remain. No performance comparison: local diagnostic timings, public HTTP batch overlapped part of run. Process exited0 and clone removed. Benchmarks has no local lint script; no product package files changed.

- Final reconciliation: [source/ownership/link/budget checks](../evidence/0072-final-checks.json), [inventory](../evidence/0072-file-inventory.json), [AI context check](../evidence/0072-ai-context.log).
