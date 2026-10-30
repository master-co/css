# Architecture evaluation kit

This is a small, standalone investigation, not a new production mode or a CI performance gate. It uses existing public compiler/engine APIs, CLI builds, and Chromium. It does not change grammar, the runtime program format, pruning defaults, or package/build configuration. Generated workspaces, screenshots, transcripts and reports belong in `benchmarks/.results/architecture-evaluation/` and are ignored by Git.

## Run the deterministic controls

From the repository root, with workspace dependencies, current native/Wasm artifacts, built CLI/MCP packages and Playwright Chromium available:

```sh
bun benchmarks/architecture-evaluation/run.ts selftest
bun benchmarks/architecture-evaluation/experiments.ts
```

`selftest` builds all four arms and checks both the starter and the harness solution for each task: 48 browser scenarios. Each starter must fail exactly its requested change; every unrelated control must still pass. Every solution must pass. This tests the fixtures and evaluator, not model ability. The MCP arm uses identical source/build fixtures to the CLI arm; this control run does not exercise an MCP client or an AI assistant.

`experiments.ts` writes its source, emitted CSS, manifest, binary program and byte/structure report under `.results/architecture-evaluation/bounded/`. It performs 48 computed-style comparisons for the finite utility/wrapper experiment and a separate unseen-class check. It does not collect timing samples.

## Six fixed second changes

Each trial starts from an existing working page. Tasks are independent, not cumulative.

| Task | Requested change | Acceptance includes |
| --- | --- | --- |
| `token-migration` | Rename brand to accent and change its value | Both surfaces updated, old token removed, independently named information token with the same initial value preserved |
| `responsive-layout` | Two cards columns from 768px | 375/767/768/1024px, independent three-column grid preserved |
| `scoped-hover` | Red danger hover | Resting state, hover, secondary button controls |
| `dynamic-value` | Arbitrary progress through the existing API | −20, 0, 63.5, 120 clamp correctly without browser compilation |
| `source-discovery` | Add warning to an existing state API | Warning and return-to-neutral after production build |
| `reduced-motion` | Disable only pulse for reduced motion | Both preference modes, independent spin retained |

Arms are `native-css`, `tailwind`, `master-cli`, `master-mcp`. Native CSS uses ordinary selectors/custom properties; Tailwind and Master use their existing class syntax. All arms can read/edit files, use the browser and their own build tools. The Master CLI arm can use `lint`/`inspect`; the MCP arm adds the local MCP tools. Keep other tool access equal. This measures these authoring/tool bundles, not syntax alone.

The shared page intentionally includes unrelated native classes, animation controls and plain prose resembling utility names. Diagnostics about that prose are not automatically correct. Human adjudication requires a location and evidence; do not count every unknown string as a defect.

## Run real model trials

```sh
bun benchmarks/architecture-evaluation/run.ts init pilot
```

Fill `.results/architecture-evaluation/pilot/protocol.json`: exact provider, model ID/revision, harness, reasoning/temperature/seed settings where available, reviewer and pinned documentation revision. Leave unsupported settings explicitly documented. Preparation refuses missing model identity. Use one frozen protocol and at least three repetitions: 6 tasks × 4 arms × 3 = 72 trials. A different model/configuration needs a new experiment ID.

Use a fresh session per trial; expose only that trial and the pinned documentation. Do not expose the evaluator's solution fixtures, previous transcripts or control workspaces. The runner provides the workspace and protocol; the operator/harness must enforce this access boundary and the time/tool budget. No model credentials or model runner are included.

For repetition `r` (zero-based), visit tasks in their listed order rotated by `r`; for task index `t`, visit arms in their listed order rotated by `(r + t) % 4`. This deterministic counterbalancing avoids always giving one arm the first attempt. Do not discard failures or rerun only unfavorable outcomes.

```sh
bun benchmarks/architecture-evaluation/run.ts prepare pilot master-cli responsive-layout 1
bun benchmarks/architecture-evaluation/run.ts start benchmarks/.results/architecture-evaluation/pilot/master-cli-responsive-layout-1
```

Give the participant `PROMPT.md`. For the MCP arm, connect the generated `mcp.json` in the chosen client; it points at the same workspace. Save the complete prompt, edits, tool calls and responses as a transcript. Stop at the frozen budget (defaults: 900 seconds, 60 tool calls). Installation/model loading happen before `start`; tool waiting, builds, repairs, acceptance and review happen after it.

```sh
bun benchmarks/architecture-evaluation/run.ts check benchmarks/.results/architecture-evaluation/pilot/master-cli-responsive-layout-1
```

