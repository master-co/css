# Guarded repair across the seven original failures

This expands the [single-case regression guard](repair-regression.md) to the entire
cohort from the [host-recheck run](repair-recheck.md). It reuses the same adoption
policy, prompt and evaluator. No compiler, official skill, public API or scoring
threshold changes are included.

## Fixed protocol

```sh
node --import tsx scripts/ai-authoring/trials/guarded-cohort-run.mjs --source /absolute/prior-recheck-run --attempts 2
```

Select all seven cases recorded by the prior recheck protocol, including its six
passes and one failure. Validate a complete, unique set with matching model/task
and protocol identities. Start each from its original `checkpoint-0.work`, not
its prior final repair. Require byte-identical editable sources and identical
scored failures before model invocation. The prior successful single-case guarded
repair is not reused as a new observation.

Use the originating Luna model, low reasoning, the original official skill and CLI,
two fresh attempts of at most 120 seconds each, sequentially. Run every case once;
no outcome-based resampling or extra repair budget. The child runner's cohort mode
includes previously repaired cases and omits historical replays, which are not
needed to measure new proposals. Its original single-case/replay modes remain
available. Output directories must be new; no existing campaign is overwritten.

Freeze the complete scripts tree, built tool artifacts, model arguments, browser
executable and client identity for the campaign. Reject mixed environments between
cases, scorer changes or initial source/failure drift. Record artifact differences
from the historical run. Abort on infrastructure inconsistency, retaining the
failed record, raw events and explicit missing coverage instead of treating it as
zero usage or silently selecting a replacement case.

Each proposal copies the last retained workspace, then the host rebuilds and runs
all browser/class checks. Reject new property/class/check failures, changed
coverage/expectations, unverified execution or no measured progress. Archive the
proposal and decision even when rejected. The next attempt receives the rejection
and starts from retained files. Accept strict partial progress or a complete pass;
exhaustion retains the last accepted source and reports any remaining failure.

After each case finishes, copy its retained workspace and independently rebuild
and recheck it again, using the answer belonging to the retained checkpoint.
Verify identical source hashes and compare the fresh result against that case's
initial checkpoint. A reported pass requires this second verification to pass.
A rejected regression does not count as a regression in the retained output;
a remaining original failure does not count as a successful repair.

## Measurements and interpretation

Report complete coverage, verified passes, unresolved failures, unverified runs,
model attempts, rejected proposals (regression versus no progress), and new failure
atoms in independently checked retained versions. Keep raw input/cached/output
usage and identify missing metrics separately. Compare per-case outcomes with the
prior six-of-seven result only descriptively: these are fresh model executions
with revised guidance and adoption behavior, not a randomized contemporaneous
A/B comparison. The small cohort clusters around hover and inherited line-height
failures; no general success-rate, billing-savings or unmeasured-state guarantee
follows.

An independent audit must replay adoption decisions, verify actual candidate
parent copies, confirm rejected sources did not become the next parent, inspect
final retained and verification copies, and reconcile usage/feedback reads against
model events. Retain original provenance, prompts, diffs, all proposal snapshots,
independent final checks, current frozen sources/tools and the aggregate summary
outside the repository.

## Validation

Focused tests cover inclusion of prior successes, complete/unique source selection,
mixed protocol/model rejection, error and missing-metric accounting, separation of
proposed and retained regressions, independently verified pass requirements, the
existing adoption rules and the browser regression scenario. Run scoped ESLint
and `check:ai-context` before freezing the implementation.
