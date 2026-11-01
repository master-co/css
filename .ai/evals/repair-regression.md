# Reject regressive repair proposals

This follows the [host recheck investigation](repair-recheck.md). The remaining
case was `seed-05-gpt-6-luna-b`: a hover import with six initial failing checks,
14 failures after the first repair and 20 after the second.

## Failure mechanism

The first model turn recognized a layer conflict but inserted `bg-blue-700` as an
unconditional utility. After lint reported conflicting background classes, it
removed the resting `bg-blue-600` utility and placed that resting declaration in
components. The unconditional blue-700 utility still won outside hover. Build and
lint passed while rest/focus/disabled/touch behavior regressed. The second turn
recognized the resting-color error but restored the original Tailwind markup,
reintroducing ten unsupported class names and losing the migration check.

The old host loop correctly reported these failures, but **continued from the
regressed candidate**. Its next-turn feedback was fresh, yet its working files
already contained the bad change. It also summarized new failures by check ID;
a new failing property inside an already failing viewport/state check would not
appear as a new check. The complete raw differences were present, but there was
no adoption gate or retained source to prevent compounding the regression.

## Adoption rule

`repair-regression.mjs` compares the current candidate with the last retained
checkpoint, using the unchanged browser/class evaluator. It distinguishes:

- Property failures by check ID, node index and property name.
- Unresolved classes by class spelling.
- Other failures by check ID.

Reject any new failure, even when the total failure count falls. Reject missing,
added or duplicate check coverage, changed expectations for an existing property,
unverified execution, and proposals that resolve nothing. A partially successful
proposal is adopted only when its measured failure set is a strict subset of the
retained set. A final pass still requires every original functional, styling,
accessibility and browser check. This is a conservative adoption policy, not a
CSS semantic fallback, numeric-distance optimizer or proof about unmeasured states.
Changes to an already failing value are not assigned an improvement score.

## Isolated proposal workflow

Each model attempt receives a fresh copy of the retained workspace. The host
records its input hashes and a unified diff of the three editable files, rebuilds
and runs all checks, then records an explicit adoption/rejection decision. No
candidate edits the retained workspace in place. A rejected candidate's files,
full evidence, diff, answer and failure details remain archived. The next attempt
starts from retained sources and receives the rejection reason and a bounded diff
(up to 16,000 characters, with a truncation marker). The complete diff remains in
the artifact. Accepted partial progress becomes the next retained checkpoint.

The prompt asks for a focused patch, preservation of working classes and passing
states, and treats source.html as a behavior reference rather than replacement
markup. These instructions help propose changes; the host's measured adoption
rule enforces the boundary. Protected-file/source/tool checks remain in place.
The runner emits a distinct `retained.work` and reports every rejected proposal;
it never describes a rejected candidate as the final repaired state. Exhaustion
leaves the retained failures explicit. Infrastructure or coverage uncertainty
stops with `unverified`, even if the retained snapshot is still available.

## Validation protocol

```sh
node --import tsx scripts/ai-authoring/trials/guarded-run.mjs --source /absolute/prior-recheck-run --case seed-05-gpt-6-luna-b --replay-only
node --import tsx scripts/ai-authoring/trials/guarded-run.mjs --source /absolute/prior-recheck-run --case seed-05-gpt-6-luna-b --attempts 2
```

Replay the original checkpoint and both archived bad proposals with current,
frozen artifacts and the unchanged evaluator. Compare both bad proposals to the
original retained checkpoint. Do not alter old verdicts or source archives.
Then give the originating Luna model at most two fresh 120-second attempts from
that same initial checkpoint, with the original skill and CLI. Freeze code,
model arguments and tools before model invocation; record any artifact drift
from the prior run. Verify proposal copies, retained-source integrity, diffs,
coverage decisions, source-bound feedback and usage against raw events.

