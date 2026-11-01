# Host-verified repair checkpoints

This follow-up investigates the [navigation experiment](diagnostic-navigation.md)
and adds a host-owned repair/recheck loop. It changes repository evaluation
orchestration, not compiler semantics, official skills, public CLI/MCP APIs,
scoring criteria or the previous experiments' observations.

## Verified causes

Two isolated counterfactuals use archived failed final workspaces from
`master-repair-pairs-bShNvR`. Each variant is rebuilt and checked by the unchanged
full browser evaluator; the original artifacts remain untouched.

| Case | Intervention | Result |
| --- | --- | --- |
| `seed-03-gpt-6-luna-b` | Original inherited line-height failure | Fails four viewport/theme checks |
| Same card | Repeat `html { line-height: 1.5 }` in defaults | Still fails |
| Same card | Set `body { line-height: inherit }` in defaults | All task checks pass |
| `seed-06-gpt-6-luna-b` | Original component hover and resting background utility | Fails four hover checks |
| Same button | Increase component hover specificity to `#target.export-button:hover` | Still fails |
| Same button | Remove the redundant `bg-export-blue` class; component already supplies resting background | All task checks pass |

The card's generated base CSS specifies `body { line-height: 1.2 }`. Setting a
value on `html` leaves that nearer declaration intact, so descendants remain at
19.2px rather than 24px and their geometry differs. The heading's explicit text
utility already supplies its own line-height. This is inherited-value provenance,
not a missing token or unresolved-class error.

The hover candidate exists, with the intended media condition, but the later
utilities layer supplies the resting background. More specificity inside
components does not change that layer order. Removing a redundant utility is a
valid local repair for this particular fixture, not a general prescription to
remove background utilities. Other failures retain unresolved `hover:bg-blue-700`
or an unguarded hover selector; moving a rule without checking touch can introduce
a regression. Matched-rule reports alone do not establish cascade winners; these
local interventions supply the additional evidence for the stated causes.

The workflow also lacked usable post-edit browser feedback. Luna's failing answers
explicitly said browser states were unverified. Some Sol browser attempts failed
at Chromium's macOS Mach port registration with `Permission denied (1100)` under
the existing model sandbox. The host evaluator successfully ran the browser after
the model returned. We keep the model sandbox and run verification through that
existing host capability, without exposing arbitrary host commands to the model.

## Checkpoint contract

`repair-checkpoint.mjs` rebuilds current sources and runs **all** original task
checks after every repair, including desktop rest/hover/keyboard focus/disabled,
light/dark, both widths, touch rest/tap and applicable functional checks. No
property-only or lint-only shortcut can mark a repair successful.

Each checkpoint records the three editable source hashes, a combined source hash,
generated CSS hash, current failed checks, resolved check IDs and newly failing
check IDs. It refreshes `repair-feedback.json`, full `diagnostics.json` and
`.diagnostic-evidence.json` from the same new assessment. Failure-specific guidance
asks the model to inspect hover layer conflicts or nearer inherited declarations;
it supplies no fixture-specific replacement code. The captured rule evidence
retains existing replay limits and is never described as a proven cascade winner.

Statuses are `passed`, `failed` and `unverified`. A source edit invalidates earlier
verification. Missing/racing sources, checker/color failures, model-turn failures
or protected-file changes cannot produce `passed`. The loop stops on verified
success or unverified execution; otherwise it retries within a fixed budget and
rechecks the last edit even when that budget has been exhausted. It preserves all
checkpoints and never silently rolls back to a previously passing state.

## Targeted validation run

```sh
node --import tsx scripts/ai-authoring/trials/recheck-run.mjs --source /absolute/completed-navigation-run --attempts 2
```

Select every cleanly completed prior final trial with a failed `line-height`
difference or hover `background-color` difference: seven eligible final snapshots
from the navigation campaign, all produced by Luna. Include failures from both
prior arms. These are **final failures**, not the earlier first-attempt seeds.
Copy original source/build/baseline/skill files into isolated workspaces, dropping
stale reports/logs/generated CSS. Reproduce each failure with a host checkpoint
before invoking a model. Preserve original assessment hashes and initial inputs.

Use the same originating model (`gpt-6-luna`, low reasoning), skill and CLI interface.
Freeze the current built tools and record their hash differences from the prior
campaign; reject scorer changes. Do not require an old native build or replace
the shared checkout artifacts. Reproduction with the current tools is mandatory. Run
sequentially, with at most two fresh 120-second model attempts per snapshot.
Each prompt includes the latest host feedback and asks the model to finish its
edit so the host can check it; do not ask it to launch a browser. Refresh full
evidence after each attempt and verify protected files and source/tool hashes.
Retain every failure, unavailable run, usage record, model answer and final check.
No successful old trial is resampled, and no old result is regraded or overwritten.

