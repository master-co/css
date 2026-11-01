# Property navigation with on-demand browser evidence

This repository-only follow-up to [paired summary repairs](repair-snapshots.md)
compares a full diagnostic report with a navigation index that can expand the
same captured evidence. Compiler, CSS output, browser collector, scorer, official
skill and public CLI/MCP APIs are unchanged.

## Interface

The navigation report lists every scored property difference, associated check
IDs, node indices, unresolved classes, other failures and capture limits. It
omits rule tables from the initial view and supplies an expansion command per
property. Expansion returns **entire original matching capture groups**, including
source and target rules, authored/synthetic declarations, ancestors, layer trees,
variables, animation observations, source locations and per-side limits. It never
filters declarations or claims a cascade winner. This is all evidence captured
for those groups, not unlimited browser provenance.

Standalone use with an existing acceptance report:

```sh
node scripts/ai-authoring/expand-diagnostics.mjs /absolute/acceptance.json --property color
node scripts/ai-authoring/expand-diagnostics.mjs /absolute/acceptance.json --property line-height --check light-390-rest --node 0
node scripts/ai-authoring/expand-diagnostics.mjs /absolute/acceptance.json --all
```

`navigateDiagnostics(acceptance)` creates the navigation index. In trial workspaces,
its commands use `.diagnostic-tools/expand-diagnostics.mjs` and the frozen
`.diagnostic-evidence.json`. Optional `--log FILE` appends request metadata,
source/output hashes, output bytes and success/error status; stdout contains the
requested evidence. Invalid properties and unmatched filters fail explicitly.
Scored samples without captured groups remain in `missing`; unavailable captures
and omitted-group counts remain visible. `--all` returns the original full
browser diagnostics. No request launches a browser or observes edited files.
An option-parser error can occur before the request logger; retain raw command
events when auditing attempted calls.

## Experiment

```sh
node --import tsx scripts/ai-authoring/trials/repair-run.mjs --source /absolute/prior-calibration --presentation navigation --calibration --limit 4 --concurrency 2
node --import tsx scripts/ai-authoring/trials/repair-run.mjs --source /absolute/prior-formal-campaign --presentation navigation --concurrency 2
```

Use every eligible failed first snapshot from the same prior diagnostic campaign:
eight Luna failures clustered in two Tailwind-import tasks. Capture once per
seed, then supply the same initial task files, skill, CLI, frozen evidence and
expansion helper to both arms. **Only `diagnostics.json` differs**: A is the full
report, B is the navigation index. Both receive the same repair prompt and may
use the helper; navigation commands are exposed in B's index. This measures an
entry-point workflow, not exclusive access to evidence or mandatory expansion.

Each of `gpt-6.1-sol` and `gpt-6-luna` repairs every seed in both arms: 32 calls,
16 pairs, low reasoning, one 120-second attempt, concurrency 2, balanced order,
no history or follow-up. Four calibration calls are excluded from formal results.
Freeze code/tools before formal calls; no intermediate outcome-based changes.
Guard helpers and evidence alongside existing baselines and reports. Existing
compact-summary mode remains available and retains its original prompts.

Compare passes, paired outcomes, input/cached/output usage, unmatched names,
model duration, initial report size, actual report reads and expansion requests.
Record expansion output bytes separately; bytes do not measure consumed tokens.
Reconcile requests against raw events and verify each successful output against
the frozen capture. Direct evidence-file reads are allowed but reported separately
when visible; request logs alone do not prove all evidence access. Keep execution
errors and missing usage in denominators. Verify equal input/prompt hashes and
source files, preserved scored differences and immutable evidence/helpers.

The sample is failure-conditioned, small and clustered; no general authoring,
causal-model, billing or universal latency claims follow. Model identifiers are
not immutable weight hashes. Even correct expansions can be ignored or truncated.
Do not promote a public API or change the default solely on this pilot.

## Recorded result — 2026-11-01

Frozen implementation: `68f8674c1` (full revision in the archived protocol).
Client: `codex-cli 0.166.0-alpha.5.1`; Chromium: `156.0.8078.4`.
All 32 formal calls completed. Four successful calibration calls were excluded;
code, tools, model arguments, browser and execution settings matched the formal
run. The eight original source snapshots **and full-report hashes** also matched
the previous paired-summary experiment. These are new model executions, not
reused model answers or a pooled comparison with the old campaign.

