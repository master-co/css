# Reconcile repair conclusions with class inspection

The [lint v5 repair cohort](lint-repair-cohort.md) left `seed-05-gpt-6-luna-b`
unrepaired. Its second proposal reported clean markup lint but ignored inspection
evidence for unsupported replacement classes. Both regressive proposals were
rejected; the original six failed checks remained. Lint coverage was mostly
understood, but class-recognition claims were not supported by the actual reports.

## Workflow change

The internal completion prompt and source-bound class checklist now explicitly
separate lint, class recognition and browser behavior. The model must inspect the
final edited markup with the current project stylesheets, reconcile per-file
discovered classes, requested missing-CSS evidence and diagnostics, and rerun
inspection after markup/stylesheet edits including lint autofix. A zero-diagnostic
lint report or successful build cannot establish class registration.

The conclusion must connect added/replaced classes to evidence: generated utility
or native declaration, real native CSS selector, or unresolved/unchecked spelling.
It must disclose conflicting or missing evidence instead of claiming a familiar
Tailwind spelling is registered. Native selectors must retain real behavior and
dependencies; adding dummy selectors or removing working hooks to silence a report
is not a repair. Recognition still does not establish cascade winners or state
behavior. Lint scope must name checked inputs and distinguish diagnostic counts.

Inspection's `discovered.invalid` and `discovered.usedNative` are not disjoint:
a class may be unrecognized as a generated utility but backed by native CSS.
The workflow therefore requires correlation with actual source occurrences and
native rules, rather than treating every aggregate candidate or invalid entry as
an unsupported markup class. Empty `missingCSS.checked` is not proof of coverage.

This changes guidance only. The host checker, reporting scorer, regression gate,
official skill, public tools and lint policy remain unchanged. The workflow does
not introduce a TypeScript CSS validator or accept model claims as host evidence.

## Fixed targeted validation

Before model calls, freeze sources, tool artifacts, client/browser and model
arguments. Run **two independent replications**, each starting from the same
original failed `checkpoint-0.work`, with Luna low reasoning and at most two
120-second attempts. Run sequentially, without feedback between replications.
Do not extend the budget or replace failures after seeing outcomes.

```sh
node --import tsx scripts/ai-authoring/trials/guarded-run.mjs --source /absolute/prior-recheck-run --case seed-05-gpt-6-luna-b --cohort-case --attempts 2 --output /absolute/new-run
```

Cohort-case mode checks identical initial sources and scored checks and omits
historical replay. Each proposal still faces every task check and the unchanged
no-new-failures gate. Independently copy, rebuild and recheck each final retained
implementation with its actual retained answer. Audit source/CSS hashes, parent
copies, protected files, decisions, feedback freshness, command outputs and usage.

Manually compare each final answer with final markup inspection, lint coverage,
source edits and host results. Record whether inspection occurred after the last
edit, whether changed spellings have generated/native evidence, and whether the
answer contradicts diagnostics or claims browser verification prematurely.
Retain generic or absent explanations as insufficient evidence, not correct
interpretations. Do not silently revise keyword-based repair scores based on
this separate reporting audit.

A focused integration test must reproduce zero-diagnostic lint alongside actual
invalid classes, preserve a genuine native CSS hook, and show that unchanged host
checks reject unsupported names even when browser appearance matches. Correcting
the markup must pass fresh inspection and host checks. Run the completion,
checkpoint and regression tests, scoped script ESLint, AI context and diff checks.

This targeted result cannot be combined with earlier cohort passes to claim a
new 7/7 outcome. Two fresh samples do not establish general reliability or isolate
the causal effect of revised guidance. Preserve failed calls and audit findings.

## Recorded result — 2026-11-01

Frozen implementation: `2178ae78a`. Both planned replications completed: **one
fully passed and one remained failed**, with no unverified execution. Three model
calls produced seven host assessments (two initial, three proposals, two independent
final copies). One regressive proposal was rejected. Both retained implementations
had **zero new failure atoms** relative to their original failed snapshots.

| Replication | Calls | Rejected proposals | Independent retained verification |
| --- | ---: | ---: | --- |
| 1 | 1 | 0 | All checks passed; six original failures resolved |
| 2 | 2 | 1 | Four hover failures remain; class and hover-capability checks resolved |

All 422 tracked tool artifacts matched the preceding lint v5 cohort. Initial
sources and scored checks were identical to the archived original. Scorer,
adoption gate, runner, official skill and tool implementations were unchanged.
Client `codex-cli 0.166.0-alpha.5.1`, Chromium `156.0.8078.4`, Luna low reasoning,
two attempts and the 120-second limit matched the preceding runs.

### Class evidence and final conclusions

