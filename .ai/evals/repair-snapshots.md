# Paired repair of identical failed snapshots

This repository-only experiment compares the full browser report with a compact
property summary. It changes report presentation, not the compiler, browser
evidence collector, acceptance checks, color comparison or public CLI/MCP API.

## Summary format

```sh
node scripts/ai-authoring/summarize-diagnostics.mjs /absolute/acceptance.json /absolute/new-summary.json
```

The input is a checker acceptance report containing version 1 `diagnostics`.
Omit the output argument to print JSON; existing output files are never replaced.
This command does not build, visit pages or invoke a model.

`properties` groups scored differences by property, element index and value pair.
Each group retains every affected check ID and references available replay
evidence. Repeated rules, element descriptions and layer trees are interned into
`rules`, `elements` and `layers` tables; IDs are local to one report. Rules retain
authored declaration order, duplicates, shorthand components, origin, conditions,
importance and source positions. Synthetic CDP duplicates are omitted where the
same property has authored declarations. A declaration's location inherits its
rule's source URL unless it supplies a different URL.

Only ancestors with relevant declarations are retained. Element descriptions keep
directly observed variable values and active animation metadata. Unresolved class
locations, other failed checks, unavailable evidence and omitted-group counts
remain explicit. Empty evidence is not proof that no rule applies. Capture limits
from the full report still apply: bounded ancestors/variables/groups, no shadow
or pseudo-element tracing, and separate state replays. Neither representation
claims to determine cascade winners or causal inheritance. The summary is a
selective presentation with generic next-step guidance, not a lossless archive;
the full seed evidence is retained separately for audit.

## Protocol

```sh
node --import tsx scripts/ai-authoring/trials/repair-run.mjs --source /absolute/calibration-campaign --calibration --limit 4 --concurrency 2
node --import tsx scripts/ai-authoring/trials/repair-run.mjs --source /absolute/formal-campaign --concurrency 2
```

Select **every failed first attempt** from the completed diagnostic-feedback
campaign. Reject missing source cells, failed model executions and seeds that no
longer reproduce a measured task failure. Preserve original source/acceptance
hashes and select before viewing repair outcomes. Calibration alone may use an
incomplete earlier calibration campaign or limit the scheduled pairs; it stays
separate from formal observations.

Rebuild each failed candidate once in an isolated seed directory, capture browser
evidence once, then derive both reports from that identical capture. The capture's
temporary workspace/source URL prefixes become relative paths in both reports.
Only seed source files, copied official skill and generated CSS enter model
workspaces. Historical acceptance reports, screenshots, diagnostics and CLI call
logs are excluded. Record and verify every copied input hash before adding the
assigned `diagnostics.json`; all other initial files are byte-identical per seed.

Both models (`gpt-6.1-sol` and `gpt-6-luna`, low reasoning) receive each seed with
both reports. Both use the original task prompt plus the **same** repair prompt,
skill and CLI capabilities. The sole supplied-file difference is the report.
Alternate arm and model order across seeds; run at concurrency 2. A is full
evidence, B is the property summary. There is **one 120-second repair attempt**,
with no first authoring stage, previous conversation or follow-up repair. Eight
eligible snapshots therefore produce 32 calls, forming 16 seed/model pairs.

The common prompt asks the model to read the report but does not prescribe class
spellings or a successful fix. Audit actual reads in completed command output.
Guard source baselines, skill, build/package files, CLI adapter and assigned report.
Hash runner sources and tool artifacts before and after attempts; keep errors and
unmeasured usage in the denominator. Missing usage is reported separately rather
than silently imputed as measured zero. A complete comparison rejects differing
input, report or prompt hashes and missing/duplicate/crossed pairs.

Each run stores its protocol, seed reports and original provenance, per-trial
input hashes, prompt, command, raw events, stderr, final workspace, acceptance,
observations and comparison outside the repository. Archive native/built artifacts
and source hashes alongside results. Source campaign scores and costs are never
modified by this experiment. No new dependencies or telemetry are introduced.

## Interpretation