| Measure | A: full report | B: navigation + expansion |
| --- | ---: | ---: |
| Single-repair passes | 12/16 | 10/16 |
| Sol passes | 8/8 | 8/8 |
| Luna passes | 4/8 | 2/8 |
| Input tokens, including cached input | 4,053,057 | 3,898,358 |
| Cached input tokens | 3,586,560 | 3,393,920 |
| Input tokens excluding cached input | 466,497 | 504,438 |
| Output tokens | 32,448 | 31,684 |
| Median model duration | 43.38 s | 41.35 s |
| Initial report bytes across eight unique seeds | 705,530 | 52,235 |
| Trials visibly reading their initial report | 16/16 | 16/16 |
| Trials using expansion, reconciled with events | 0/16 | 12/16 |
| Final unmatched names, summed per trial | 10 | 7 |

Pairs produced four full-only passes, two navigation-only passes, eight both-pass
and two both-fail. The initial navigation report was **92.6% smaller**, while total
input tokens were **3.8% lower**. Input excluding cache hits was **8.1% higher**;
this is not evidence of billing savings. Sol's input increased about 16.0% while
Luna's decreased about 19.4%, so the aggregate hides different usage patterns.
Local concurrent timings and these small counts do not establish an efficiency
or general success-rate advantage.

### Actual evidence use

All eight navigation Sol trials and four navigation Luna trials expanded evidence.
There were 12 successful requests: seven for `line-height`, one for
`background-color` and four for `--all`. They emitted 604,006 bytes in total, in
addition to the initial reports. No full-report trial used the helper, although
it was available to both arms. No direct evidence-file content reads were found
in reviewed commands; the three filename matches were directory-list exclusions.
This is an event audit, not a filesystem security guarantee.

Raw request logs contain 11 calls and 524,812 bytes. One Luna command omitted
`--log`; its 79,194-byte `line-height` response was verified in the raw command
output and included in the reconciled totals above. `comparison.json` preserves
the original logger counts; `analysis.json` and `audit.json` include the additional
verified call. Every one of the 12 response bodies matched a fresh expansion of
its frozen evidence byte for byte. This proves the emitted output, not that all
of it survived client truncation or influenced the model's decision.

### Failures and limits

All ten failed repairs were Luna executions. B failed all four hover-task seeds:
one retained an unresolved hover class, while three had valid classes but wrong
hover backgrounds. Its two card failures included inherited line-height/height
and incomplete migration. A also retained unresolved classes, geometry and hover
errors. Evidence availability and successful expansion did not ensure a correct
repair; expansion was optional, so these data do not isolate the causal effect
of reading an individual property response.

There were no model-turn failures, timeouts, protected-file changes or missing
usage totals. Models did encounter nonzero command exits (27 in A, 31 in B),
including their own browser checks, CLI checks and git commands in non-git
workspaces. The independent evaluator still ran the unchanged browser checks for
every final workspace. Do not describe these runs as free of tool errors.

Suggestion wrapper logs record 12 versus 21 calls and zero versus one nonzero
result. As in the preceding experiment, the affected B trial has three wrapper
entries but only two visible suggestion invocations; the extra entry's provenance
is unresolved. Those counts remain raw and are not used to explain outcomes or
usage. This discrepancy does not change the independently recorded pass verdicts
or model usage totals.

Keep **full diagnostics as the default** and navigation as an opt-in repository
experiment. On-demand access worked, but this sample did not improve repairs.
Before promoting a public tool, investigate the recurring hover and inheritance
failures and improve the repair-and-recheck workflow; expanding access alone has
not established a benefit. No further model experiment or public API rollout is
included in this change.

Validation: 26 focused tests passed across the combined run and the affected-test
rerun, plus scoped ESLint, `check:ai-context` and diff checks. The initial failing
CLI test passed a negative option value ambiguously; using `--node=-1` verified
the intended validation/logging path. Runtime code was unchanged after calibration.
Audit verified equal pair inputs/prompts, original snapshots, report preservation,
all scored navigation differences, guarded helper/evidence files, source/tool
hashes, browser executable and raw model usage.

External archive:
`/Users/aron/master-css-evaluations/2026-11-01-diagnostic-navigation`.
It retains calibration, original provenance, frozen sources/tools, all 32 formal
workspaces/events, reports, requests, output verification, observations, analysis
and audit helpers. Observation SHA-256:
`e4a00b3b1237b2247209f82cb4a70d295db82359226e25a29c729f0539fadc64`.
