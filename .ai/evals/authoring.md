# AI authoring evaluation

Run `node scripts/ai-authoring/evaluate.mjs --list` for the 12 task prompts and
acceptance criteria. This corpus measures observed agent behavior; unit tests and
browser fixtures verify tooling but do not establish model success rates.

## Component smoke test

After building the native binding, workspace packages and MCP executable, run
`node --import tsx scripts/ai-authoring/component-smoke.mjs` from the checkout.
It uses the installed Playwright Chromium and Tailwind toolchain; no dependency
or browser downloads are performed by the script.

The smoke test makes the site's existing `checkedSelector` card denser and imports
the benchmark dashboard's Export button. The button receives explicit pilot
hover/focus/disabled/motion variants before its Tailwind baseline is compiled.
It calls the real MCP server with isolated project roots, retains source CSS
dependencies, and compares 128 combinations of viewport, theme, pointer capability,
motion preference and control state. Resting Tailwind screenshots must also match.

The script prints an external artifact directory containing source/target HTML,
compiled CSS, screenshots, MCP responses and `report.json`. A failure returns a
nonzero exit code and preserves evidence. These deterministic cases are a workflow
smoke test, not independent model trials; do not feed them to `evaluate.mjs` as
model-success observations. Chromium and keyboard behavior checks are not a full
cross-browser or accessibility audit.

## Controlled runs

The executable harness uses the authenticated local Codex CLI and installed
Chromium, with no API key copied into trial directories:

```sh
node --import tsx scripts/ai-authoring/trials/control.mjs
node --import tsx scripts/ai-authoring/trials/run.mjs --limit 10 --concurrency 2
node --import tsx scripts/ai-authoring/trials/run.mjs --concurrency 4
```

The first command checks 41 controls: 12 starters, 12 known solutions and seventeen
rubric regressions. Valid inner-panel spacing, additional tab stops, shadow focus
indicators, flex columns, renamed progress nodes, native classes in HTML styles
and component-scoped restoration of source line-height must pass. Missing keyboard
access, invisible focus, incorrect relative units, invalid single-quoted classes, unconditional hover behavior on touch devices and
classes defined only in inactive styles must fail. Import controls additionally
reject lost inherited line-height, a spacing step treated as pixels, an ineffective
lower-layer repair and an added color transition. They assert the specific
computed-property difference so unrelated failures cannot satisfy the control.
Content inset and columns are measured geometrically; outer-box padding and a
specific layout implementation are not required. Keyboard checks traverse tab
stops, and class inspection reads the parsed DOM rather than attribute quotes.
Solutions and checker sources are not supplied to the
model. The second command is a separate calibration run; never merge it into the
formal corpus. The last command runs 12 tasks × five arms × two models × two
repetitions, with 120 seconds per attempt and up to two repair requests. Repair
requests start a fresh session with the existing files and failed-check feedback.
The models are `gpt-6.1-sol` and `gpt-6-luna`, both at low reasoning effort.

The printed external directory contains `protocol.json`, each attempt's prompt,
command arguments, CLI events, errors, checks, workspace snapshot and final result, plus
`observations.jsonl` and `summary.json`. Protocol hashes cover the harness, skill,
native artifact, CLI/MCP entries and lockfile. Resume completed batches with
`--resume /absolute/run/path`; changed revisions or hashes are rejected. Interrupted
partial trial directories require manual inspection before resumption; the runner
does not silently overwrite them. Authentication/quota/MCP availability errors or
personal skill access stop scheduling new trials and create `blocked.json`.

To verify a corrected checker against every final output of an affected task:

```sh
node --import tsx scripts/ai-authoring/trials/recheck.mjs /absolute/run/path dynamic-value
```

Rechecks require complete task coverage, matching recorded tool artifacts and
lockfile. They operate on separate copies, record the checker hash and retain the
original scores, execution failures and protected-file violations. Report them
as post-run verification, not as new model attempts. With saved attempt snapshots,
`recheck.mjs RUN_DIRECTORY all --all-attempts` uniformly verifies every recorded
attempt, including first attempts. It retains the original feedback and all
incurred token/time costs; never present those repairs as a corrected campaign.

Automatic skill instructions/catalog injection must be disabled explicitly:
`skip_host_skill_discovery` alone did not suppress personal skills in calibration.
The runner supplies the official skill path only to skill arms, and disables
`mastercss_suggest_classes` in the other MCP arms. This measures explicit skill
use, not automatic discovery or installation. Dependency reads remain available;
filesystem isolation is not a security boundary against reading local sources.
Every arm receives the same existing baseline instructions; skill and MCP arms
add capabilities to that baseline. The import task explicitly requires at least
one newly spelled Master utility; a native-CSS-only rewrite is outside that task's
conversion requirement even when it renders correctly.

