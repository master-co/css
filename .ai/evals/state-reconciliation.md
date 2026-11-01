# Reconcile conflicts, layers and state behavior

The [inspection reconciliation evaluation](inspect-reconciliation.md) resolved
class recognition but retained four hover failures in its second replication.
Its component-layer native hover selector lost to the normal resting utility.
An earlier proposal had added an unconditional color utility, dismissed a conflict
warning, and introduced 14 background-color regressions that the gate rejected.

## Workflow change

The completion checklist now links failed properties to the source-bound raw
browser evidence. It lists property names only; it does not infer winning rules
or introduce another CSS resolver. Missing capture evidence remains unverified.

The prompt requires the current retained source after a rejection, candidate
declarations and computed values, actual built CSS, declared layer order,
importance and conditions to be reconciled before state claims. Normal declarations
in later layers outrank earlier layers before specificity; the standard order
places utilities after components. Reopening a layer does not promote it. The
guidance distinguishes important declarations' reversed layer order and unlayered
normal declarations; it does not recommend bypasses using importance or unlayered
overrides. Other cascade factors must be considered where applicable.

Conflict warnings require declaration/condition review. A utility also used as a
conditional selector hook can still emit its ordinary unconditional declaration.
Recognition, a zero exit status or sorting classes does not resolve that conflict.
The conclusion must separate existing host observations from post-edit predictions
for rest, hover, focus, disabled and touch states, retaining all previously passing
properties. Fresh full host checks still determine adoption and completion.

The public tools, official skill, scorer and regression gate are unchanged. The
internal completion payload gains a `stateReview` field; prompts gain explicit
state/cascade reconciliation. No CSS semantics, lint rules or tool schemas change.

## Fixed targeted protocol

Run two independent replications from the **latest retained four-failure snapshot**
of inspection-reconciliation replication 2, not the older six-failure starting
point. Each uses Luna low reasoning and at most two sequential 120-second calls.
Do not add retries, share replication outcomes or select only passing proposals.

An external input bundle adapts that archived retained snapshot to the existing
runner's recheck layout: `checkpoint-0.work` is a byte-preserving copy of the
retained workspace, `checkpoint-0.json` is its independent final verification,
and the baseline and original task prompt are unchanged. The bundle records parent
protocol/result/verification hashes and its source provenance. This is a new start
point, not a regraded historical campaign. No model output or scored expectation
is fabricated. Cohort-case mode verifies identical starting sources and checks.

```sh
node --import tsx scripts/ai-authoring/trials/guarded-run.mjs --source /absolute/retained-input-bundle --case seed-05-gpt-6-luna-b --cohort-case --attempts 2 --output /absolute/new-run
```

Freeze sources/tools/client/browser before calls. Independently rebuild and check
each retained output, audit source/CSS hashes, protected files, parent copies,
decisions, prompt freshness and usage. Manually review the emitted rules, inspected
classes, lint conflicts, declared layers and state claims, including rejected
answers. Distinguish supported static predictions from actual host observations.
No missing evidence, generic claim or keyword-based reporting pass proves a
correct explanation. Preserve all failed and unverified outcomes.

Focused tests cover normal versus important/unlayered priority, reopening layers,
a recognized native hook losing to a utility, conflict diagnostics for an added
unconditional utility, state regressions, and a complete conditional repair with
the unchanged host gate. Run related completion/checkpoint/regression tests,
scoped script ESLint, AI context and diff checks. This targeted study is not a
seven-case cohort rerun or a causal reliability estimate.

## Recorded result — 2026-11-01

Frozen implementation: `b970ce93b`. Both planned replications **passed on the first
proposal**, and independent final rebuilds passed every unchanged task check.
Each started with four hover failures and ended with zero. There were two model
calls, six formal host assessments and **zero new retained failure atoms**. Neither
proposal required rejection or a second attempt. A separate preflight assessment
reproduced the exact starting checks without invoking a model.

| Replication | Calls | Initial failures | Final failures | New retained failures |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1 | 4 | 0 | 0 |
| 2 | 1 | 4 | 0 | 0 |

The starting source hash was
`cee4b72ac8de67ff41baae308c2ef6c4aa54726c52c09a446212326c1a1c12c3`.
The adapter preserved the preceding replication's retained source and independent
verification exactly. Preflight and both initial assessments confirmed identical
editable-source hashes and scored checks. This result starts later in the repair
history than the preceding six-failure trials and must not be presented as a
controlled comparison with them.

Both proposals made the same one-line stylesheet change: the existing native
hover rule moved from `@layer components` to `@layer utilities`. Markup, script,
tokens, reset, focus/disabled rules and the `(hover: hover)` condition were unchanged.
The resting utility and hover selector now share a layer; the more specific native
hover selector wins when its conditions match. Host checks confirmed hover in both
themes and viewports, as well as all previously passing rest, focus, disabled,
touch, class and nonvisual checks. No importance or unlayered override was added.

