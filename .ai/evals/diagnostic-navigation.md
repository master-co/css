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