Compare single-repair pass counts and paired wins, input/cached-input/output tokens,
report bytes, actual reads, unresolved names and execution failures. Identical
starting files remove the previous workflow pilot's initial-error mismatch, but
the seeds still cluster within two tasks and one original failure-producing model.
This is a small failure-conditioned experiment, not a general authoring benchmark,
multi-repair result, billing estimate or universal latency claim. Do not compare
its pass rates directly with the earlier fresh-authoring pilot.

```sh
node --import tsx --test scripts/ai-authoring/diagnostic-summary.test.mjs
```

Tests cover value/check grouping, candidate references, ordered duplicates and
shorthand retention, unavailable evidence, equal paired inputs, report isolation,
exclusive output writes, balanced scheduling, complete comparison and error/usage
accounting. Existing browser/color/protocol tests remain applicable; the scorer
itself is unchanged.

## Recorded result — 2026-11-01

Frozen implementation: `53b606ae5ef15fc745c9c2ea0e2811cd1cb05709`.
Client: `codex-cli 0.166.0-alpha.5.1`; Chromium: `156.0.8078.4`.
The two models and settings above completed all 32 formal calls. Four calibration
calls were excluded; implementation/tool hashes matched between calibration and
formal runs. Model names are service identifiers, not immutable weight hashes.

| Measure | A: full report | B: compact summary |
| --- | ---: | ---: |
| Single-repair passes | 13/16 | 11/16 |
| Sol passes | 8/8 | 8/8 |
| Luna passes | 5/8 | 3/8 |
| Input tokens, including cached input | 3,727,434 | 4,128,725 |
| Cached input tokens | 3,257,344 | 3,651,968 |
| Output tokens | 28,831 | 30,697 |
| Median model duration | 31.37 s | 37.34 s |
| Report bytes across eight unique seeds | 705,530 | 211,491 |
| Trials visibly reading the assigned report | 16/16 | 16/16 |
| Final unmatched names, summed per trial | 11 | 2 |

Pairs produced four full-only passes, two compact-only passes, nine both-pass and
one both-fail. Compact reports were **70.0% smaller**, but recorded input tokens
were **10.8% higher**. Completed command counts were similar (138 versus 137);
these observations do not establish why usage differed. Reading a report includes
partial reads and does not prove the model received or used every evidence item.

All eight seeds came from Luna's failed first attempts across the two prior
Tailwind-import tasks. All formal failures were also Luna repairs. Full-report
failures retained unresolved names and color/hover differences. Compact failures
included height, radius, hover background and inherited line-height differences;
three had no unmatched names. Fewer unresolved names did not ensure correct CSS.

There were no model-turn failures, timeouts, guarded-file violations or unmeasured
usage totals. Audit verified original snapshot bytes, equal paired inputs and
prompts, assigned-report integrity, frozen source/tool hashes, raw usage totals,
and preservation of every scored difference/check ID in the summary. The scorer
was unchanged. Wrapper logs recorded 18 versus 16 suggestion calls, with zero
versus one nonzero result. The latter trial has only two visible suggestion
commands but three wrapper entries; that extra entry's provenance is unresolved,
so these wrapper counts are not treated as fully reconciled tool-event counts.
Raw logs are retained rather than silently correcting the discrepancy.

Keep the **full report as the default**. This small, failure-conditioned sample
does not support replacing it with the summary or claiming token savings. The
summary remains an opt-in repository command; no public CLI/MCP API changed.
A useful next experiment would make the summary a navigation aid with on-demand
access to full property evidence, while preserving identical starting failures.
That follow-up is not implemented by this experiment.

Validation: 23 focused summary, browser-diagnostic, color, evaluation and protocol
tests passed, along with scoped script ESLint and `check:ai-context`. External
evidence is archived under
`/Users/aron/master-css-evaluations/2026-11-01-repair-snapshots`, including separate
calibration, frozen sources/tools, formal inputs, reports, events, final workspaces,
observations, comparison and audits. Observation SHA-256:
`385bbac44cb27f573c9f74a7e98c425e32c90cdd039729eb60cc3796339007ba`.
