# Replicate completion guidance across the original seven failures

This runs the [completion workflow](repair-completion.md) over the full cohort
from the [guarded repair evaluation](guarded-cohort.md). The targeted success is
not reused as an observation. All seven cases start from the original historical
recheck's failed `checkpoint-0.work`, including the six previously repaired cases.

## Fixed protocol

```sh
node --import tsx scripts/ai-authoring/trials/guarded-cohort-run.mjs --source /absolute/prior-recheck-run --attempts 2
```

One complete cohort, seven cases, Luna low reasoning, at most two 120-second
attempts per case, sequential execution. Stop early within a case only on verified
success or unverified execution; preserve exhausted failures. Do not resample,
add calls after seeing outcomes, or modify prompts/tools while the run is active.
Each child verifies identical original sources and scored checks before invoking
the model. Rejected candidates never become the next retained parent.

Use existing completion feedback and guarded prompts without changes. Freeze
revision, source/tool hashes, client/browser and model arguments. Verify the
scripts and tool hashes match the preceding targeted completion run. The scorer,
failure-atom adoption policy and official skill are unchanged.

Independently copy, rebuild and check each final retained implementation with its
retained answer. Report full-cohort passes, unresolved/unverified cases, attempts,
rejected regression/no-progress proposals, and new failure atoms in retained
outputs. Audit all proposal decisions, source/parent hashes, source-bound
completion sections, rejection feedback, command events and usage. Review actual
answers against the diffs; the keyword-based reporting scorer alone cannot prove
a factual, complete explanation.

Compare per-case outcomes with the prior guarded cohort and keep the earlier
targeted observation separate. This is a fresh execution under fixed conditions,
not a randomized A/B estimate. A full-cohort pass would support replication across
these seven snapshots, but one run per case cannot establish repeated-run
reliability, performance on new tasks or safety outside the measured states.

No implementation changes are needed for this evaluation. The ten existing
focused tests passed when this workflow was introduced; preserve those logs and
verify identical tested source hashes instead of rerunning unchanged tests.
Run `check:ai-context` and diff checks for the new internal report. No workspace
package code is changed, so package lint/build is not required.

## Recorded result — 2026-11-01

Frozen revision: `af06d63fe`. The complete scripts tree matches the tested
completion implementation from `68a0b9df8`; only the intervening report commit
differs. Client `codex-cli 0.166.0-alpha.5.1`, Chromium `156.0.8078.4`, model arguments,
browser executable and all 422 tracked tool artifacts match the targeted run.
The artifacts also match the original recheck. No scorer or threshold changed.

**All seven cases passed**, including independent retained-source rebuilds.
There were zero unresolved or unverified cases, zero missing observations and
zero new measured failures in retained outputs. Six cases passed on their first
attempt; one passed after a regressive proposal was rejected. Eight model calls
and 22 host assessments were used: seven initial checks, eight proposal checks
and seven independent final checks. No extra calls or outcome-based reruns were
made. Every final class-recognition and required-reporting check passed.

| Case | Initial failed checks | Attempts | Rejected proposals | Final failed checks |
| --- | ---: | ---: | ---: | ---: |
| seed-03-gpt-6-luna-b | 4 | 1 | 0 | 0 |
| seed-05-gpt-6-luna-a | 19 | 1 | 0 | 0 |
| seed-05-gpt-6-luna-b | 6 | 1 | 0 | 0 |
| seed-06-gpt-6-luna-b | 4 | 1 | 0 | 0 |
| seed-07-gpt-6-luna-b | 4 | 2 | 1 | 0 |
| seed-08-gpt-6-luna-a | 4 | 1 | 0 | 0 |
| seed-08-gpt-6-luna-b | 4 | 1 | 0 | 0 |

The formerly unresolved seed 05-b removed the obsolete `hover:bg-blue-700`, added
a capability-gated native hover rule outside named layers, and explained the
retained reset, tokens and focus/disabled CSS. It also introduced an equivalent
height utility. This differs from the earlier targeted run's custom hover utility;
both fresh runs passed, but no minimal-edit or future-override guarantee follows.

Seed 07-b's first proposal registered `bg-blue-700` and used `bg-blue-700:hover`
while removing the native `(hover: hover)` wrapper. Desktop hover comparisons
passed, but touch-tap background color regressed: one new failure atom. Its answer
incorrectly claimed the capability condition remained effective. The host rejected
that proposal despite resolving all four original hover failures. The second
attempt started from the original retained source, moved only the gated hover
rule into utilities (plus class ordering), and passed. The rejected candidate
never became a retained parent or final output. This run therefore exercises
the actual rejection/retry path with the new completion guidance.

Compared with the preceding guarded cohort, final passes rose from six to seven,
model calls changed from nine to eight, and rejected proposals changed from three
to one. These are descriptive historical observations, not an A/B effect estimate.
The six previously passing cases still passed, and the targeted repair's success
reproduced for the remaining case. This supports the workflow on these snapshots;
one fresh full-cohort run does not establish a general or repeated-run success rate.

## Audit and remaining limits

Audit recomputed every adoption decision and the aggregate, checked all original
and proposal-parent hashes, rejection payloads, frozen tools, source/CSS hashes,
final verification copies and completion summaries in files/prompts. No integrity
or completion-consistency issues were found. All eight model turns visibly read
current feedback. Every turn finished without a model failure, timeout or guard
violation, and usage was fully measured. Input totaled 1,937,532 tokens, including
1,772,160 cached input tokens; output totaled 14,654 tokens. Input and output were
higher than in the prior guarded cohort despite fewer calls; this is not evidence
of token or billing savings.

Manual review covered every answer, diff and command record. All seven retained
answers explained their CSS dependencies and kept host browser verification
pending at answer time. However, four final answers (03-b, 05-b, 06-b and 07-b)
misread lint's zero-file summary as meaning no files were checked. The frozen
CLI's `packages/cli/dist/lint.js`, `lintInputs`, calls the linter before filtering
out clean file results; `summary.files` counts diagnostic-bearing results, not
scanned inputs. A zero value alone establishes neither skipped work nor complete
coverage. An early progress update made the same misinterpretation and was
corrected after inspecting that exact frozen artifact. The raw model answers
remain archived unchanged.

This reporting ambiguity did not change the independent browser/class verdicts,
but it limits claims of explanation quality and can trigger needless repeated
commands. The next improvement should distinguish checked input coverage from
files with diagnostics in machine-readable lint results, then validate AI's
interpretation. The keyword-based reporting scorer also cannot detect the false
capability claim in the rejected proposal. Keep the host checks and regression
gate; the model's explanation alone is insufficient verification.

`check:ai-context` and diff checks passed for this report. The previous ten-test
validation and scoped script lint apply to the identical frozen implementation;
they were not rerun. The campaign itself supplies seven fresh end-to-end repair
observations. No package code, public API, official skill or evaluator changed.

Archive: `/Users/aron/master-css-evaluations/2026-11-01-completion-cohort`.
It retains frozen source/tools, original provenance, historical comparison
reports, all proposals and retained copies, independent verification, prompts,
events, diffs, decisions, usage, automated and manual audits, and prior test logs.
Observations SHA-256:
`f644b6c107e1f79bb595f5b0cc450a0b7792055a5b1f50860ab8d327314211ab`.

The [lint coverage follow-up](lint-coverage.md) adds explicit checked-input and
diagnostic-file counts plus execution status to CLI/MCP lint reports. Its final
eight-scenario comprehension campaign passed 16/16 after an initial 10/16 exposed
manifest-entry ambiguity. These report-reading observations do not replace the
repair outcomes recorded here.
