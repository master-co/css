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