Checks cover the recorded browser states, computed properties, source contracts
and selected accessibility behaviors. A category without a task-specific check
means no applicable check failed, not an accessibility audit. These fixtures do
not measure subjective design quality, all CSS properties, other browsers or
real onboarding. The service exposes model identifiers, not immutable weight
revision IDs; report that limitation alongside results. Input token totals include
cached inputs reported by the CLI and are not a billing estimate.
Unmatched-class counts sum names that are neither matched utilities nor declared
native classes in each trial. They are not a complete CSS value-validity audit;
the same unmatched name can occur in multiple trials.

- Freeze a corpus commit containing all task fixtures, package versions, two model versions, client,
  tools, time budget and a maximum of two repair requests. Keep all attempts,
  including errors/timeouts. Start each run in a fresh copy of the fixture.
- Use two repetitions per task/model for each arm: existing instructions only,
  official skill only, existing MCP only, and skill plus existing MCP. The bridge
  arm adds `mastercss_suggest_classes` to the last arm. Disable the new tool in
  baseline MCP arms so the ablation measures the intended change.
- Give all arms the same source, task and design requirements. Do not provide
  expected class spellings or a successful solution. Inspect functionality,
  styling and accessibility with the task's rubric before scoring.
- Keep source/target reset, fonts and viewport fixed for visual comparisons.
  Check focus, disabled, themes, hover capability and reduced motion as relevant.
  Missing browser access records `not-checked`, not a pass.
- Skill installation smoke tests use an isolated project and the local repository:
  `npx skills add /absolute/path/to/checkout --skill master-css -a codex`, then
  repeat for `claude-code` and `cursor`. Test discovery and an actual UI task in
  each available client. Installation alone is not a behavioral evaluation.
- Also check unrelated requests do not trigger a styling migration; mismatched
  language versions, absent MCP and broken manifests must follow the documented
  fallback/error workflow.

## Observations

Keep run artifacts outside the repository. Record one JSON object per line with:

```json
{"task":"settings-card","arm":"skill-mcp","model":"exact-version","client":"client-version","fixtureRevision":"commit","toolVersion":"package-version","repeat":0,"repairRounds":0,"invalidClasses":0,"toolCalls":0,"inputTokens":0,"outputTokens":0,"durationMs":0,"functional":false,"styling":false,"accessibility":false,"browser":"not-checked"}
```

The values above illustrate the record shape, not a measured result. Replace every
metric with observed values; use explicit `null` for unavailable input/output
token counts or invalid-class counts. Missing values are rejected. Summary totals
cover measured values only; `unmeasured` reports the missing observations. Errors
and timeouts stay in the attempt denominator.
Use `node scripts/ai-authoring/evaluate.mjs --summarize /path/to/results.jsonl`.
The report separates versions/clients and reports missing task coverage. Compare
only groups with the same tasks, repetitions and environment. Publish transcripts
and failure categories alongside aggregate rates, not selected successful runs.

Targets from the product plan are hypotheses: 90% success within two repairs,
50% fewer invalid classes, and 80% onboarding within ten minutes. Recruit 10–20
voluntary testers after the controlled runs; record setup, first useful UI,
second-change success and subsequent reuse. No automatic telemetry or outreach
is part of the tools. Do not publish improvement claims before observations exist.

## Recorded experiment: 2026-11-01

Frozen source: `ec053fadb`. Codex CLI `0.166.0-alpha.5.1`, `gpt-6.1-sol` and
`gpt-6-luna`, low reasoning, four concurrent trials, 120 seconds per attempt and
at most two repairs. All 240 task/arm/model/repetition cells completed, with no
timeouts, service/isolation failures or missing token/class counts. Calibration
runs were excluded; personal-skill injection and overly restrictive padding/tab
checks were corrected before the frozen campaign. Its 32 controls passed.

Two checker corrections were applied after the model campaign to all 20 final
outputs of each affected task, retaining every original observation:

- A progress bar with a renamed fill ID passed functional browser rechecking;
  the frozen selector had rejected it.
- A button passed desktop checks but changed color incorrectly after a touch tap;
  the original media-query text check had missed an unconditional hover rule.

Those corrections brought the checker to 34 passing controls. Later runs also retain per-attempt
workspace snapshots. The frozen campaign retained attempt transcripts/checks and
final workspaces/screenshots, so its first-pass verdicts and repair costs cannot
be retroactively corrected. The import prompt now states the existing utility
adoption requirement explicitly; this wording was not in the frozen prompts.
One native-CSS-only button renders correctly but remains incomplete under that
requirement. Treat this as a task-scope limitation, not a broken interface.