This is one targeted case with revised guidance and extra repair opportunities,
not an A/B estimate or a general success-rate claim. The retained original is
still a failing implementation; preserving it does not mean the bug was fixed.
No public CLI/MCP API, official skill, compiler behavior or scoring threshold is
changed. The earlier recheck runner remains available without this opt-in policy.

## Recorded result — 2026-11-01

Frozen implementation: `971d663c0`. Client `codex-cli 0.166.0-alpha.5.1`, Chromium
`156.0.8078.4`, `gpt-6-luna` with low reasoning, two sequential attempts capped at
120 seconds each. All 422 tracked tool artifacts matched the previous recheck
run; the evaluator/color-comparison sources were unchanged.

The replay-only preflight rejected both archived bad candidates. The first added
14 failure atoms; the second added 118 relative to the retained initial source.
These are property/class/check atoms, **not** 118 separate check IDs. Neither
candidate replaced the original. An independent minimal positive control removed
the unsupported hover class and added a capability-gated hover rule in utilities;
it passed every task check and was accepted. This control was not supplied to the
model. Both historical proposals were replayed again during the targeted run.

| New model proposal | Remaining failed checks | New failure atoms | Decision |
| --- | ---: | ---: | --- |
| Initial retained snapshot | 6 | — | Existing failure |
| First edit | 4 | 0 | Accept partial progress |
| Second edit | 0 | 0 | Accept verified repair |

The first edit removed `hover:bg-blue-700` and added the capability-gated native
hover rule, resolving recognition and hover-capability checks. It still placed
that rule in components, so the resting utility continued to win in four desktop
hover comparisons. Since no other state regressed, this partial improvement was
retained. The second edit moved **only the gated hover rule** to utilities,
keeping the resting `bg-blue-600`, reset, geometry, focus and disabled styles.
All original checks then passed, including touch and class recognition.

There were two model calls and five host assessments in the targeted run: the
initial source, two archived bad candidates and the two new proposals. Both new
proposals were adopted; zero new model proposals were rejected. Rejection and
retry-from-retained behavior were exercised by archived replays, unit tests and
the browser regression test, rather than by a rejection during these two new
model turns. The successful outcome cannot be attributed to the gate alone:
guidance and model sampling also differed from the earlier run.

Both turns visibly read current feedback. There were no model-turn failures,
timeouts, protected-file violations, coverage mismatches or unmeasured usage.
Input totaled 369,924 tokens, including 330,112 cached input tokens; output totaled
2,472 tokens. These are raw usage counts, not a savings estimate. Audit recomputed
every adoption decision and verified initial copies, proposal parent hashes,
retained-source integrity, source/generated-CSS hashes, refreshed evidence,
prompt freshness, protected files and raw usage. The final retained copy matches
the fully passing second proposal; all rejected historical candidates remain
separately archived. The original failed campaign was not modified or regraded.

Six focused tests passed, including a browser test that detects a touch regression
inside a partial fix. The three policy tests were rerun after adding the explicit
execution-failure guard. Scoped ESLint, `check:ai-context` and diff checks passed.
This remains an opt-in repository workflow, not a public auto-repair guarantee.
Its evidence covers the evaluator's measured states; it cannot establish behavior
for states, properties or dynamic content outside that coverage.

Archive: `/Users/aron/master-css-evaluations/2026-11-01-repair-regression`.
It retains the preflight replay, positive control, original case provenance,
frozen code/tools, prompts/events, all proposed/retained workspaces, unified diffs,
checkpoint assessments, explicit decisions, usage and audit helpers.
Targeted result SHA-256:
`f40e73b09a2abd2ff2e035f7db8096852dc74198674e8553a8d2524b4ead4d24`.

The subsequent [seven-case guarded cohort](guarded-cohort.md) starts afresh from
every original failed checkpoint. It records six passes, one unresolved failure,
three rejected proposals and zero new failures in retained outputs. The targeted
success above did not reproduce for the remaining case in that cohort; see the
full report for the reporting-check rejection and the limits of this comparison.
