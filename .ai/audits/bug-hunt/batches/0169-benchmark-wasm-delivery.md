# 0169 Benchmark Wasm delivery

## Scope and baseline

- Previous turn made progress: requested audit commit ac24c0f96;151 excluded files were byte-identical. No further commit/push authorization in this continuation.
- Repair BH-0032 in both browser-lifecycle and delivery-mode page generation and HTTP serving, including binary payload/artifact accounting and downstream metric consumers. Use existing runtime artifacts; no product runtime changes or fixture/snapshot/lockfile/CI changes.
- BH-0033 obsolete runtime readers and BH-0034 CSSOM counting remain distinct unresolved findings. All other unfinished scope and batch0038 identity pause remain.
- Discovery: existing writeWorkspaceFiles uses fs.writeFile but restricts content to string; both generators omit runtime Wasm; both servers omit application/wasm. Current original entrypoints will provide before/after evidence.

## Reproduction and implementation

- Original lifecycle initial-load/runtime entrypoint exits1 after30s readiness timeout; original delivery report exits1 after15s. Four original runtime/progressive delivery+interaction page controls confirm HTTP404 for the Wasm sidecar and no runtime. These are benchmark delivery defects, not missing published runtime artifacts. Logs retain the failures.
- Discovery extended the same fix to interaction-cost, shared by mutation and invalidation diagnostics. Existing fs.writeFile helper now accepts string or Buffer. Each runtime page copies the real Wasm bytes, keeps JS bytes intact and includes the binary in measured artifacts. All three servers return application/wasm. No runtime, compiler or semantic source changed.
- New runtime-wasm raw/gzip/brotli metrics appear in both payload sample sets and metadata; static variants receive zero for all three. Existing JS and other metric semantics are preserved. Two snapshot generation scripts include the new payload fields; existing snapshots were neither regenerated nor edited. Interaction suites measure artifacts without inventing unrelated payload timing metrics.

## Verified results and remaining failures

- Five focused tests PASS: non-UTF8 binary preservation and both payload sample sets with/without runtime, separate JS accounting and declared metrics. Explicit benchmarks TypeScript noEmit check PASS. No package-local lint script exists.
- Three browser engines:24 delivery/interaction page controls plus12 lifecycle controls PASS. Runtime/progressive assets return200/application/wasm, exact expected bytes and hashes; static pages request no Wasm and expose no sidecar. Public runtime snapshots contain nonzero CSS/rules.
- Existing suite scripts run through with-typescript-tooling-compat in independent disposable benchmark copies: browser-lifecycle initial-load/all4 modes, master-delivery-modes all16 variants, progressive-hydration-diagnostics all4 variants and report-smoke exit0. Lifecycle/delivery payload samples, summaries, metadata and Wasm artifacts match expected bytes; progressive artifacts include4 sidecars. These checks prove delivery/accounting only.
- Existing interaction-cost, runtime-mutation-diagnostics and runtime-style-invalidation-diagnostics exit1 after Wasm loading, at their progressive guard. Six actual delivery/interaction progressive controls across Chromium153.0.8010.12, Firefox155.0 and WebKit26.6 show snapshot.hydration.state=progressive and centered probes while Boolean(runtime.progressive)=false. The guards read a removed facade field: BH-0033 remains, not a hydration product regression. Original rules/CSS/CSSOM counters still report incorrect zeros in successful reports; BH-0033/BH-0034 remain open.
- Real delivered sidecar:929757 raw,286205 gzip,218273 brotli bytes; SHA2564b8ea61c6e5e34fe620efa1435278a34adb3620ec800c097d1f7b8a5abbe3318. Compression values use existing local Node defaults, not actual HTTP content-encoding transfer measurements. Runtime artifacts are unchanged.
- No speed claim or review-grade300s measurement. Independent suites ran concurrently on this macOS/Node24.20.0 host; timing values are advisory and current invalid readers prevent trustworthy performance conclusions. Reports/generated page output remain disposable .results data and are not added to the ledger as benchmark history. Raw verification logs and compact correctness checks are retained.
- Audit bookkeeping's first multiline Python invocation failed before execution due to command-text encoding. Retried using ASCII-escaped JSON text. This was an audit script error; product source and validation results were unaffected.

## Commands and evidence

- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter ./benchmarks exec vitest run tests/bug-hunt-runtime-payload.test.ts`:5 PASS, [log](../evidence/0169-payload-tests.log).
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter ./benchmarks exec tsc --noEmit --incremental false --project tsconfig.json`:exit0, [log](../evidence/0169-types.log).
- Shared report runner: `python3 .ai/audits/bug-hunt/repros/isolated-package.py benchmarks node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node --import tsx /Users/aron/master/css/.ai/audits/bug-hunt/repros/benchmark-wasm-report.mjs <suite>` invokes the original `pnpm bench:<suite> --run`, validates payload metadata and inspects lifecycle pages in three engines before cleanup. Logs: [lifecycle](../evidence/0169-lifecycle-fixed.log), [delivery](../evidence/0169-delivery-fixed.log), [progressive](../evidence/0169-progressive-fixed.log), [smoke](../evidence/0169-report-smoke.log), [interaction](../evidence/0169-interaction-fixed.log), [mutation](../evidence/0169-mutation-fixed.log), [invalidation](../evidence/0169-invalidation-fixed.log).
- Same isolated wrapper runs `benchmark-wasm-delivery.mjs`: [before](../evidence/0169-browser-before.log) with BH_EXPECT=missing, [fixed](../evidence/0169-browser-fixed.log) with defaults, [public progressive control](../evidence/0169-progressive-public-state.log) with BH_PROGRESSIVE_CONTROL=1. Original report failures: [lifecycle](../evidence/0169-lifecycle-before.log), [delivery](../evidence/0169-delivery-before.log).

## Handoff

- BH-0032 fixed;47 historical findings,36 fixed,11 unresolved. Coverage remains65 checked/10 blocked. Full goal remains active. Next0170: migrate BH-0033 runtime measurement/guards to the public immutable snapshot, preserve class/rule/retention/hydration meanings, and rerun the failed original suites; then BH-0034 CSSOM rule counting and other benchmark findings.
- Preserve all BH-0004 graph/host/Sass-map/resource/virtual/watch/base/SSR/lifecycle/Nuxt/Webpack scope,4 root gates,4 original candidates, native immediate-close limitation and batch0038 identity-confirmation pause. No new commit/push.