Each combined row contains 48 trials. “Frozen final” uses the original checker;
“Rechecked final” incorporates the two uniform post-run checks. Both totals are
218/240; the two corrections change the arm counts.

| Added capability | Frozen first pass | Frozen final | Rechecked final | Input tokens, including repairs | Final unmatched names |
| --- | ---: | ---: | ---: | ---: | ---: |
| Existing instructions | 37/48 | 43/48 | 42/48 (87.5%) | 9,511,701 | 34 |
| Skill | 38/48 | 44/48 | 44/48 (91.7%) | 9,141,807 | 2 |
| MCP | 38/48 | 43/48 | 43/48 (89.6%) | 16,901,837 | 9 |
| Skill + MCP | 40/48 | 43/48 | 43/48 (89.6%) | 18,679,201 | 0 |
| Skill + MCP + bridge | 41/48 | 45/48 | 46/48 (95.8%) | 15,575,428 | 0 |

`gpt-6.1-sol` passed 24/24 in every arm. Rechecked `gpt-6-luna` totals were
18, 20, 19, 19 and 22 out of 24, respectively. The bridge arm had four paired wins,
zero losses and 44 ties against the baseline; against skill + MCP it had three
wins, zero losses and 45 ties. These are small, fixed-task observations from one
client and one model provider, not a general performance guarantee.

The bridge was called 55 times, exclusively in its assigned arm. There were
1,061 completed MCP calls and 15 failed calls, whose transcripts are retained.
Total observed usage was 69,809,974 input tokens, including 61,761,024 cached input
tokens, and 561,621 output tokens. Per-arm median elapsed times were 34.80, 33.23,
33.88, 33.34 and 32.79 seconds, including independent grading. These are local
concurrent-run observations, not billing or latency guarantees.

Seventeen of the 22 rechecked failures were Tailwind imports. Common causes were
reset/line-height inheritance, incorrect state styles, invented class spellings
and utilities overriding attempted fixes in lower layers. Matching classes alone
did not establish source-equivalent browser behavior. Tailwind success was 4/8,
5/8, 4/8, 4/8 and 6/8 across the five arms.

Use the official skill as the light default and invoke MCP/bridge for tasks that
benefit from project inspection or declaration conversion. In this run the skill
had fewer unmatched names with slightly fewer input tokens than the baseline.
The bridge improved observed completion over skill + MCP while using 16.6% fewer
input tokens, but still used 63.8% more than the baseline. A useful next experiment
is a CLI command reusing the existing Rust suggestion API, allowing the skill to
request verified suggestions without loading the full MCP tool surface. Validate
that hypothesis with a focused comparison, and strengthen reset, line-height and
layer-editing examples before expanding automatic Tailwind conversion.

Artifacts include raw observations, frozen harness sources, model event logs,
final HTML/CSS/screenshots, post-run check reports and `analysis.json`. The raw
`observations.jsonl` SHA-256 is
`e0702e39e86d71a4eeefac4374a9fe31b5b74876a9f3741ccede649e9b10f3ce`.
Onboarding time, voluntary tester retention, autonomous skill discovery and
cross-client behavior remain unmeasured.

## Focused CLI/MCP pilot

The `bridge-pilot` profile compares `skill-cli` with `skill-mcp-bridge`. It runs
settings-card, css-declarations, fallback-order and tailwind-hover with the same
two models, two repetitions, skill, baseline instructions and browser checks:

```sh
node --import tsx scripts/ai-authoring/trials/run.mjs --profile bridge-pilot --limit 4 --concurrency 2
node --import tsx scripts/ai-authoring/trials/run.mjs --profile bridge-pilot --concurrency 2
node scripts/ai-authoring/trials/compare.mjs /absolute/run/path
```

Keep the four-case calibration separate from the 32-case campaign. Arm and model
order reverse on the second repetition. Suggestions are optional in both arms;
this measures the available workflow, not forced tool use. Both can build and use
CLI diagnostics through a protected `master-css.mjs` adapter. Only the CLI arm can
invoke its `suggest` command; the MCP arm has the full server including the bridge.
The adapter audits actual CLI suggestion calls and exit statuses; MCP calls are
counted from client events. This is a full-MCP-surface comparison, not an isolated
measurement of transport overhead. Filesystem access is not a security boundary;
review transcripts for bypasses or audit-log edits before interpreting results.

Protocol v2 hashes the task prompts, runner helpers, skill and built package trees,
including the actual CLI implementation rather than only its entry shim. Resume
with the same profile, models, concurrency and timeout; changed artifacts or
partial trial directories are rejected. This runner does not resume v1 campaigns.
Each result separates model elapsed time from total time including grading and
records cached input tokens, MCP errors and actual suggestion use. The comparison
requires every paired cell, rejects mixed environments and cross-arm tool use,
retains failures and reports per-model/per-task results. Cached input totals are
not a billing estimate, and concurrent local timings are not latency guarantees.

