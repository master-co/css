# 0068 CSS output-size report

- Scope original suite, fourfixtures×Master/Tailwind CLI/Vite16variants, each original round0. Read suite/shared static-build/bytes/runner; only isolated benchmarks/.results writes, tool packages read, no install/build of product packages. Existing fixture CSS markers retained. Local correctness baselines remain current; no speed comparison.
- [Driver](../repros/css-output-report.mjs), [source hashes](../evidence/0068-source-hashes.json). Driver verifies serialized artifact SHA256/raw/gzip/brotli against actual emitted files and report samples before saving evidence. Suite and independent artifact validation passed.

## Results

- Command: `python3 .ai/audits/bug-hunt/repros/isolated-package.py benchmarks node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node /Users/aron/master/css/.ai/audits/bug-hunt/repros/css-output-report.mjs`. Existing suite1PASS;16variants all completed,64samples/summary,16CSSartifacts. [Log](../evidence/0068-css-output.log), [original report](../evidence/0068-css-output-report.json), [independent validation](../evidence/0068-validation.json).
- For each artifact, reread actual bytes and independently recompute SHA256/gzip/brotli; all serialized artifact properties match. Each variant has one CSSfile; all four sample values equal the corresponding actual artifact values; all values finite and summary sampleCount1. Original fixture marker gates passed on all16builds.
- No finding added. This completes current CSS output-size suite execution and artifact/report consistency; it does not validate all rendered UI equivalence or show a performance advantage. Local tool versions/environment remain in raw report. No snapshot/history updater or product edit. Isolated process exit0 and directory removed. Benchmarks has no local lint script.

- Final reconciliation: [source/ownership/link/budget checks](../evidence/0069-final-checks.json), [inventory](../evidence/0069-file-inventory.json), [AI context check](../evidence/0069-ai-context.log).