This is a targeted repair demonstration with extra repair opportunities and new
feedback, not a controlled estimate of the effect of feedback versus extra time.
A final pass verifies only the specified fixtures/states. It does not establish
general authoring success, billing savings or readiness for a public API rollout.

## Automated checks

Focused tests cover stopping, budgets, fresh feedback, complete final checks,
protected/execution failure handling, missing/racing sources, checker failures,
color-check failures and refreshed evidence. A browser integration test starts
with a passing import, introduces both hover and inherited-value failures, checks
a touch regression after an incomplete fix, and restores the verified baseline.

## Recorded result — 2026-11-01

Implementation commits: `31183e89c`, `2120f151c`; the latter is the frozen run
revision. Client `codex-cli 0.166.0-alpha.5.1`, Chromium `156.0.8078.4`, Luna with
low reasoning, sequential calls and two attempts of at most 120 seconds per case.

The first preflight rejected differences from the prior built artifacts before
any model call. The shared checkout had changed 24 artifact hashes, including the
native engine, JavaScript engine, preset and some MCP/schema files. The run then
froze the current artifacts, recorded every old/new hash in `artifactChanges`,
and required an unchanged evaluator/color-comparison source. Both controlled
counterfactuals above were rerun successfully with the current tools. All seven
selected failures reproduced before their new repair attempts. Tool/source hashes
remained fixed during the completed run. No shared build artifact was restored or
overwritten. This version difference is an additional reason not to infer an
A/B improvement from the old campaign.

| Prior failed trial | First recheck after repair | Second recheck | Final |
| --- | --- | --- | --- |
| `seed-03-gpt-6-luna-b` | Pass | Not needed | Pass |
| `seed-05-gpt-6-luna-a` | Pass | Not needed | Pass |
| `seed-05-gpt-6-luna-b` | Fail: 14 new checks | Fail: 20 checks | Failed, budget exhausted |
| `seed-06-gpt-6-luna-b` | Fail: unresolved class | Pass | Pass |
| `seed-07-gpt-6-luna-b` | Pass | Not needed | Pass |
| `seed-08-gpt-6-luna-a` | Fail: unresolved class | Pass | Pass |
| `seed-08-gpt-6-luna-b` | Fail: unresolved class | Pass | Pass |

**Six of seven final snapshots passed** after 11 model calls and 18 host browser
checkpoints (seven initial reproductions plus one after every edit). Three passed
after one repair and three after two. There were no model-turn failures, timeouts,
protected-file violations, unverified outcomes or missing usage records. All 11
model turns visibly read fresh feedback; none attempted to launch a browser.
Input tokens totaled 2,153,640, including 1,926,400 cached input tokens; output
was 16,683 tokens. These are usage counts, not billing or savings estimates.

The failed `seed-05-gpt-6-luna-b` illustrates why full rechecks matter. Its first
edit fixed the unresolved hover class and all four hover comparisons, but added
`bg-blue-700` as a resting utility. That overrode the component's resting blue-600
background, breaking desktop rest/focus/disabled and touch rest/tap: 14 newly
failing check IDs. The host rejected it and sent the new source-bound evidence.
The second edit restored unsupported Tailwind spellings and ended with 20 failed
checks, including class recognition and migration. The runner preserved that
failed state and stopped at the declared budget; it did not declare success,
select a more favorable attempt or manually repair the experiment afterward.

Three other cases resolved their computed-style differences on the first edit
but left an unresolved class. Their second attempts used the updated class
feedback and passed the full checks. This demonstrates the value of keeping both
browser comparisons and class diagnostics in the completion gate. It does not
isolate whether feedback, more time, guidance, current tool versions or model
variation accounts for the additional successful repairs.

Validation: all 29 focused tests, scoped script ESLint, `check:ai-context` and diff
checks passed. Independent audit matched checkpoint source/generated-CSS hashes,
feedback and evidence contents, protected files, original snapshot/assessment
hashes, prompt-to-checkpoint freshness, raw token usage and final statuses. The
six counterfactual variants retained the expected fail/fail/pass pattern in each
cause category. Source CSS/runtime behavior and the evaluator were not changed
by this work. Existing public APIs and the default single-repair experiment are
unchanged; the new host-checkpoint runner is opt-in.

External evidence:
`/Users/aron/master-css-evaluations/2026-11-01-repair-recheck`.
The archive retains all checkpoint workspaces, model events, protected inputs,
original provenance, current frozen sources/tools, old/new artifact hashes,
counterfactual variants, validation, audit helpers and the rejected preflight log.
Observation SHA-256:
`92ef7361b9415d26aff80d44e8e5c55386f6f331ffb3f1771f02c2aac2854fab`.