All three proposals were inspected after their final source edit, including any
lint autofix. The raw model outputs contain nine v5 lint reports and ten inspection
reports or explicitly selected projections. Full final inspection files written by
the model were also preserved separately, without treating unseen fields as read.

Manual review found supported class-recognition claims in all three final answers.
None used lint success as proof of class registration or claimed host browser
checks had already run. All named the actual lint inputs; two explicitly separated
checked-file and diagnostic-file counts, while the other named one checked file
and zero diagnostics. This is a narrow class/scope finding, not proof that every
explanation or behavioral claim was correct.

Replication 1 introduced `hover-blue-700` as a project `@utility` nesting `:hover`
inside `(hover: hover)`. It preserved the existing geometry, color, reset and
other state rules. Its first inspection request accidentally omitted parentheses
from five native-declaration spellings. The model corrected the requested spellings,
ran lint autofix, rebuilt and reinspected all seven actual markup classes. Final
evidence showed all seven generated and present. Its answer disclosed the two
informational `CSS_VALUE_UNKNOWN` notes for token-backed background values and
deferred browser verification. Independent host checks passed every task check.
One sentence loosely attributed retained reset/token definitions to the import;
the explicit retained definitions actually live in `app.css`. This did not affect
class recognition or measured behavior.

Replication 2's first proposal added the registered `bg-blue-700` directly to the
button and also used it in a conditional native selector. Its final answer correctly
reported generated and native evidence, plus lint's conflicting-utilities warning.
However, it dismissed that warning as expected for a state hook and falsely claimed
resting color and touch behavior were preserved. The unconditional generated class
overrode the resting color. Host checks found **14 new background-color failure
atoms** across rest, focus, disabled and touch states; the gate rejected the proposal.
Thus valid class recognition did not prevent a behavioral regression proposal.

Its second attempt started from the retained original. It replaced the unresolved
spelling with `blue-action-hover`, backed by a real native selector in `components`.
The final answer correctly explained that the name is not a registered utility:
it appears in both `discovered.invalid` and `discovered.usedNative`, with
`missingCSS.present` reason `native-css`. It distinguished the six generated
markup classes, the native hook and informational token-value uncertainty. It
reported one linted file, zero diagnostic files and pending host browser checks.

The remaining mistake was cascade reasoning: the model's interim explanation said
`components` had higher priority than `utilities`. It also described the rejected
rule as if it were in the retained source, although the actual edit used the correct
retained snapshot. The new component-layer hover rule lost to the resting utility.
Independent host checks retained four background-color failures, one for each
theme/viewport hover combination. Class recognition and hover capability improved,
so the unchanged gate adopted strict progress with no new failures; it did not
mark the repair complete. No extra attempt was added after the budget ended.

### Validation, audit and limits

Nine distinct completion/checkpoint/regression tests passed. The added integration
test proves that default lint can report zero diagnostics while four unsupported
markup classes remain; real inspection and the host class check still identify
them. A genuine native `fallback` selector remains valid, and removing only the
unsupported names passes both fresh inspection and the unchanged browser checks.
The reverse transition is rejected as a class regression.

The first test run passed eight tests and exposed an incorrect test assumption:
`fallback` appeared in both `invalid` and `usedNative`. The assertion and guidance
were corrected to reflect the actual report, then all three completion tests passed.
Both logs are retained. The six unchanged checkpoint/regression tests had passed
in the first run. Scoped script ESLint passed via the installed Node entry point;
the initial `bun exec eslint` could not resolve the command. AI context and scoped
diff checks passed. No workspace package code changed, so package lint/builds were
not rerun.

Audits found no source/artifact drift, decision inconsistencies, protected-file
changes, model timeouts, guard violations or missing usage. They reconciled raw
usage, fresh completion feedback, initial/parent/proposed/retained source hashes,
CSS hashes and independent final verification. Input totaled 950,202 tokens,
including 864,768 cached input tokens; output totaled 6,479 tokens. These are
usage counts, not a billing or causal-efficiency estimate.

The focused class-evidence behavior improved in these observations, but overall
repair success remains unstable. One rejected proposal still misread a conflict,
and one retained proposal still misread layer priority. The next targeted work is
to reconcile conflict diagnostics and actual winning declarations with state
claims, including distinguishing retained source from rejected evidence. Public
tools and the official skill are unchanged. The seven-case cohort was not rerun,
and the unchanged keyword-based reporting scorer does not establish answer truth.

Archive: `/Users/aron/master-css-evaluations/2026-11-01-inspect-reconciliation`.
It contains frozen sources/tools, original and preceding failure provenance,
both complete runs, prompts/events, all proposals, model inspection reports,
independent verification, automated audits, per-turn manual review and validation
logs. Observations SHA-256:
`3b14d67c49f25a36cfba8d5796ccbb76300332d835d4f356c96960b575c7371f`.