### Recorded pilot: 2026-11-01

Frozen source: `c8e10cdb1`; Codex CLI `0.166.0-alpha.5.1`; the two recorded models,
low reasoning, two concurrent trials, 120 seconds per attempt and up to two
repairs. All 32 cells completed in 40 model attempts, without timeouts, service
errors, personal-skill contamination or changed tool artifacts. Four calibration
cases were excluded. Calibration caught a call-counter issue: help requests are
excluded from actual CLI suggestion calls in the frozen campaign.

The frozen checker misclassified native classes defined in HTML `<style>` blocks
because it only read project stylesheet definitions. Three first attempts were
false negatives: one CLI and two MCP fallback-order cases, all from
`gpt-6.1-sol`. After the campaign, the checker uses the public Rust-backed compiler
to recognize native classes in browser-recognized inline styles. Two new controls
accept that case and reject a class defined only in an inactive `text/plain`
style; all 36 controls pass.

Every saved attempt was rechecked in a separate copy: 40/40, with exactly those
three verdict changes and no changed final verdicts. The original feedback,
repair counts, tokens and elapsed times remain intact. First-attempt token totals
below include every first attempt in each arm, regardless of success, and exclude
all repairs; they avoid attributing checker-induced repair costs to the interface.

| Measure | Skill + CLI | Skill + MCP + bridge |
| --- | ---: | ---: |
| Trials | 16 | 16 |
| Frozen first pass | 13/16 | 12/16 |
| Rechecked first pass | 14/16 | 14/16 |
| Final pass, unchanged by recheck | 16/16 | 15/16 |
| First-attempt input tokens | 2,836,528 | 4,623,281 |
| First-attempt cached input tokens | 2,488,448 | 4,060,672 |
| Input tokens including actual repairs | 3,171,022 | 6,181,775 |
| Cached input tokens including repairs | 2,769,920 | 5,454,720 |
| Output tokens including repairs | 35,847 | 44,834 |
| Actual repair requests | 3 | 5 |
| Median model elapsed time | 41.46 s | 45.69 s |
| Median total elapsed time, including grading | 42.18 s | 46.94 s |
| Suggestion calls | 24 | 26 |
| Trials using suggestions | 14/16 | 15/16 |
| All MCP calls | 0 | 110 |
| Final unmatched names | 0 | 0 |

`gpt-6.1-sol` finished 8/8 in both arms; `gpt-6-luna` finished 8/8 with CLI and
7/8 with MCP. The final paired comparison has one CLI win and 15 ties, too little
success-rate evidence for a general superiority claim. Both models used fewer
first-attempt input tokens in the CLI arm. Combined, that difference is 38.6%;
including all repairs it is 48.7%, with the checker confound described above.
These counts include cache hits and are not billing estimates.

The remaining failure was a Tailwind button in the MCP/Luna arm: its added
150 ms color transition changed hover/focus/disabled-state colors relative to the
instantaneous source. Other initial import failures involved line-height, height
units and hover colors. There were no CLI suggestion errors or MCP call errors.
The fixed-task sample supports skill + CLI as the light default, with MCP available
for workspace queries and broader inspection. It does not isolate transport cost,
prove model-independent savings, or measure autonomous skill discovery. Strengthen
source reset, inherited line-height and state/transition preservation examples
before expanding conversion scope.

External artifacts retain frozen sources, raw events, prompts, command arguments,
all attempt snapshots, screenshots, controls, the original comparison and uniform
recheck report. `analysis.json` records both original usage and verified outcomes;
the observation SHA-256 is
`8230ea49f5e6b114a15d32019be768ebea11d9b605873f9216c4df0c9319b567`.


### Import guidance follow-up

The [import reference](../../skills/master-css/references/importing.md) now calls
out inherited reset dependencies, unitless line-height, spacing expressions,
utility-layer precedence and transition timing. Its examples are conditional on
source evidence; they do not prescribe one line-height or reset for every import.
Guidance stays in the import reference so unrelated authoring tasks need not load it.

All 41 control outcomes match expectations. Five additional browser controls
exercise the observed failure modes. A scoped
line-height restoration passes while the destination host keeps its own line-height.
The negative cases expose 19.2px versus 24px line-height, 10px versus 40px height,
a higher-specificity repair losing in the earlier components layer, and an
unrequested color transition. The transition control deliberately uses 10 seconds
to keep its intermediate color observable on slow runners; the recorded model
failure used 150ms. These are deterministic validation cases, not new model trials
or evidence that the revised skill improves success rates. Historical campaign
observations, scores and token totals remain unchanged.
