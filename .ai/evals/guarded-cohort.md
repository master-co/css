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

## Recorded result — 2026-11-01

Frozen implementation: `d3b072187`. Client `codex-cli 0.166.0-alpha.5.1`, Chromium
`156.0.8078.4`, `gpt-6-luna` with low reasoning. All 422 tracked tool artifacts
matched the historical recheck run. Every initial source and scored check matched
its archived checkpoint; the scorer, adoption policy and skill remained unchanged.

All seven cases completed, with six independently verified passes, one unresolved
failure and zero unverified results. Nine model attempts produced six accepted
passes and three rejected regressive proposals. There were no partial adoptions
or no-progress rejections. The 23 host assessments comprise seven initial checks,
nine proposal checks and seven independent final rebuild/checks. All retained
outputs had **zero new measured failure atoms** relative to their initial source.

| Case | Initial failed checks | Attempts | Rejected proposals | Final failed checks | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| seed-03-gpt-6-luna-b | 4 | 1 | 0 | 0 | Passed |
| seed-05-gpt-6-luna-a | 19 | 1 | 0 | 0 | Passed |
| seed-05-gpt-6-luna-b | 6 | 2 | 2 | 6 | Original failure retained |
| seed-06-gpt-6-luna-b | 4 | 2 | 1 | 0 | Passed after rejection |
| seed-07-gpt-6-luna-b | 4 | 1 | 0 | 0 | Passed |
| seed-08-gpt-6-luna-a | 4 | 1 | 0 | 0 | Passed |
| seed-08-gpt-6-luna-b | 4 | 1 | 0 | 0 | Passed |

The remaining `seed-05-gpt-6-luna-b` demonstrates two different rejection reasons
within the regression category. Its first proposal added unconditional
`bg-blue-700`, causing 14 new background-color failures in resting, focus,
disabled and touch states. The second started from the original retained source
and added the correct capability-gated rule in utilities. All browser comparisons
then passed, but the original unresolved `hover:bg-blue-700` remained and the
answer omitted the required retained/reset-CSS report. That omission introduced
one new **reporting-check** failure, not a visual regression; the conservative
policy rejected it despite the reduction from six failed checks to two. Neither
candidate replaced the retained source. Its six original failures therefore
remain explicit. The unchanged reporting scorer uses a keyword check, which
limits interpretation of this rejection as a quality measure.

For `seed-06-gpt-6-luna-b`, the first proposal replaced the native hover rule with
invalid markup, introducing three unresolved class names and losing the hover
capability check: four new failure atoms. After rejection, the second proposal
started from the original source, moved the native state rules into utilities,
and passed all checks. This run therefore exercises both rejection followed by
successful repair and budget exhaustion with the original source preserved.
All three rejected candidates remain archived separately from the retained files.

The pass count and per-case outcomes equal the prior six-of-seven campaign;
model calls were nine here versus eleven there. These descriptive counts do not
establish a success-rate or cost improvement. The earlier targeted guarded run
repaired the remaining case in two calls, but this fresh cohort run did not;
that single success was not reliably reproduced. The guard prevented adoption of
new measured failures, while proposal quality remains a separate limitation.

Audit independently recomputed every decision, checked actual parent-file hashes
and next-turn rejection payloads, and confirmed all final verification copies
matched retained sources and generated CSS. It reconciled raw events and usage,
inspected completed commands, and found no provenance or integrity issues.
Two attempts visibly read current feedback: the second attempts for seeds 05-b
and 06-b; the other seven did not visibly open the feedback files. Prompts still
contained source-bound summaries, so file-read counts do not measure all evidence
consumption. There were no model-turn failures, timeouts, protected-file violations,
coverage mismatches or unmeasured usage. Input totaled 893,581 tokens, including
763,904 cached input tokens; output totaled 6,652 tokens.

Eight focused tests passed, including browser coverage for hover, inherited
line-height and touch regressions. Scoped script ESLint, `check:ai-context` and
diff checks passed. Only evaluation scripts and internal reports changed; no
published package behavior, CLI/MCP API, official skill or scoring rule changed.
The next investigation should address incomplete repairs that fix rendering but
leave class recognition or required reporting unresolved, under a separately
frozen protocol rather than extending this campaign's repair budget.

Archive: `/Users/aron/master-css-evaluations/2026-11-01-guarded-cohort`.
It retains original provenance, frozen sources/tools, prompts/events, all proposed
and retained workspaces, independent final checks, diffs, decisions, usage and
audit helpers. Observations SHA-256:
`9f7dac4b4608ff3cdf311cb3c62a3092ddb34cadabd10b95c781ca70e87b1e11`.

The subsequent [completion workflow](repair-completion.md) keeps unresolved
classes and fresh reporting obligations explicit. A new targeted run repaired
the remaining case in one attempt with no measured regressions; that separate
observation does not replace this cohort's six-of-seven result.