All 422 tracked tool artifacts matched the preceding inspection evaluation.
The task prompt, runner, scorer, regression gate and official skill were unchanged.
Client `codex-cli 0.166.0-alpha.5.1`, Chromium `156.0.8078.4`, Luna low reasoning
and the two-attempt/120-second budget were retained. Only internal completion
guidance, its additive state-review presentation and focused tests changed.

### Explanation and evidence audit

Both answers correctly identified normal declarations in `utilities` outranking
those in `components`. Both inspected final classes after the last edit, correctly
distinguished six generated classes from the native `blue-action-hover` hook, and
described post-edit state behavior as predictions pending host verification.
Both reported actual selected lint inputs without claiming whole-project coverage.

The raw outputs contain three v5 lint reports and four inspection reports or
explicit projections. The first replication requested all seven final spellings
in a full report; the second also requested all seven and printed a projection.
The second model's complete saved inspection is archived separately; unseen fields
are not treated as evidence the model read. Final host verification is independent
of these model-run reports.

Manual review still found procedural and reporting gaps:

- Replication 1 explicitly explained the same-layer specificity tie-break and
  accounted for rest, hover, focus, disabled, touch-rest and touch-tap. It correctly
  reported clean lint on two selected files, but omitted the earlier three-file
  lint error in unchanged `app.js` (`CSS_DIRECTIVE_ERROR` for dynamic `w(`) and the
  informational `CSS_VALUE_UNKNOWN` inspection note. It built and inspected after
  the edit, but did not visibly read final `output.css` or request included CSS.
  A shell quoting error was corrected by successful standalone lint/inspect calls.
- Replication 2 read final generated CSS and authored rules and disclosed the
  informational token-value note. Its broad layer explanation was correct but did
  not explicitly explain the same-layer specificity tie-break. Its own JSON
  projection labelled `x.css` metrics as `layerOrder` and read absent `rules[].layer`
  fields; these projection fields are not actual layer evidence. The earlier host
  capture and the emitted/authored CSS supply separate evidence. Its final answer
  kept browser verification pending and correctly identified the native hook.

These gaps do not overturn the independently observed repair passes, but prevent
claiming complete compliance with the evidence-review procedure or universally
truthful final summaries. The unchanged keyword-based reporting scorer does not
detect all omissions. No new conflicting-utilities warning occurred in these two
proposals, so the conflict-reconciliation branch was exercised by integration
tests and prior archived failures, not by a new live conflicting proposal.

### Checks, provenance and limits

Eleven distinct completion/checkpoint/regression/state-review tests passed. The
browser priority test verifies normal versus important precedence and unlayered
normal rules, including reopening an earlier layer after a later layer's rule.
The integrated control verifies a recognized native hook losing to a utility,
a conflict warning despite lint exit zero, rest/focus/disabled/touch regressions
from an unconditional utility, and a complete repair under the unchanged gate.

The first run passed ten tests and exposed a fixture error in the new integration
test: the positive control's resting color was authored native Tailwind CSS rather
than a registered token utility, so it did not emit the expected conflict warning.
The fixture now explicitly registers the two color tokens and replaces the native
resting selector, preserving the immutable source baseline. Both state-review tests
then passed. Both logs are retained; no product behavior was changed to pass them.
Scoped script ESLint, AI context and diff checks passed. No workspace package code
changed, so package builds/lint were not rerun.

Automated audit found no source/artifact drift, decision inconsistencies, stale
completion feedback, protected-file changes, model timeouts or missing usage. It
verified parent copies, source/CSS hashes and independent retained checks. Input
totaled 376,539 tokens (321,152 cached), with 2,447 output tokens. These are raw
usage counts rather than a billing or efficiency comparison.

The result supports the targeted layer repair from this retained snapshot. It
does not establish seven-case success, general stability, handling of every
conflict, or a causal effect of the guidance. Full-cohort replication and more
reliable disclosure of prior diagnostics remain separate follow-up work.

Archive: `/Users/aron/master-css-evaluations/2026-11-01-state-reconciliation` contains
frozen sources/tools, the parent run and retained-input bundle, preflight, both
formal runs, all source copies and prompts/events, independent verification,
automated audits, manual classifications and validation logs. Observations SHA-256:
`9f5a80ba9b89a4b3c6a3979a2be72c32ce938132118b3ea6d903eaca3fec44d3`.

The bounded [final acceptance and delivery](final-acceptance.md) subsequently
completed all seven original cases, with no new measured failures, and consolidated
the official skill and public documentation. It closes this development cycle
while preserving the explanation and coverage limitations recorded above.