Review `acceptance.json`, `review.png`, the edited source and the transcript. Reject unrelated behavior changes, switching away from the assigned authoring idiom, new runtime compilers, dependency additions, evaluator tampering and hard-coded acceptance tricks. Computed styles do not establish visual quality, accessibility or arbitrary browser compatibility. The screenshot is a review aid, not a cross-browser visual oracle.

Copy `review.template.json` to `review.json` and fill it according to `review.schema.json`. Review time is measured with a human stopwatch; repair iterations count attempts after the initial submitted change. Tool calls count all agent tool invocations. Findings require evidence and a true-positive, false-positive or unresolved verdict. `transcript` points to the saved transcript. Then:

```sh
bun benchmarks/architecture-evaluation/run.ts record benchmarks/.results/architecture-evaluation/pilot/master-cli-responsive-layout-1 benchmarks/.results/architecture-evaluation/pilot/master-cli-responsive-layout-1/review.json
```

`record` reruns acceptance and writes an immutable `result.json` following `result.schema.json`, with protocol/model identity, timestamps, total elapsed seconds, review metrics, source/output/transcript hashes, browser, package/artifact evidence and acceptance. Build/browser failures are retained as rejected results; deleted or unreadable inputs have null hashes alongside the failure. Trial paths must remain inside the results directory, including after symlink resolution. A changed environment, exceeded budget, failed acceptance or missing visual approval prevents acceptance. Never label a blocked or timed-out trial completed.

Compare accepted-trial rate first, then elapsed/review time and repairs per task across all repetitions. Report failures and unfinished trials beside successful timing distributions. Diagnostic false discovery rate is `FP / (TP + FP)` for adjudicated agent/CLI/MCP findings; it is `null` when none exist. Unresolved findings stay unresolved. This is not the statistical false-positive rate `FP / (FP + TN)` and does not establish diagnostic recall. Do not pool away task/model differences or claim significance from three repetitions.

## Checked local observations, 2026-10-30

The deterministic controls passed for all 48 starter/solution cases. No real model trials have been run, and there are no AI productivity results. The controls verify capability equivalence for these tasks, not a preferred tool or syntax.

Bounded experiment environment: macOS arm64, Apple M5 Max, Bun 1.4.4 (Node compatibility version v26.3.0), Chromium 156.0.8078.4, Tailwind 4.3.3; workspace revision `2cb5b046d2ee63285b0b5e558f5d644764b0875e` plus working-tree changes. Loaded entry and source/artifact-tree hashes are in the ignored report. Values below are an observed run, not committed snapshots or thresholds.

| Finite fixture artifact | Raw bytes | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Manifest | 2,684 | 656 | 523 |
| Runtime program | 496 | 384 | 311 |
| Materialized CSS, 12 classes | 914 | 250 | 196 |

Materialized CSS and on-demand execution agreed in 48 browser comparisons across two widths and hover/rest states. The unlisted `space(13px)` produced 13px padding with the regular engine and 0px with the finite sheet. Precompilation therefore works for an enumerated vocabulary; it cannot replace open-ended execution without regeneration or a fallback. Raw program bytes are smaller while compressed CSS bytes are smaller in this tiny fixture. Neither observation is a total application payload or speed claim: the comparison excludes the JS engine, DOM observer, delivery code, default preset and HTTP costs.

| Native keyframe delivery | Keyframe definitions emitted | Raw bytes | Gzip | Brotli |
| --- | ---: | ---: | ---: | ---: |
| Existing preserve policy | 4 | 717 | 260 | 242 |
| Existing opt-in pruning, one live class | 2 | 581 | 221 | 197 |
| Pruning with a dynamic animation name | 5 | 728 | 272 | 235 |

The two same-name live definitions retain their container/layer identity. A reference-only definition is not a preservation root; it remains metadata and is absent from the first two outputs. A dynamic name conservatively retains all five candidate definitions, including that reference definition. The byte totals include actual compiler output and retention markers, with no manual minification or semantic rewrite. Savings here do not justify changing the default policy or discarding definition identity.

Correctness checks run before interpreting these outputs:

```sh
bun run --filter @master/css-compiler test tests/css-first-core-execution.test.ts tests/keyframe-owner-identity.test.ts tests/bug-hunt-static-retention.test.ts
bun run --filter @master/css test tests/engine/managed-keyframes.test.ts
```

The scoped compiler tests passed (15 tests), as did native/Wasm keyframe parity (12 tests). The benchmark package has no lint script. The kit also passes a standalone strict TypeScript check. Its generated reports are advisory evidence; production tests continue to own correctness.
